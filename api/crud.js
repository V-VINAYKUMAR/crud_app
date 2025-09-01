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
        return res.json(crudData);

      case 'POST':
        // Create new data
        if (!req.body.name) {
          return res.status(400).json({ error: "Name is required" });
        }
        
        const newItem = {
          id: nextId++,
          name: req.body.name,
          createdBy: 'user',
          createdAt: new Date().toISOString()
        };
        
        crudData.push(newItem);
        return res.status(201).json(newItem);

      case 'PUT':
        // Update data
        const { id } = req.query;
        if (!id || !req.body.name) {
          return res.status(400).json({ error: "ID and name are required" });
        }
        
        const itemIndex = crudData.findIndex(item => item.id === parseInt(id));
        if (itemIndex === -1) {
          return res.status(404).json({ error: "Item not found" });
        }
        
        crudData[itemIndex].name = req.body.name;
        return res.json(crudData[itemIndex]);

      case 'DELETE':
        // Delete data
        const deleteId = req.query.id;
        if (!deleteId) {
          return res.status(400).json({ error: "ID is required" });
        }
        
        const deleteIndex = crudData.findIndex(item => item.id === parseInt(deleteId));
        if (deleteIndex === -1) {
          return res.status(404).json({ error: "Item not found" });
        }
        
        const deletedItem = crudData.splice(deleteIndex, 1)[0];
        return res.json({ message: "Item deleted successfully", item: deletedItem });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('CRUD API error:', error);
    res.status(500).json({ error: "Server error" });
  }
};
