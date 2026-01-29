from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from databases import Database
from sqlalchemy import (
    create_engine, MetaData, Table, Column,
    Integer, String, Float, Date, ForeignKey, UniqueConstraint
)
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import datetime as dt
import csv
from fastapi.responses import FileResponse

# ---------------- CONFIG ----------------
SECRET_KEY = "your_secret_key_here"  # change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ---------------- APP ----------------
app = FastAPI(title="Multi-User Expense Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATABASE ----------------
DATABASE_URL = "sqlite:///./database.db"
database = Database(DATABASE_URL)
metadata = MetaData()

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String, unique=True, index=True),
    Column("hashed_password", String),
)

expenses = Table(
    "expenses",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("date", Date),
    Column("category", String),
    Column("amount", Float),
    Column("description", String),
)

budgets = Table(
    "budgets",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("category", String),
    Column("budget", Float),
    UniqueConstraint("user_id", "category"),
)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
metadata.create_all(engine)

# ---------------- AUTH ----------------
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        query = users.select().where(users.c.username == username)
        user = await database.fetch_one(query)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------------- MODELS ----------------
class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ExpenseIn(BaseModel):
    date: dt.date = Field(..., example="2024-09-18")
    category: str
    amount: float
    description: str

class BudgetIn(BaseModel):
    category: str
    budget: float

# ---------------- EVENTS ----------------
@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

# ---------------- AUTH ROUTES ----------------
@app.post("/register", response_model=Token)
async def register(user: UserCreate):
    hashed_password = get_password_hash(user.password)
    try:
        await database.execute(
            users.insert().values(
                username=user.username,
                hashed_password=hashed_password
            )
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Username already exists")

    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
async def login(user: UserLogin):
    query = users.select().where(users.c.username == user.username)
    db_user = await database.fetch_one(query)

    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({"sub": db_user["username"]})
    return {"access_token": token, "token_type": "bearer"}

# ---------------- EXPENSES ----------------
@app.post("/expenses")
async def add_expense(
    expense: ExpenseIn,
    current_user=Depends(get_current_user)
):
    await database.execute(
        expenses.insert().values(
            user_id=current_user["id"],
            date=expense.date,
            category=expense.category,
            amount=expense.amount,
            description=expense.description
        )
    )
    return {"message": "Expense added"}

@app.get("/expenses")
async def get_expenses(current_user=Depends(get_current_user)):
    query = expenses.select().where(expenses.c.user_id == current_user["id"])
    return await database.fetch_all(query)

@app.get("/export-csv")
async def export_expenses_csv(user=Depends(get_current_user)):
    query = expenses.select().where(expenses.c.user_id == user["id"])
    rows = await database.fetch_all(query)

    if not rows:
        raise HTTPException(status_code=404, detail="No expenses to export")

    filename = f"expenses_{user['username']}.csv"

    with open(filename, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["date", "category", "amount", "description"])

        for r in rows:
            writer.writerow([
                r["date"],
                r["category"],
                r["amount"],
                r["description"]
            ])

    return FileResponse(
        path=filename,
        media_type="text/csv",
        filename=filename
    )

# ---------------- BUDGETS ----------------
@app.post("/budget")
async def set_budget(
    budget: BudgetIn,
    current_user=Depends(get_current_user)
):
    existing = await database.fetch_one(
        budgets.select().where(
            budgets.c.user_id == current_user["id"],
            budgets.c.category == budget.category
        )
    )

    if existing:
        query = budgets.update().where(
            budgets.c.user_id == current_user["id"],
            budgets.c.category == budget.category
        ).values(budget=budget.budget)
    else:
        query = budgets.insert().values(
            user_id=current_user["id"],
            category=budget.category,
            budget=budget.budget
        )

    await database.execute(query)
    return {"message": "Budget set"}

# ---------------- SUMMARY ----------------
@app.get("/summary")
async def get_summary(current_user=Depends(get_current_user)):
    exp_rows = await database.fetch_all(
        expenses.select().where(expenses.c.user_id == current_user["id"])
    )

    spending = {}
    for e in exp_rows:
        spending[e["category"]] = spending.get(e["category"], 0) + e["amount"]

    budget_rows = await database.fetch_all(
        budgets.select().where(budgets.c.user_id == current_user["id"])
    )

    return [
        {
            "category": b["category"],
            "budget": b["budget"],
            "spent": spending.get(b["category"], 0),
            "remaining": b["budget"] - spending.get(b["category"], 0),
        }
        for b in budget_rows
    ]
