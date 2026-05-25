import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://a81fd281c6cc540058b0d231e29e135d-f64adcb3158c7529.elb.us-east-1.amazonaws.com/api";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("connecting...");

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    try {
      const res = await fetch(`${API_URL}/tasks`);
      setTasks(await res.json());
      setStatus("connected ✓");
    } catch {
      setStatus("backend unreachable ✗");
    }
  }

  async function addTask() {
    if (!input.trim()) return;
    await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: input }),
    });
    setInput("");
    fetchTasks();
  }

  async function deleteTask(id) {
    await fetch(`${API_URL}/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  }

  async function toggleTask(id, done) {
    await fetch(`${API_URL}/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !done }),
    });
    fetchTasks();
  }

  return (
    <div className="app">
      <header>
        <h1>🚀 K8s Task Manager</h1>
        <span className={`status ${status.includes("✓") ? "ok" : "err"}`}>
          {status}
        </span>
      </header>

      <div className="input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addTask()}
          placeholder="Add a task..."
        />
        <button onClick={addTask}>Add</button>
      </div>

      <ul className="task-list">
        {tasks.length === 0 && <li className="empty">No tasks yet!</li>}
        {tasks.map(t => (
          <li key={t.id} className={t.done ? "done" : ""}>
            <input type="checkbox" checked={t.done}
              onChange={() => toggleTask(t.id, t.done)} />
            <span>{t.title}</span>
            <button className="del" onClick={() => deleteTask(t.id)}>✕</button>
          </li>
        ))}
      </ul>

      <footer><p>React → Node.js → PostgreSQL · K8s Project · CI/CD V4 </p></footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
        .app { max-width: 600px; margin: 0 auto; padding: 2rem 1rem; }
        header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        h1 { font-size: 1.6rem; font-weight: 700; }
        .status { font-size: .75rem; padding: 4px 10px; border-radius: 20px; background: #1e293b; }
        .status.ok { color: #4ade80; border: 1px solid #166534; }
        .status.err { color: #f87171; border: 1px solid #991b1b; }
        .input-row { display: flex; gap: 8px; margin-bottom: 1.5rem; }
        input:not([type=checkbox]) { flex: 1; padding: 10px 14px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; color: #e2e8f0; font-size: 1rem; }
        button { padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600; }
        button:hover { background: #4f46e5; }
        .task-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .task-list li { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #1e293b; border: 1px solid #334155; border-radius: 10px; }
        .task-list li.done span { text-decoration: line-through; opacity: .5; }
        .task-list li span { flex: 1; }
        .empty { justify-content: center; opacity: .5; font-style: italic; }
        .del { padding: 4px 8px; background: transparent; color: #f87171; border: 1px solid #991b1b; border-radius: 6px; font-size: .8rem; }
        footer { text-align: center; margin-top: 3rem; opacity: .4; font-size: .8rem; }
        input[type=checkbox] { width: 18px; height: 18px; cursor: pointer; accent-color: #6366f1; }
      `}</style>
    </div>
  );
}