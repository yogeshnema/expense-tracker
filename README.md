Expense Tracker — Full Stack App

A full-stack multi-user Expense Tracker application with authentication, budgeting, charts, and persistent storage.

Built with:

Frontend: React + Axios + Recharts

Backend: FastAPI

Database: SQLite

Auth: JWT Token based login

ORM Layer: SQLAlchemy + Databases (async)

🏗️ Architecture Overview
React Frontend  (Port 3000)
        │
        │  HTTP + JWT Token
        ▼
FastAPI Backend (Port 8000)
        │
        │  Async DB access
        ▼
SQLite Database (database.db)

🔐 Features
User System

User registration

Secure login

JWT authentication

Password hashing (Argon2)

Multi-user data isolation

Expenses

Add expense with:

Date (YYYY-MM-DD)

Category

Amount

Description

Per-user expense storage

Expense listing

Budgets

Set budget per category

Update budgets

Category-wise tracking

Analytics

Category spending charts

Budget vs spent summary

Remaining budget calculation

📁 Project Structure
expense-tracker/
│
├── backend/
│   ├── main.py
│   ├── database.db
│   ├── venv/
│   └── requirements.txt (recommended)
│
├── frontend/
│   └── expense-ui/
│       ├── src/
│       │   ├── App.js
│       │   ├── Login.js
│       │   ├── Dashboard.js
│       │   ├── components/
│       │   └── services/api.js
│       │
│       ├── public/
│       │   └── logo.png
│       │
│       └── package.json
│
└── README.md

⚙️ Backend — FastAPI
Tech Stack

FastAPI

SQLAlchemy (table schema)

Databases (async DB access)

SQLite

Passlib (Argon2 hashing)

Python-Jose (JWT)

▶ Run Backend
1️⃣ Go to backend folder
cd backend

2️⃣ Activate virtual environment

PowerShell:

.\venv\Scripts\Activate.ps1

3️⃣ Install dependencies
python -m pip install fastapi uvicorn databases sqlalchemy aiosqlite passlib[argon2] python-jose

4️⃣ Run server
python -m uvicorn main:app --reload


Server runs at:

http://127.0.0.1:8000


API docs:

http://127.0.0.1:8000/docs

🗄️ Database

SQLite file:

backend/database.db


Tables:

users
column	type
id	int
username	string
hashed_password	string
expenses
column	type
id	int
user_id	int
date	date
category	string
amount	float
description	string
budgets
column	type
id	int
user_id	int
category	string
budget	float
🎨 Frontend — React
Tech Stack

React

Axios

Recharts

CSS inline styling

JWT stored in localStorage

▶ Run Frontend
1️⃣ Go to UI folder
cd frontend/expense-ui

2️⃣ Install packages
npm install

3️⃣ Start UI
npm start


Runs at:

http://localhost:3000

🔑 Authentication Flow
Register → /register → returns JWT
Login → /login → returns JWT
JWT stored in browser localStorage
Axios sends token in Authorization header

Authorization: Bearer <token>


Backend verifies token for:

add expense

get expenses

set budget

summary

📡 API Endpoints
Auth
Register
POST /register

{
  "username": "user",
  "password": "pass"
}

Login
POST /login


Returns JWT token.

Expenses
Add Expense
POST /expenses

{
  "date": "2026-01-29",
  "category": "Food",
  "amount": 250,
  "description": "Lunch"
}

Get Expenses
GET /expenses


Returns current user expenses.

Budget
Set Budget
POST /budget

{
  "category": "Food",
  "budget": 5000
}

Summary
Category Summary
GET /summary


Returns:

[
  {
    category,
    budget,
    spent,
    remaining
  }
]

📊 Charts

Frontend uses:

Pie chart — category spending

Bar chart — budget vs spent

Data source: /summary

🌐 CORS Config

Backend allows:

http://localhost:3000


Configured in FastAPI middleware.

🚀 Future Improvements (Suggested)

Edit/Delete expenses

Monthly filters

Export to CSV

Admin user role

Password reset

Cloud DB (Postgres)

Docker deployment

User profile page

👨‍💻 Author

Created for academic and learning purposes.

Yogesh Nema
