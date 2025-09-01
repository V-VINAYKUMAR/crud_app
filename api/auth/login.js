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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    
    // Find user
    const user = demoUsers.find(u => u.username === username);
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
      { username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Server error" });
  }
};
