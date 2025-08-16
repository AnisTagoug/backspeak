const { Client } = require('pg');
require('dotenv').config();

async function quickTest() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Add test event
    const result = await client.query(
      `INSERT INTO events (id, title, date, start_time, end_time, description, room, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, title`,
      [Date.now(), 'Database Test Event', '2025-08-30', '18:00', '20:00', 'Testing PostgreSQL connection', 'Studio A', 'admin']
    );
    
    console.log('✅ Added test event:', result.rows[0]);
    await client.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickTest();
