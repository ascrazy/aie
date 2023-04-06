/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('messages');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function down(pgm: MigrationBuilder): Promise<void> {
  throw Error('irreversible migration');
}
