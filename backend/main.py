from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date
import json
import os

app = FastAPI(title="Expense Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FILE_NAME = "expenses.json"

# ---------- Data Handling ----------
def load_data():
    if os.path.exists(FILE_NAME):
        with open(FILE_NAME, "r") as f:
            return json.load(f)
    return {"expenses": [], "budgets": {}}

def save_data():
    with open(FILE_NAME, "w") as f:
        json.dump(data, f, indent=4)

data = load_data()

# ---------- Models ----------
class Expense(BaseModel):
    amount: float
    category: str
    description: str

class Budget(BaseModel):
    category: str
    budget: float

# ---------- Routes ----------
@app.get("/expenses")
def get_expenses():
    return data["expenses"]

@app.post("/expenses")
def add_expense(expense: Expense):
    new_expense = {
        "date": str(date.today()),
        "amount": expense.amount,
        "category": expense.category,
        "description": expense.description
    }
    data["expenses"].append(new_expense)
    save_data()
    return {"message": "Expense added successfully"}

@app.post("/budget")
def set_budget(budget: Budget):
    data["budgets"][budget.category] = budget.budget
    save_data()
    return {"message": "Budget set successfully"}

@app.get("/summary")
def get_summary():
    spending = {}
    for e in data["expenses"]:
        spending[e["category"]] = spending.get(e["category"], 0) + e["amount"]

    summary = []
    for cat, bud in data["budgets"].items():
        summary.append({
            "category": cat,
            "budget": bud,
            "spent": spending.get(cat, 0),
            "remaining": bud - spending.get(cat, 0)
        })

    return summary
