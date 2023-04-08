/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn('documents', 'embeddings', 'embedding');
  pgm.renameColumn('documents_debug', 'embeddings', 'embedding');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameColumn('documents', 'embedding', 'embeddings');
  pgm.renameColumn('documents_debug', 'embedding', 'embeddings');
}
