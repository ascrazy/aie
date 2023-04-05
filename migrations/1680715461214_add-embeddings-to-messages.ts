/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension('vector');
  pgm.addColumn('messages', {
    embeddings: {
      // NOTE: this is the standard num of dimensions for openai embeddings
      type: 'vector(1536)',
      notNull: true,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn('messages', 'embeddings');
  pgm.dropExtension('vector');
}
