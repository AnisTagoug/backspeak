const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');
    
    // Check current events
    const eventsResult = await client.query('SELECT COUNT(*) FROM events');
    console.log('Current events in database:', eventsResult.rows[0].count);
    
    // Add a test event
    const testEventId = Date.now();
    await client.query(
      'INSERT INTO events (id, title, date, start_time, end_time, description, sponsors, image, room, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [
        testEventId,
        'PostgreSQL Test Event - ' + new Date().toLocaleString(),
        '2025-08-25',
        '20:00',
        '22:00',
        'This event was added to test PostgreSQL integration',
        'Database Team',
        'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=PostgreSQL+Test',
        'Virtual Studio',
        'admin'
      ]
    );
    
    console.log('✅ Test event added with ID:', testEventId);
    
    // Verify the event was added
    const newCount = await client.query('SELECT COUNT(*) FROM events');
    console.log('New events count:', newCount.rows[0].count);
    
    // Show the latest event
    const latestEvent = await client.query('SELECT id, title, date FROM events ORDER BY created_at DESC LIMIT 1');
    console.log('Latest event:', latestEvent.rows[0]);
    
    await client.end();
    console.log('✅ Test completed successfully!');
    console.log('🌐 Check your application at http://localhost:5173 to see if the event appears');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await client.end();
  }
}

testConnection();
