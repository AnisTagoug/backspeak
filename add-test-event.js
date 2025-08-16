import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addTestEvent() {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Add a test event
    const testEvent = {
      id: Date.now(), // Generate a unique timestamp ID
      title: 'Test PostgreSQL Event',
      date: '2025-08-20',
      start_time: '20:00',
      end_time: '22:00',
      description: 'This is a test event to verify PostgreSQL integration is working correctly.',
      sponsors: 'Radio Speak Up',
      image: 'https://via.placeholder.com/400x300/FF6B6B/FFFFFF?text=Test+Event',
      room: 'Main Studio',
      created_by: 'admin'
    };
    
    const result = await client.query(
      `INSERT INTO events (id, title, date, start_time, end_time, description, sponsors, image, room, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        testEvent.id,
        testEvent.title,
        testEvent.date,
        testEvent.start_time,
        testEvent.end_time,
        testEvent.description,
        testEvent.sponsors,
        testEvent.image,
        testEvent.room,
        testEvent.created_by
      ]
    );
    
    console.log('✅ Test event added successfully:');
    console.log('📅 Event ID:', result.rows[0].id);
    console.log('📝 Title:', result.rows[0].title);
    console.log('📆 Date:', result.rows[0].date);
    console.log('🕐 Time:', result.rows[0].start_time, '-', result.rows[0].end_time);
    
    // Show total events count
    const countResult = await client.query('SELECT COUNT(*) FROM events');
    console.log('📊 Total events in database:', countResult.rows[0].count);
    
    await client.end();
    console.log('✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Error adding test event:', error);
    await client.end();
  }
}

addTestEvent();
