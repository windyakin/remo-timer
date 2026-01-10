import cron, { ScheduledTask } from 'node-cron';
import { Schedule } from '../entities/Schedule';
import { ExecutionLog } from '../entities/ExecutionLog';
import { AppDataSource } from '../config/database';
import { natureApiService } from './NatureApiService';
import { LessThanOrEqual } from 'typeorm';

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
    const displayName = schedule.name || schedule.applianceName;
    console.log(
      `Added recurring schedule: ${displayName} (${schedule.cronExpression})`
    );
  }

  private addOneTimeSchedule(schedule: Schedule): void {
    if (!schedule.executeAt) return;

    const now = new Date();
    const executeTime = new Date(schedule.executeAt);
    const delay = executeTime.getTime() - now.getTime();
    const displayName = schedule.name || schedule.applianceName;

    if (delay <= 0) {
      console.log(
        `One-time schedule ${displayName} is in the past, deleting...`
      );
      this.deleteOneTimeSchedule(schedule.id);
      return;
    }

    const timeout = setTimeout(async () => {
      await this.executeSchedule(schedule);
      await this.deleteOneTimeSchedule(schedule.id);
    }, delay);

    this.oneTimeTimeouts.set(schedule.id, timeout);
    console.log(
      `Added one-time schedule: ${displayName} (${executeTime.toISOString()})`
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
    log.scheduleName = schedule.name;
    log.applianceName = schedule.applianceName;
    log.applianceType = schedule.applianceType;

    const displayName = schedule.name || schedule.applianceName;

    try {
      console.log(`Executing schedule: ${displayName}`);
      await natureApiService.executeAction(schedule.applianceId, schedule.action);

      log.status = 'success';
      log.response = { message: 'Action executed successfully' };
      console.log(`Schedule ${displayName} executed successfully`);
    } catch (error) {
      log.status = 'failed';
      log.errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Schedule ${displayName} failed:`, log.errorMessage);
    }

    await logRepository.save(log);
  }

  private async deleteOneTimeSchedule(scheduleId: number): Promise<void> {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    this.removeSchedule(scheduleId);
    await scheduleRepository.delete(scheduleId);
    console.log(`Deleted one-time schedule: ${scheduleId}`);
  }

  async cleanupExpiredOneTimeSchedules(): Promise<void> {
    const scheduleRepository = AppDataSource.getRepository(Schedule);
    const now = new Date();

    // 期限切れの一度きりスケジュールを削除
    const expiredSchedules = await scheduleRepository.find({
      where: {
        scheduleType: 'once',
        executeAt: LessThanOrEqual(now),
      },
    });

    for (const schedule of expiredSchedules) {
      await this.deleteOneTimeSchedule(schedule.id);
    }
  }

  getActiveJobsCount(): number {
    return this.jobs.size + this.oneTimeTimeouts.size;
  }
}

export const schedulerService = new SchedulerService();
