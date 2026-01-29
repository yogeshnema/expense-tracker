import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from "recharts";

const API = "http://127.0.0.1:8000";

const COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#A855F7", "#06B6D4"];

const cardStyle = {
  background: "#ffffff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  marginBottom: 25
};

const inputStyle = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  marginRight: 10
};

const buttonStyle = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold"
};

function App() {
  // ---------- AUTH ----------
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isRegister, setIsRegister] = useState(false);

  // ---------- DATA ----------
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
  }, []);

  const axiosAuth = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${token}` },
  });

  // ---------- AUTH ----------
  const handleRegisterLogin = async () => {
    try {
      const endpoint = isRegister ? "/register" : "/login";
      const res = await axios.post(API + endpoint, { username, password });
      localStorage.setItem("token", res.data.access_token);
      setToken(res.data.access_token);
    } catch {
      alert("Authentication failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  // ---------- LOAD ----------
  const loadData = async () => {
    if (!token) return;
    setExpenses((await axiosAuth.get("/expenses")).data);
    setSummary((await axiosAuth.get("/summary")).data);
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // ---------- ACTIONS ----------
  const addExpense = async () => {
    if (!amount || !category) return;
    await axiosAuth.post("/expenses", {
      amount: Number(amount),
      category,
      description,
      date
    });
    setAmount("");
    setCategory("");
    setDescription("");
    loadData();
  };

  const addBudget = async () => {
    if (!budgetCategory || !budgetAmount) return;
    await axiosAuth.post("/budget", {
      category: budgetCategory,
      budget: Number(budgetAmount),
    });
    setBudgetCategory("");
    setBudgetAmount("");
    loadData();
  };

  // ---------- CHART DATA ----------
  const barData = summary.map(s => ({
    category: s.category,
    Spent: s.spent,
    Budget: s.budget
  }));

  const pieData = expenses.reduce((acc, e) => {
    const found = acc.find(x => x.name === e.category);
    found ? found.value += e.amount : acc.push({ name: e.category, value: e.amount });
    return acc;
  }, []);

  // ---------- LOGIN ----------
  if (!token) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
        fontFamily: "Arial"
      }}>
        <div style={{ ...cardStyle, width: 320 }}>
          <h2 style={{ textAlign: "center" }}>{isRegister ? "Register" : "Login"}</h2>
          <input style={{ ...inputStyle, width: "100%", marginBottom: 10 }} placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <input style={{ ...inputStyle, width: "100%", marginBottom: 15 }} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <button style={{ ...buttonStyle, width: "100%" }} onClick={handleRegisterLogin}>
            {isRegister ? "Register" : "Login"}
          </button>
          <p style={{ textAlign: "center", marginTop: 15, color: "#6366F1", cursor: "pointer" }} onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? "Already have an account?" : "Create new account"}
          </p>
        </div>
      </div>
    );
  }

  // ---------- MAIN ----------
  return (
    <div style={{
      minHeight: "100vh",
      padding: 30,
      fontFamily: "Arial",
      background: "linear-gradient(180deg, #F9FAFB, #EEF2FF)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ color: "#4F46E5" }}>💸 Expense Manager</h1>
        <button onClick={logout} style={{ ...buttonStyle, background: "#EF4444" }}>Logout</button>
      </div>

      <div style={cardStyle}>
        <h3>➕ Add Expense</h3>
        <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
        <input style={inputStyle} placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} />
        <input style={inputStyle} placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
        <input style={inputStyle} placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <button style={buttonStyle} onClick={addExpense}>Add</button>
      </div>

      <div style={cardStyle}>
        <h3>🎯 Set Budget</h3>
        <input style={inputStyle} placeholder="Category" value={budgetCategory} onChange={e => setBudgetCategory(e.target.value)} />
        <input style={inputStyle} placeholder="Budget Amount" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} />
        <button style={buttonStyle} onClick={addBudget}>Save</button>
      </div>

      <div style={cardStyle}>
        <h3>📋 Expenses</h3>
        <ul>
          {expenses.map((e, i) => (
            <li key={i}>
              {new Date(e.date).toLocaleDateString()} | <b>{e.category}</b> | ₹{e.amount} — {e.description}
            </li>
          ))}
        </ul>
      </div>

      <div style={cardStyle}>
        <h3>📊 Budget vs Spending</h3>
        <BarChart width={600} height={300} data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Spent" fill="#EF4444" />
          <Bar dataKey="Budget" fill="#22C55E" />
        </BarChart>
      </div>

      <div style={cardStyle}>
        <h3>🍰 Expense Distribution</h3>
        <PieChart width={400} height={300}>
          <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} label>
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>
    </div>
  );
}

export default App;
