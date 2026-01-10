import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExecutionLog1704844800002 implements MigrationInterface {
  name = 'UpdateExecutionLog1704844800002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 外部キー制約を削除
    await queryRunner.query(`
      ALTER TABLE "execution_logs" DROP CONSTRAINT IF EXISTS "FK_execution_logs_schedule"
    `);

    // schedule_id を nullable に変更
    await queryRunner.query(`
      ALTER TABLE "execution_logs" ALTER COLUMN "schedule_id" DROP NOT NULL
    `);

    // 新しいカラムを追加
    await queryRunner.query(`
      ALTER TABLE "execution_logs" ADD COLUMN "schedule_name" character varying(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "execution_logs" ADD COLUMN "appliance_name" character varying(255)
    `);
    await queryRunner.query(`
      ALTER TABLE "execution_logs" ADD COLUMN "appliance_type" character varying(50)
    `);

    // 既存データの移行（スケジュールが存在する場合）
    await queryRunner.query(`
      UPDATE "execution_logs" el
      SET
        "schedule_name" = s."name",
        "appliance_name" = s."appliance_name",
        "appliance_type" = s."appliance_type"
      FROM "schedules" s
      WHERE el."schedule_id" = s."id"
    `);

    // SET NULL に変更した外部キー制約を追加
    await queryRunner.query(`
      ALTER TABLE "execution_logs"
      ADD CONSTRAINT "FK_execution_logs_schedule"
      FOREIGN KEY ("schedule_id")
      REFERENCES "schedules"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 外部キー制約を削除
    await queryRunner.query(`
      ALTER TABLE "execution_logs" DROP CONSTRAINT IF EXISTS "FK_execution_logs_schedule"
    `);

    // 追加したカラムを削除
    await queryRunner.query(`
      ALTER TABLE "execution_logs" DROP COLUMN "appliance_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "execution_logs" DROP COLUMN "appliance_name"
    `);
    await queryRunner.query(`
      ALTER TABLE "execution_logs" DROP COLUMN "schedule_name"
    `);

    // schedule_id が NULL のレコードを削除（外部キー制約を復元するため）
    await queryRunner.query(`
      DELETE FROM "execution_logs" WHERE "schedule_id" IS NULL
    `);

    // schedule_id を NOT NULL に戻す
    await queryRunner.query(`
      ALTER TABLE "execution_logs" ALTER COLUMN "schedule_id" SET NOT NULL
    `);

    // CASCADE に戻した外部キー制約を追加
    await queryRunner.query(`
      ALTER TABLE "execution_logs"
      ADD CONSTRAINT "FK_execution_logs_schedule"
      FOREIGN KEY ("schedule_id")
      REFERENCES "schedules"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }
}
