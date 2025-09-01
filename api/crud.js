const jwt = require("jsonwebtoken");

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// In-memory data storage (resets on each deployment)
let crudData = [
  { id: 1, name: 'Alice', createdBy: 'admin' },
  { id: 2, name: 'Bob', createdBy: 'admin' }
];

let nextId = 3;

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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get all CRUD data
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify(crudData));

      case 'POST':
        // Create new data
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
        // Update data
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
        // Delete data
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
  } catch (error) {
    console.error('CRUD API error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Server error" }));
  }
};
