import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function query(text, params) {
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function migrateData() {
  try {
    console.log('Starting database migration with BIGINT fix...');
    
    await client.connect();
    
    // Drop existing events table if it exists
    await client.query('DROP TABLE IF EXISTS events');
    console.log('Dropped existing events table');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create events table with BIGINT id
    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id BIGINT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        description TEXT,
        sponsors VARCHAR(255),
        image VARCHAR(500),
        room VARCHAR(255),
        created_by VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database tables created successfully');
    
    // Migrate users data
    const usersPath = path.join(process.cwd(), 'users.json');
    if (fs.existsSync(usersPath)) {
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      
      for (const user of users) {
        await query(
          'INSERT INTO users (username, password) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
          [user.username, user.password]
        );
      }
      console.log(`Migrated ${users.length} users`);
    }
    
    // Migrate events data
    const eventsPath = path.join(process.cwd(), 'events.json');
    if (fs.existsSync(eventsPath)) {
      const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
      
      for (const event of events) {
        await query(
          `INSERT INTO events (id, title, date, start_time, end_time, description, sponsors, image, room, created_by, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            event.id,
            event.title,
            event.date,
            event.startTime,
            event.endTime,
            event.description || '',
            event.sponsors || '',
            event.image || '',
            event.room || '',
            event.createdBy,
            event.createdAt,
            event.updatedAt || event.createdAt
          ]
        );
      }
      console.log(`Migrated ${events.length} events`);
    }
    
    console.log('Migration completed successfully!');
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await client.end();
    process.exit(1);
  }
}

migrateData();
