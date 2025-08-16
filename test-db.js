import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testDatabase() {
  try {
    await client.connect();
    console.log('✅ Connected to database successfully');
    
    // Check tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('📋 Tables:', tablesResult.rows.map(row => row.table_name));
    
    // Check users
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    console.log('👥 Users count:', usersResult.rows[0].count);
    
    // Check events
    const eventsResult = await client.query('SELECT COUNT(*) FROM events');
    console.log('📅 Events count:', eventsResult.rows[0].count);
    
    // Show sample event
    const sampleEvent = await client.query('SELECT id, title, date FROM events LIMIT 1');
    if (sampleEvent.rows.length > 0) {
      console.log('📝 Sample event:', sampleEvent.rows[0]);
    }
    
    await client.end();
    console.log('✅ Database test completed successfully');
  } catch (error) {
    console.error('❌ Database test failed:', error);
    await client.end();
  }
}

testDatabase();
