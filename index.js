const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// Use database helpers
const { dbHelpers } = require("./database");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// serve frontend from public folder
app.use(express.static("public"));

// Health check endpoint for Render
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: "CRUD API is working on Render!"
  });
});

// Health check endpoint (alternative)
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Redirect root to login page
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// JWT Secret (in production, use environment variable)
const JWT_SECRET = "your-secret-key-change-in-production";

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

// Authentication endpoints
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, password, fullName, email } = req.body;
    
    // Check if user already exists
    const existingUser = await dbHelpers.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Create new user
    const newUser = await dbHelpers.createUser({ username, password, fullName, email });
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ error: "Error creating user" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Get user from database
    const user = await dbHelpers.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
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
  } catch (error) {
    res.status(500).json({ error: "Error during login" });
  }
});

// Protected CRUD endpoints
app.get("/api/users", authenticateToken, async (req, res) => {
  try {
    const data = await dbHelpers.getAllCrudData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

app.post("/api/users", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const newData = await dbHelpers.createCrudData(name, req.user.id);
    res.status(201).json(newData);
  } catch (error) {
    res.status(500).json({ error: "Error creating data" });
  }
});

app.put("/api/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedData = await dbHelpers.updateCrudData(id, name);
    res.json(updatedData);
  } catch (error) {
    res.status(500).json({ error: "Error updating data" });
  }
});

app.delete("/api/users/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await dbHelpers.deleteCrudData(id);
    res.json({ message: "Data deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting data" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
