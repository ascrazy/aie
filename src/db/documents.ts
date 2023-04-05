import { Client } from "pg";

export type Document = {
  id: number;
  page_content: string;
  metadata: unknown;
  embeddings: number[];
}

export async function insertDocument(db: Client, input: Omit<Document, "id">): Promise<Document> {
  const res = await db.query("INSERT INTO documents (page_content, metadata, embeddings) VALUES ($1, $2, $3) RETURNING (id, page_content, metadata, embeddings)", [
    input.page_content,
    JSON.stringify(input.metadata),
    JSON.stringify(input.embeddings)
  ])

  return res.rows[0];
}

export async function querySimilarDocuments(db: Client, queryEmbedding: number[], limit: number): Promise<Document[]> {
  const res = await db.query("SELECT id, page_content, metadata, embeddings FROM documents ORDER BY embeddings <-> $1 LIMIT $2", [
    JSON.stringify(queryEmbedding),
    limit
  ]);

  return res.rows;
}

export const cleanPageContent = (pageContent: string): string => {

  return pageContent.replace(/\n/g, " ");
}
