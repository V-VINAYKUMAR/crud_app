const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// In-memory database for Vercel (serverless)
let db;
let isInitialized = false;

function initializeDatabase() {
  if (isInitialized) return;
  
  db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      return;
    }
    console.log('✅ Connected to in-memory SQLite database');
    
    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        fullName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'user',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
        return;
      }
      
      // Create CRUD data table
      db.run(`
        CREATE TABLE IF NOT EXISTS crud_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          createdBy INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating crud_data table:', err.message);
          return;
        }
        
        // Insert demo data
        insertDemoData();
        isInitialized = true;
      });
    });
  });
}

function insertDemoData() {
  // Insert demo users
  const demoUsers = [
    {
      username: 'admin',
      password: bcrypt.hashSync('password123', 10),
      fullName: 'Administrator',
      email: 'admin@example.com',
      role: 'admin'
    },
    {
      username: 'user',
      password: bcrypt.hashSync('user123', 10),
      fullName: 'Regular User',
      email: 'user@example.com',
      role: 'user'
    },
    {
      username: 'demo',
      password: bcrypt.hashSync('demo123', 10),
      fullName: 'Demo User',
      email: 'demo@example.com',
      role: 'user'
    }
  ];

  demoUsers.forEach(user => {
    db.run(`
      INSERT OR IGNORE INTO users (username, password, fullName, email, role)
      VALUES (?, ?, ?, ?, ?)
    `, [user.username, user.password, user.fullName, user.email, user.role]);
  });

  // Insert demo CRUD data
  const demoData = [
    { name: 'Alice', createdBy: 1 },
    { name: 'Bob', createdBy: 1 }
  ];

  demoData.forEach(item => {
    db.run(`
      INSERT OR IGNORE INTO crud_data (name, createdBy)
      VALUES (?, ?)
    `, [item.name, item.createdBy]);
  });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Initialize database on first request
app.use((req, res, next) => {
  if (!isInitialized) {
    initializeDatabase();
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    database: isInitialized ? 'ready' : 'initializing'
  });
});

// Authentication endpoints
app.post("/auth/signup", async (req, res) => {
  try {
    const { username, password, fullName, email } = req.body;
    
    if (!username || !password || !fullName || !email) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Check if user already exists
    db.get('SELECT username FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      
      if (row) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Create new user
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.run(`
        INSERT INTO users (username, password, fullName, email, role)
        VALUES (?, ?, ?, ?, ?)
      `, [username, hashedPassword, fullName, email, 'user'], function(err) {
        if (err) {
          return res.status(500).json({ error: "Error creating user" });
        }
        
        res.status(201).json({ 
          message: "User created successfully", 
          user: { id: this.lastID, username, fullName, email, role: 'user' }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    
    // Get user from database
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Protected CRUD endpoints
app.get("/users", authenticateToken, (req, res) => {
  db.all('SELECT * FROM crud_data ORDER BY id', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

app.post("/users", authenticateToken, (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    
    db.run(`
      INSERT INTO crud_data (name, createdBy)
      VALUES (?, ?)
    `, [name, req.user.id], function(err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.status(201).json({ id: this.lastID, name, createdBy: req.user.id });
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/users/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    
    db.run(`
      UPDATE crud_data SET name = ? WHERE id = ?
    `, [name, id], function(err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ id, name, changes: this.changes });
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/users/:id", authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    
    db.run('DELETE FROM crud_data WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Data deleted successfully", changes: this.changes });
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Catch-all route for API
app.all('*', (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

// Export for Vercel
module.exports = app;
