import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddSessionTable1704844800002 implements MigrationInterface {
  name = 'AddSessionTable1704844800002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'sessions',
        columns: [
          {
            name: 'sid',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          {
            name: 'sess',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'expired',
            type: 'datetime',
            isNullable: false,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sessions');
  }
}
