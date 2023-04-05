/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('messages', {
    id: 'id',
    raw: {
      type: 'jsonb',
      notNull: true
    }
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('messages', {
    id: 'id',
    raw: {
      type: 'jsonb',
      notNull: true
    }
  })
}
