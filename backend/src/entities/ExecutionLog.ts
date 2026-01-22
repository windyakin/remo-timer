import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Schedule } from './Schedule';

export type ExecutionStatus = 'success' | 'failed';

@Entity('execution_logs')
export class ExecutionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'schedule_id', type: 'int', nullable: true })
  scheduleId: number | null;

  @ManyToOne(() => Schedule, (schedule) => schedule.executionLogs, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule | null;

  @Column({ name: 'schedule_name', type: 'varchar', length: 255, nullable: true })
  scheduleName: string | null;

  @Column({ name: 'appliance_name', type: 'varchar', length: 255, nullable: true })
  applianceName: string | null;

  @Column({ name: 'appliance_type', type: 'varchar', length: 50, nullable: true })
  applianceType: string | null;

  @CreateDateColumn({ name: 'executed_at' })
  executedAt: Date;

  @Column({ type: 'varchar', length: 20 })
  status: ExecutionStatus;

  @Column({ type: 'simple-json', nullable: true })
  response: object | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;
}
