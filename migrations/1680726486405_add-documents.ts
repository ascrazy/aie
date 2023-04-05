/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('documents', {
    id: 'id',
    page_content: {
      type: 'text',
      notNull: true,
    },
    metadata: {
      type: 'jsonb',
      notNull: true
    },
    embeddings: {
      type: 'vector(1536)',
      notNull: true
    }
  })
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('documents')
}
