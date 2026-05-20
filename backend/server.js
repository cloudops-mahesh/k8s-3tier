const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Database connection pool
const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME     || "taskdb",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Retry DB connection on startup
// Important for Kubernetes — DB pod may not be ready yet
async function connectWithRetry(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("✓ PostgreSQL connected");
      return true;
    } catch (err) {
      console.log(`DB not ready (attempt ${i + 1}/${retries}): ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("Could not connect to PostgreSQL after retries");
}

// Create table if it doesn't exist
async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id         SERIAL PRIMARY KEY,
      title      TEXT        NOT NULL,
      done       BOOLEAN     NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log("✓ Schema ready");
}

// ── Routes ──────────────────────────────────────────────────

// Health check — Kubernetes liveness & readiness probe
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected", uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: "error", db: "unreachable" });
  }
});

// GET all tasks
app.get("/tasks", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a task
app.post("/tasks", async (req, res) => {
  const { title } = req.body;
  if (!title?.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  try {
    const { rows } = await pool.query(
      "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
      [title.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle done
app.patch("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { done } = req.body;
  try {
    const { rows } = await pool.query(
      "UPDATE tasks SET done = $1 WHERE id = $2 RETURNING *",
      [done, id]
    );
    if (!rows.length) return res.status(404).json({ error: "not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a task
app.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Graceful shutdown — Kubernetes sends SIGTERM before killing a pod
process.on("SIGTERM", async () => {
  console.log("SIGTERM received — shutting down gracefully");
  await pool.end();
  process.exit(0);
});

// Start server
async function main() {
  await connectWithRetry();
  await initSchema();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✓ Backend running on port ${PORT}`);
  });
}

main().catch(err => {
  console.error("Startup failed:", err);
  process.exit(1);
});