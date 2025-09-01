const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'crud_app.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Create users table
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
    } else {
      console.log('✅ Users table ready');
      insertDemoUsers();
    }
  });

  // Create crud_data table for your CRUD operations
  db.run(`
    CREATE TABLE IF NOT EXISTS crud_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      createdBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating crud_data table:', err.message);
    } else {
      console.log('✅ CRUD data table ready');
      insertDemoData();
    }
  });
}

// Insert demo users if they don't exist
function insertDemoUsers() {
  const bcrypt = require('bcryptjs');
  
  const demoUsers = [
    {
      username: 'admin',
      password: 'password123',
      fullName: 'Administrator',
      email: 'admin@example.com',
      role: 'admin'
    },
    {
      username: 'user',
      password: 'user123',
      fullName: 'Regular User',
      email: 'user@example.com',
      role: 'user'
    },
    {
      username: 'demo',
      password: 'demo123',
      fullName: 'Demo User',
      email: 'demo@example.com',
      role: 'user'
    }
  ];

  demoUsers.forEach(user => {
    // Hash password
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    
    db.run(`
      INSERT OR IGNORE INTO users (username, password, fullName, email, role)
      VALUES (?, ?, ?, ?, ?)
    `, [user.username, hashedPassword, user.fullName, user.email, user.role], (err) => {
      if (err) {
        console.error('Error inserting demo user:', err.message);
      }
    });
  });
}

// Insert demo CRUD data
function insertDemoData() {
  const demoData = [
    { name: 'Alice', createdBy: 1 },
    { name: 'Bob', createdBy: 1 }
  ];

  demoData.forEach(item => {
    db.run(`
      INSERT OR IGNORE INTO crud_data (name, createdBy)
      VALUES (?, ?)
    `, [item.name, item.createdBy], (err) => {
      if (err) {
        console.error('Error inserting demo data:', err.message);
      }
    });
  });
}

// Database helper functions
const dbHelpers = {
  // Get user by username
  getUserByUsername: (username) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Get user by ID
  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // Create new user
  createUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { username, password, fullName, email, role = 'user' } = userData;
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      db.run(`
        INSERT INTO users (username, password, fullName, email, role)
        VALUES (?, ?, ?, ?, ?)
      `, [username, hashedPassword, fullName, email, role], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, username, fullName, email, role });
      });
    });
  },

  // Get all CRUD data
  getAllCrudData: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM crud_data ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // Create CRUD data
  createCrudData: (name, createdBy) => {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO crud_data (name, createdBy)
        VALUES (?, ?)
      `, [name, createdBy], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, name, createdBy });
      });
    });
  },

  // Update CRUD data
  updateCrudData: (id, name) => {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE crud_data SET name = ? WHERE id = ?
      `, [name, id], function(err) {
        if (err) reject(err);
        else resolve({ id, name, changes: this.changes });
      });
    });
  },

  // Delete CRUD data
  deleteCrudData: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM crud_data WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ id, changes: this.changes });
      });
    });
  }
};

module.exports = { db, dbHelpers };
