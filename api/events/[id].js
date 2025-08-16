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

function authenticateToken(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM events WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      const event = {
        id: result.rows[0].id,
        title: result.rows[0].title,
        date: result.rows[0].date,
        startTime: result.rows[0].start_time,
        endTime: result.rows[0].end_time,
        description: result.rows[0].description,
        sponsors: result.rows[0].sponsors,
        image: result.rows[0].image,
        room: result.rows[0].room,
        createdBy: result.rows[0].created_by,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      };
      
      res.json(event);
    } else if (req.method === 'PUT') {
      const user = authenticateToken(req);
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      
      // Check if event exists
      const existingEvent = await query('SELECT * FROM events WHERE id = $1', [id]);
      if (existingEvent.rows.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      if (existingEvent.rows[0].created_by !== user.username && user.username !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to edit this event' });
      }
      
      const result = await query(
        `UPDATE events SET title = $1, date = $2, start_time = $3, end_time = $4, 
         description = $5, sponsors = $6, image = $7, room = $8, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $9 RETURNING *`,
        [
          req.body.title,
          req.body.date,
          req.body.startTime,
          req.body.endTime,
          req.body.description || '',
          req.body.sponsors || '',
          req.body.image || '',
          req.body.room || '',
          id
        ]
      );
      
      const event = {
        id: result.rows[0].id,
        title: result.rows[0].title,
        date: result.rows[0].date,
        startTime: result.rows[0].start_time,
        endTime: result.rows[0].end_time,
        description: result.rows[0].description,
        sponsors: result.rows[0].sponsors,
        image: result.rows[0].image,
        room: result.rows[0].room,
        createdBy: result.rows[0].created_by,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at
      };
      
      res.json(event);
    } else if (req.method === 'DELETE') {
      const user = authenticateToken(req);
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      
      // Get event before deletion
      const existingEvent = await query('SELECT * FROM events WHERE id = $1', [id]);
      if (existingEvent.rows.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Delete the event
      await query('DELETE FROM events WHERE id = $1', [id]);
      
      const deleted = {
        id: existingEvent.rows[0].id,
        title: existingEvent.rows[0].title,
        date: existingEvent.rows[0].date,
        startTime: existingEvent.rows[0].start_time,
        endTime: existingEvent.rows[0].end_time,
        description: existingEvent.rows[0].description,
        sponsors: existingEvent.rows[0].sponsors,
        image: existingEvent.rows[0].image,
        room: existingEvent.rows[0].room,
        createdBy: existingEvent.rows[0].created_by,
        createdAt: existingEvent.rows[0].created_at
      };
      
      res.json(deleted);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
