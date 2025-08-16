import { initDB, query } from './db.js';
import fs from 'fs';
import path from 'path';

async function migrateData() {
  try {
    console.log('Starting database migration...');
    
    // Initialize database tables
    await initDB();
    
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
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
           ON CONFLICT (id) DO NOTHING`,
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
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateData();
