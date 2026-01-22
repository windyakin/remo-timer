import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialSchema1704844800000 implements MigrationInterface {
  name = 'InitialSchema1704844800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create schedules table
    await queryRunner.createTable(
      new Table({
        name: 'schedules',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'appliance_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'appliance_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'appliance_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'action',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'schedule_type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'execute_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'cron_expression',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'is_enabled',
            type: 'boolean',
            default: 1,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create execution_logs table
    await queryRunner.createTable(
      new Table({
        name: 'execution_logs',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'schedule_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'schedule_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'appliance_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'appliance_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'executed_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'response',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'execution_logs',
      new TableIndex({
        name: 'IDX_execution_logs_schedule_id',
        columnNames: ['schedule_id'],
      }),
    );

    await queryRunner.createIndex(
      'execution_logs',
      new TableIndex({
        name: 'IDX_execution_logs_executed_at',
        columnNames: ['executed_at'],
      }),
    );

    await queryRunner.createIndex(
      'schedules',
      new TableIndex({
        name: 'IDX_schedules_is_enabled',
        columnNames: ['is_enabled'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('schedules', 'IDX_schedules_is_enabled');
    await queryRunner.dropIndex('execution_logs', 'IDX_execution_logs_executed_at');
    await queryRunner.dropIndex('execution_logs', 'IDX_execution_logs_schedule_id');
    await queryRunner.dropTable('execution_logs');
    await queryRunner.dropTable('schedules');
  }
}
