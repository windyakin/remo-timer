import cron, { ScheduledTask } from 'node-cron';
import { Schedule } from '../entities/Schedule';
import { ExecutionLog } from '../entities/ExecutionLog';
import { AppDataSource } from '../config/database';
import { natureApiService } from './NatureApiService';
import { LessThanOrEqual, MoreThan } from 'typeorm';

export class SchedulerService {
  private jobs: Map<number, ScheduledTask> = new Map();
  private oneTimeTimeouts: Map<number, NodeJS.Timeout> = new Map();

  async initialize(): Promise<void> {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const enabledSchedules = await scheduleRepository.find({
      where: { isEnabled: true },
    });

    console.log(`Loading ${enabledSchedules.length} enabled schedules...`);

    for (const schedule of enabledSchedules) {
      this.addSchedule(schedule);
    }
  }

  addSchedule(schedule: Schedule): void {
    this.removeSchedule(schedule.id);

    if (!schedule.isEnabled) {
      return;
    }

    if (schedule.scheduleType === 'recurring' && schedule.cronExpression) {
      this.addRecurringSchedule(schedule);
    } else if (schedule.scheduleType === 'once' && schedule.executeAt) {
      this.addOneTimeSchedule(schedule);
    }
  }

  private addRecurringSchedule(schedule: Schedule): void {
    if (!schedule.cronExpression) return;

    const job = cron.schedule(schedule.cronExpression, async () => {
      await this.executeSchedule(schedule);
    });

    this.jobs.set(schedule.id, job);
    console.log(
      `Added recurring schedule: ${schedule.name} (${schedule.cronExpression})`
    );
  }

  private addOneTimeSchedule(schedule: Schedule): void {
    if (!schedule.executeAt) return;

    const now = new Date();
    const executeTime = new Date(schedule.executeAt);
    const delay = executeTime.getTime() - now.getTime();

    if (delay <= 0) {
      console.log(
        `One-time schedule ${schedule.name} is in the past, skipping...`
      );
      return;
    }

    const timeout = setTimeout(async () => {
      await this.executeSchedule(schedule);
      await this.disableSchedule(schedule.id);
    }, delay);

    this.oneTimeTimeouts.set(schedule.id, timeout);
    console.log(
      `Added one-time schedule: ${schedule.name} (${executeTime.toISOString()})`
    );
  }

  removeSchedule(scheduleId: number): void {
    const job = this.jobs.get(scheduleId);
    if (job) {
      job.stop();
      this.jobs.delete(scheduleId);
    }

    const timeout = this.oneTimeTimeouts.get(scheduleId);
    if (timeout) {
      clearTimeout(timeout);
      this.oneTimeTimeouts.delete(scheduleId);
    }
  }

  private async executeSchedule(schedule: Schedule): Promise<void> {
    const logRepository = AppDataSource.getRepository(ExecutionLog);
    const log = new ExecutionLog();
    log.scheduleId = schedule.id;

    try {
      console.log(`Executing schedule: ${schedule.name}`);
      await natureApiService.executeAction(schedule.applianceId, schedule.action);

      log.status = 'success';
      log.response = { message: 'Action executed successfully' };
      console.log(`Schedule ${schedule.name} executed successfully`);
    } catch (error) {
      log.status = 'failed';
      log.errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Schedule ${schedule.name} failed:`, log.errorMessage);
    }

    await logRepository.save(log);
  }

  private async disableSchedule(scheduleId: number): Promise<void> {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    await scheduleRepository.update(scheduleId, { isEnabled: false });
    this.removeSchedule(scheduleId);
    console.log(`Disabled one-time schedule: ${scheduleId}`);
  }

  async cleanupExpiredOneTimeSchedules(): Promise<void> {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const now = new Date();

    await scheduleRepository.update(
      {
        scheduleType: 'once',
        executeAt: LessThanOrEqual(now),
        isEnabled: true,
      },
      { isEnabled: false }
    );
  }

  getActiveJobsCount(): number {
    return this.jobs.size + this.oneTimeTimeouts.size;
  }
}

export const schedulerService = new SchedulerService();
