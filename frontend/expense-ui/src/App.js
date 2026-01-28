import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from "recharts";

const API = "http://127.0.0.1:8000";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFF", "#FF6F91"];

function App() {
  // --- AUTH STATE ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isRegister, setIsRegister] = useState(false);

  // --- DATA STATE ---
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  // --- AXIOS INSTANCE WITH TOKEN ---
  const axiosAuth = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });

  // --- AUTH FUNCTIONS ---
  const handleRegisterLogin = async () => {
    try {
      const endpoint = isRegister ? "/register" : "/login";
      const res = await axios.post(API + endpoint, { username, password });
      localStorage.setItem("token", res.data.access_token);
      setToken(res.data.access_token);
      setUsername("");
      setPassword("");
      loadData(res.data.access_token);
    } catch (err) {
      alert(err.response?.data?.detail || "Error");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setExpenses([]);
    setSummary([]);
  };

  // --- LOAD EXPENSES & SUMMARY ---
  const loadData = async (authToken = token) => {
    if (!authToken) return;
    try {
      const axiosT = axios.create({
        baseURL: API,
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const expensesRes = await axiosT.get("/expenses");
      setExpenses(expensesRes.data);
      const summaryRes = await axiosT.get("/summary");
      setSummary(summaryRes.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (token) loadData();
  }, [token]);

  // --- ADD EXPENSE ---
  const addExpense = async () => {
    if (!amount || !category) return;
    await axiosAuth.post("/expenses", {
      amount: Number(amount),
      category,
      description,
    });
    setAmount(""); setCategory(""); setDescription("");
    loadData();
  };

  // --- SET BUDGET ---
  const addBudget = async () => {
    if (!budgetCategory || !budgetAmount) return;
    await axiosAuth.post("/budget", {
      category: budgetCategory,
      budget: Number(budgetAmount),
    });
    setBudgetCategory(""); setBudgetAmount("");
    loadData();
  };

  // --- CHART DATA ---
  const barData = summary.map((s) => ({
    category: s.category,
    Spent: s.spent,
    Budget: s.budget,
  }));

  const pieData = expenses.reduce((acc, e) => {
    const idx = acc.findIndex((item) => item.name === e.category);
    if (idx >= 0) acc[idx].value += e.amount;
    else acc.push({ name: e.category, value: e.amount });
    return acc;
  }, []);

  // --- RENDER ---
  if (!token) {
    // Login/Register Page
    return (
      <div style={{ padding: 30, fontFamily: "Arial" }}>
        <h2>{isRegister ? "Register" : "Login"}</h2>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleRegisterLogin}>{isRegister ? "Register" : "Login"}</button>
        <p style={{ cursor: "pointer", color: "blue" }} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Already have an account? Login" : "No account? Register"}
        </p>
      </div>
    );
  }

  // Main Expense Tracker Page
  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h2>Expense Tracker (User)</h2>
      <button onClick={logout}>Logout</button>

      {/* Expense Form */}
      <h3>Add Expense</h3>
      <input placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
      <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <button onClick={addExpense}>Add Expense</button>

      {/* Budget Form */}
      <h3>Set Budget</h3>
      <input placeholder="Category" value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)} />
      <input placeholder="Budget Amount" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
      <button onClick={addBudget}>Set Budget</button>

      {/* Expenses List */}
      <h3>Expenses</h3>
      <ul>
        {expenses.map((e, i) => (
          <li key={i}>{e.date} | {e.category} | ₹{e.amount} | {e.description}</li>
        ))}
      </ul>

      {/* Budget Summary */}
      <h3>Budget Summary</h3>
      <ul>
        {summary.map((s, i) => (
          <li key={i}>
            {s.category}: Budget ₹{s.budget}, Spent ₹{s.spent}, Remaining ₹{s.remaining}
          </li>
        ))}
      </ul>

      {/* Charts */}
      <h3>Spending vs Budget (Bar Chart)</h3>
      <BarChart width={600} height={300} data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Spent" fill="#8884d8" />
        <Bar dataKey="Budget" fill="#82ca9d" />
      </BarChart>

      <h3>Expenses by Category (Pie Chart)</h3>
      <PieChart width={400} height={300}>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </div>
  );
}

export default App;
