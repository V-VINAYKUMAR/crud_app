const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// For Vercel, we'll use in-memory database or create a new one each time
let db;

function getDatabase() {
  if (!db) {
    // In Vercel, we can't persist SQLite files, so we'll use in-memory
    db = new sqlite3.Database(':memory:', (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('✅ Connected to in-memory SQLite database');
        initializeDatabase();
      }
    });
  }
  return db;
}

// Initialize database tables
function initializeDatabase() {
  const database = getDatabase();
  
  // Create users table
  database.run(`
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

  // Create crud_data table
  database.run(`
    CREATE TABLE IF NOT EXISTS crud_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      createdBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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

// Insert demo users
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
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    
    getDatabase().run(`
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
    getDatabase().run(`
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
  getUserByUsername: (username) => {
    return new Promise((resolve, reject) => {
      getDatabase().get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      getDatabase().get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  createUser: (userData) => {
    return new Promise((resolve, reject) => {
      const { username, password, fullName, email, role = 'user' } = userData;
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync(password, 10);
      
      getDatabase().run(`
        INSERT INTO users (username, password, fullName, email, role)
        VALUES (?, ?, ?, ?, ?)
      `, [username, hashedPassword, fullName, email, role], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, username, fullName, email, role });
      });
    });
  },

  getAllCrudData: () => {
    return new Promise((resolve, reject) => {
      getDatabase().all('SELECT * FROM crud_data ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  createCrudData: (name, createdBy) => {
    return new Promise((resolve, reject) => {
      getDatabase().run(`
        INSERT INTO crud_data (name, createdBy)
        VALUES (?, ?)
      `, [name, createdBy], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, name, createdBy });
      });
    });
  },

  updateCrudData: (id, name) => {
    return new Promise((resolve, reject) => {
      getDatabase().run(`
        UPDATE crud_data SET name = ? WHERE id = ?
      `, [name, id], function(err) {
        if (err) reject(err);
        else resolve({ id, name, changes: this.changes });
      });
    });
  },

  deleteCrudData: (id) => {
    return new Promise((resolve, reject) => {
      getDatabase().run('DELETE FROM crud_data WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ id, changes: this.changes });
      });
    });
  }
};

module.exports = { getDatabase, dbHelpers };
