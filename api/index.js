const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Demo users (in production, use a real database)
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

// In-memory CRUD data
let crudData = [
  { id: 1, name: 'Alice', createdBy: 'admin' },
  { id: 2, name: 'Bob', createdBy: 'admin' }
];
let nextId = 3;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  try {
    // Health check
    if (pathname === '/api/health' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        message: "CRUD API is working!"
      }));
    }

    // Login endpoint
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const { username, password } = req.body;
      
      if (!username || !password) {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Username and password required" }));
      }
      
      const user = demoUsers.find(u => u.username === username);
      if (!user) {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Invalid credentials" }));
      }

      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) {
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: "Invalid credentials" }));
      }

      const token = jwt.sign(
        { username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        token,
        user: {
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      }));
    }

    // CRUD endpoints
    if (pathname === '/api/crud') {
      switch (req.method) {
        case 'GET':
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(crudData));

        case 'POST':
          if (!req.body.name) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: "Name is required" }));
          }
          
          const newItem = {
            id: nextId++,
            name: req.body.name,
            createdBy: 'user',
            createdAt: new Date().toISOString()
          };
          
          crudData.push(newItem);
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(newItem));

        case 'PUT':
          const { id } = req.query;
          if (!id || !req.body.name) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: "ID and name are required" }));
          }
          
          const itemIndex = crudData.findIndex(item => item.id === parseInt(id));
          if (itemIndex === -1) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: "Item not found" }));
          }
          
          crudData[itemIndex].name = req.body.name;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify(crudData[itemIndex]));

        case 'DELETE':
          const deleteId = req.query.id;
          if (!deleteId) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: "ID is required" }));
          }
          
          const deleteIndex = crudData.findIndex(item => item.id === parseInt(deleteId));
          if (deleteIndex === -1) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: "Item not found" }));
          }
          
          const deletedItem = crudData.splice(deleteIndex, 1)[0];
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ message: "Item deleted successfully", item: deletedItem }));

        default:
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
    }

    // Default response
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Endpoint not found' }));

  } catch (error) {
    console.error('API error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Server error" }));
  }
};
