
# 📊 Expense Tracker — Full Stack (FastAPI + React + SQLite)

![Python](https://img.shields.io/badge/backend-FastAPI-green)
![React](https://img.shields.io/badge/frontend-React-blue)
![Database](https://img.shields.io/badge/database-SQLite-lightgrey)
![Auth](https://img.shields.io/badge/auth-JWT-orange)

A full-stack, multi-user **Expense Tracker Web Application** built using **FastAPI + React + SQLite**.  
Users can securely register, log in, record expenses with dates, define category budgets, and visualize spending using interactive charts.

Built as an academic + portfolio project.

---

# 🚀 Features

- 🔐 Secure login & registration (JWT auth)
- 👤 Multi-user isolation
- 💰 Add expenses with date, category, amount, description
- 📅 Date-based tracking
- 🗂 Category budgets
- 📊 Budget vs Spend analytics
- 🥧 Pie & Bar charts
- ⚡ Async backend APIs
- 🗄 SQLite storage
- 🎨 Modern React UI

---

# 🏗️ Architecture

React Frontend (Port 3000)  
↓ REST + JWT  
FastAPI Backend (Port 8000)  
↓ Async Queries  
SQLite Database

---

# 🧩 Tech Stack

## Frontend
- React
- Axios
- Recharts
- JWT storage
- Form UI

## Backend
- FastAPI
- SQLite
- SQLAlchemy Core
- Databases (async)
- Passlib
- JWT
- Pydantic

---

# 📸 Screenshots

## Login
![Login](screenshots/login.png)

## Add Expense
![Add Expense](screenshots/add-expense.png)

## Dashboard
![Dashboard](screenshots/dashboard.png)

## Charts
![Charts](screenshots/charts.png)

## Budget Summary
![Budget](screenshots/budget-summary.png)

---

# 🗄️ Database Schema

## Users
| Column | Type |
|--------|--------|
| id | Integer |
| username | String |
| hashed_password | String |

## Expenses
| Column | Type |
|--------|--------|
| id | Integer |
| user_id | FK |
| date | Date |
| category | String |
| amount | Float |
| description | String |

## Budgets
| Column | Type |
|--------|--------|
| id | Integer |
| user_id | FK |
| category | String |
| budget | Float |

Unique: (user_id, category)

---

# 🔐 Authentication Flow

1. Register/Login
2. Password hashed
3. JWT issued
4. Token stored
5. Sent in header:

Authorization: Bearer TOKEN

---

# 📡 API Endpoints

## Register
POST /register

## Login
POST /login

## Add Expense
POST /expenses

{
  "date": "YYYY-MM-DD",
  "category": "Food",
  "amount": 250,
  "description": "Lunch"
}

## Get Expenses
GET /expenses

## Set Budget
POST /budget

## Summary
GET /summary

---

# ⚙️ Setup

## Backend

python -m venv venv  
venv\Scripts\activate  
pip install fastapi uvicorn sqlalchemy databases aiosqlite passlib argon2-cffi python-jose  
uvicorn main:app --reload

## Frontend

npm install  
npm start

---

# 🔒 Security

- Argon2 hashing
- JWT tokens
- Per-user isolation

---

# 🚀 Future Improvements

- Edit/Delete expenses
- CSV export
- Monthly filters
- Admin role
- Docker deploy

---

# 👨‍💻 Author

Yogesh Nema
