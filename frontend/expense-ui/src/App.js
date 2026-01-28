import { useEffect, useState } from "react";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState([]);

  const API = "http://127.0.0.1:8000";

  const loadExpenses = async () => {
    const res = await fetch(`${API}/expenses`);
    setExpenses(await res.json());
  };

  const loadSummary = async () => {
    const res = await fetch(`${API}/summary`);
    setSummary(await res.json());
  };

  useEffect(() => {
    loadExpenses();
    loadSummary();
  }, []);

  const addExpense = async () => {
    if (!amount || !category) return;

    await fetch(`${API}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Number(amount),
        category,
        description
      })
    });

    setAmount("");
    setCategory("");
    setDescription("");

    loadExpenses();
    loadSummary();
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h2>Personal Expense Tracker</h2>

      <input
        placeholder="Amount"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />

      <input
        placeholder="Category"
        value={category}
        onChange={e => setCategory(e.target.value)}
      />

      <input
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <button onClick={addExpense}>Add Expense</button>

      <hr />

      <h3>Expenses</h3>
      <ul>
        {expenses.map((e, i) => (
          <li key={i}>
            {e.date} | {e.category} | ₹{e.amount} | {e.description}
          </li>
        ))}
      </ul>

      <hr />

      <h3>Budget Summary</h3>
      <ul>
        {summary.map((s, i) => (
          <li key={i}>
            {s.category}: Budget ₹{s.budget}, Spent ₹{s.spent}, Remaining ₹{s.remaining}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
