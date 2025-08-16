const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Database query helper
async function query(text, params) {
  try {
    if (!client._connected) {
      await client.connect();
    }
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

module.exports = async function handler(req, res) {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Login attempt:', req.body);
    const { username, password } = req.body;
    
    // Query database for user
    const result = await query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    console.log('User query result:', result.rows.length > 0 ? 'User found' : 'User not found');
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const token = jwt.sign({ username: user.username }, SECRET, { expiresIn: '2h' });
    res.json({ token });
  } catch (error) {
    console.error('Login API Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
