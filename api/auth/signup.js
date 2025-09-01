const bcrypt = require("bcryptjs");

// Demo users storage (in production, use a real database)
let demoUsers = [
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
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const { username, password, fullName, email } = req.body;
    
    if (!username || !password || !fullName || !email) {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: "All fields are required" }));
    }
    
    // Check if user already exists
    const existingUser = demoUsers.find(u => u.username === username);
    if (existingUser) {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: "Username already exists" }));
    }

    // Create new user
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      username,
      password: hashedPassword,
      fullName,
      email,
      role: 'user'
    };
    
    demoUsers.push(newUser);
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ 
      message: "User created successfully", 
      user: {
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role
      }
    }));
  } catch (error) {
    console.error('Signup error:', error);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: "Server error" }));
  }
};
