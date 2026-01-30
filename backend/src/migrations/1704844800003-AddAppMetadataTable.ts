import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddAppMetadataTable1704844800003 implements MigrationInterface {
  name = 'AddAppMetadataTable1704844800003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'app_metadata',
        columns: [
          {
            name: 'key',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          {
            name: 'value',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'datetime',
            isNullable: false,
            default: "datetime('now')",
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('app_metadata');
  }
}
