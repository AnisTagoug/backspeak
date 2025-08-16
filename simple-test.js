const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testAndAddEvent() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
    
    // First, let's check if tables exist
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Available tables:', tables.rows.map(r => r.table_name));
    
    // Check current events
    const currentEvents = await client.query('SELECT COUNT(*) FROM events');
    console.log('Current events count:', currentEvents.rows[0].count);
    
    // Add a test event
    const testEventId = Date.now();
    const insertResult = await client.query(
      `INSERT INTO events (id, title, date, start_time, end_time, description, sponsors, image, room, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        testEventId,
        'PostgreSQL Test Event',
        '2025-08-25',
        '19:00',
        '21:00',
        'Testing if PostgreSQL events appear in the Radio Speak Up application',
        'Database Team',
        '',
        'Virtual Studio',
        'admin'
      ]
    );
    
    console.log('Test event added successfully:');
    console.log('ID:', insertResult.rows[0].id);
    console.log('Title:', insertResult.rows[0].title);
    console.log('Date:', insertResult.rows[0].date);
    
    // Check updated count
    const newCount = await client.query('SELECT COUNT(*) FROM events');
    console.log('New events count:', newCount.rows[0].count);
    
    await client.end();
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
    await client.end();
  }
}

testAndAddEvent();
