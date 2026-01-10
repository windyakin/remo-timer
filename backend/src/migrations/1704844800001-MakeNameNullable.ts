import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeNameNullable1704844800001 implements MigrationInterface {
  name = 'MakeNameNullable1704844800001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "schedules" ALTER COLUMN "name" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "schedules" SET "name" = "appliance_name" WHERE "name" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "schedules" ALTER COLUMN "name" SET NOT NULL
    `);
  }
}
