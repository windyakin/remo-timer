import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704844800000 implements MigrationInterface {
  name = 'InitialSchema1704844800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "schedules" (
        "id" SERIAL NOT NULL,
        "name" character varying(255) NOT NULL,
        "appliance_id" character varying(255) NOT NULL,
        "appliance_name" character varying(255) NOT NULL,
        "appliance_type" character varying(50) NOT NULL,
        "action" jsonb NOT NULL,
        "schedule_type" character varying(20) NOT NULL,
        "execute_at" TIMESTAMP,
        "cron_expression" character varying(100),
        "is_enabled" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_schedules" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "execution_logs" (
        "id" SERIAL NOT NULL,
        "schedule_id" integer NOT NULL,
        "executed_at" TIMESTAMP NOT NULL DEFAULT now(),
        "status" character varying(20) NOT NULL,
        "response" jsonb,
        "error_message" text,
        CONSTRAINT "PK_execution_logs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "execution_logs"
      ADD CONSTRAINT "FK_execution_logs_schedule"
      FOREIGN KEY ("schedule_id")
      REFERENCES "schedules"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_execution_logs_schedule_id" ON "execution_logs" ("schedule_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_execution_logs_executed_at" ON "execution_logs" ("executed_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_schedules_is_enabled" ON "schedules" ("is_enabled")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_schedules_is_enabled"`);
    await queryRunner.query(`DROP INDEX "IDX_execution_logs_executed_at"`);
    await queryRunner.query(`DROP INDEX "IDX_execution_logs_schedule_id"`);
    await queryRunner.query(`ALTER TABLE "execution_logs" DROP CONSTRAINT "FK_execution_logs_schedule"`);
    await queryRunner.query(`DROP TABLE "execution_logs"`);
    await queryRunner.query(`DROP TABLE "schedules"`);
  }
}
