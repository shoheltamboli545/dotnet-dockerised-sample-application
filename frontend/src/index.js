import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
  import { TracingInstrumentation } from '@grafana/faro-web-tracing';

  initializeFaro({
    url: 'https://faro-collector-prod-ap-south-1.grafana.net/collect/b6ae2736686f47a3e4b6f76be76a9533',
    app: {
      name: 'Dotnet Application',
      version: '1.0.0',
      environment: 'production'
    },
    sessionTracking: {
      samplingRate: 1,
      persistent: true
    },
    instrumentations: [
      // Mandatory, omits default instrumentations otherwise.
      ...getWebInstrumentations(),

      // Tracing package to get end-to-end visibility for HTTP requests.
      new TracingInstrumentation(),
    ],
});
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const api = async (path, options) => {
  const response = await fetch(path, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [health, setHealth] = useState({ status: "checking" });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadTasks = async () => {
    try { setTasks(await api("/api/tasks")); } catch (err) { setError(err.message); }
  };

  useEffect(() => { loadTasks(); }, []);
  useEffect(() => {
    const checkHealth = async () => {
      try { setHealth(await api("/api/health")); } catch (_) { setHealth({ status: "unavailable" }); }
    };
    checkHealth();
    const timer = setInterval(checkHealth, 10000);
    return () => clearInterval(timer);
  }, []);

  const addTask = async (event) => {
    event.preventDefault();
    if (!title.trim()) return setError("Enter a task before adding it.");
    try {
      const task = await api("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) });
      setTasks([...tasks, task]); setTitle(""); setError(""); setNotice("Task added.");
    } catch (err) { setError(err.message); }
  };

  const deleteTask = async (id) => {
    try { await api(`/api/tasks/${id}`, { method: "DELETE" }); setTasks(tasks.filter(task => task.id !== id)); setNotice("Task removed."); }
    catch (err) { setError(err.message); }
  };

  const simulateError = async () => {
    setNotice("");
    try { await api("/api/tasks/simulate-error", { method: "POST" }); }
    catch (err) { setError(`Expected demo failure: ${err.message}`); }
  };

  return <main>
    <header>
      <div><p className="eyebrow">Docker + React + .NET Core</p><h1>Task board</h1><p className="subtitle">A small in-memory task manager behind an nginx API proxy.</p></div>
      <div className={`health ${health.status === "ok" ? "healthy" : "offline"}`}><span></span>{health.status}</div>
    </header>
    <section className="panel">
      <h2>Add a task</h2>
      <form onSubmit={addTask}><input value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Test API through nginx" /><button type="submit">Add task</button></form>
      <p className="hint">Health is checked every 10 seconds. {health.timestamp && `Last response: ${new Date(health.timestamp).toLocaleTimeString()}`}</p>
    </section>
    {notice && <p className="notice">{notice}</p>}
    {error && <p className="error" role="alert">{error}</p>}
    <section className="panel tasks"><div className="section-title"><h2>Your tasks</h2><span>{tasks.length} total</span></div>
      {tasks.length === 0 ? <p className="empty">No tasks yet. Add one above.</p> : <ul>{tasks.map(task => <li key={task.id}><span className={task.done ? "done" : "dot"}>{task.done ? "✓" : "•"}</span><span>{task.title}</span><button className="remove" onClick={() => deleteTask(task.id)}>Remove</button></li>)}</ul>}
    </section>
    <section className="demo"><div><h2>Error handling demo</h2><p>Calls a backend endpoint designed to return HTTP 500. No data is changed.</p></div><button className="danger" onClick={simulateError}>Simulate API error</button></section>
  </main>;
}

createRoot(document.getElementById("root")).render(<App />);
