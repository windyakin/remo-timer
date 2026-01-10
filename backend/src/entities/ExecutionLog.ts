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

  @Column({ name: 'schedule_id', type: 'int' })
  scheduleId: number;

  @ManyToOne(() => Schedule, (schedule) => schedule.executionLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'schedule_id' })
  schedule: Schedule;

  @CreateDateColumn({ name: 'executed_at' })
  executedAt: Date;

  @Column({ type: 'varchar', length: 20 })
  status: ExecutionStatus;

  @Column({ type: 'jsonb', nullable: true })
  response: object | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;
}
