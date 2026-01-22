import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ExecutionLog } from './ExecutionLog';
import { ApplianceAction } from '../types/nature';

export type ScheduleType = 'once' | 'recurring';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ name: 'appliance_id', type: 'varchar', length: 255 })
  applianceId: string;

  @Column({ name: 'appliance_name', type: 'varchar', length: 255 })
  applianceName: string;

  @Column({ name: 'appliance_type', type: 'varchar', length: 50 })
  applianceType: string;

  @Column({ type: 'simple-json' })
  action: ApplianceAction;

  @Column({ name: 'schedule_type', type: 'varchar', length: 20 })
  scheduleType: ScheduleType;

  @Column({ name: 'execute_at', type: 'datetime', nullable: true })
  executeAt: Date | null;

  @Column({ name: 'cron_expression', type: 'varchar', length: 100, nullable: true })
  cronExpression: string | null;

  @Column({ name: 'is_enabled', type: 'boolean', default: true })
  isEnabled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => ExecutionLog, (log) => log.schedule)
  executionLogs: ExecutionLog[];
}
