from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from databases import Database
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Float, Date, ForeignKey, UniqueConstraint
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta

# ---------------- CONFIG ----------------
SECRET_KEY = "your_secret_key_here"  # Replace with a strong key in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# ---------------- APP ----------------
app = FastAPI(title="Multi-User Expense Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATABASE ----------------
DATABASE_URL = "sqlite:///./database.db"
database = Database(DATABASE_URL)
metadata = MetaData()

# Tables
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
    Column("amount", Float),
    Column("category", String),
    Column("description", String),
    Column("date", Date),
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

engine = create_engine(DATABASE_URL)
metadata.create_all(engine)

# ---------------- AUTH ----------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        query = users.select().where(users.c.username == username)
        user = await database.fetch_one(query)
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

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
    amount: float
    category: str
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
    query = users.insert().values(username=user.username, hashed_password=hashed_password)
    try:
        await database.execute(query)
    except Exception:
        raise HTTPException(status_code=400, detail="Username already exists")
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
async def login(user: UserLogin):
    query = users.select().where(users.c.username == user.username)
    db_user = await database.fetch_one(query)
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": db_user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}

# ---------------- EXPENSES ----------------
@app.post("/expenses")
async def add_expense(expense: ExpenseIn, current_user=Depends(get_current_user)):
    query = expenses.insert().values(
        user_id=current_user["id"],
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        date=datetime.today().date()
    )
    await database.execute(query)
    return {"message": "Expense added"}

@app.get("/expenses")
async def get_expenses(current_user=Depends(get_current_user)):
    query = expenses.select().where(expenses.c.user_id == current_user["id"])
    return await database.fetch_all(query)

# ---------------- BUDGETS ----------------
@app.post("/budget")
async def set_budget(budget: BudgetIn, current_user=Depends(get_current_user)):
    query = budgets.select().where(
        budgets.c.user_id == current_user["id"],
        budgets.c.category == budget.category
    )
    existing = await database.fetch_one(query)
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
    # Expenses
    query = expenses.select().where(expenses.c.user_id == current_user["id"])
    all_expenses = await database.fetch_all(query)
    spending = {}
    for e in all_expenses:
        cat = e["category"]
        spending[cat] = spending.get(cat, 0) + e["amount"]

    # Budgets
    query = budgets.select().where(budgets.c.user_id == current_user["id"])
    all_budgets = await database.fetch_all(query)

    summary = []
    for b in all_budgets:
        cat = b["category"]
        summary.append({
            "category": cat,
            "budget": b["budget"],
            "spent": spending.get(cat, 0),
            "remaining": b["budget"] - spending.get(cat, 0)
        })

    return summary
