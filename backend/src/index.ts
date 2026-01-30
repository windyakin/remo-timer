import 'reflect-metadata';
import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import { AppDataSource } from './config/database';
import { schedulerService } from './services/SchedulerService';
import { startSessionCleanupJob } from './config/sessionStore';

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connected successfully');

    console.log('Cleaning up expired one-time schedules...');
    await schedulerService.cleanupExpiredOneTimeSchedules();

    console.log('Initializing scheduler...');
    await schedulerService.initialize();
    console.log(
      `Scheduler initialized with ${schedulerService.getActiveJobsCount()} active jobs`
    );

    // セッションクリーンアップジョブを開始
    startSessionCleanupJob();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
