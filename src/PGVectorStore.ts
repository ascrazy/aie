import { Document } from 'langchain/document';
import { Embeddings } from 'langchain/embeddings';
import { VectorStore } from 'langchain/vectorstores';
import { Pool } from 'pg';

type DBConfig = {
  connection: Pool;
  tableName: string;
};

export class PGVectorStore extends VectorStore {
  dbConfig: DBConfig;
  numDimensions = 1536;

  constructor(embeddings: Embeddings, dbConfig: DBConfig) {
    super(embeddings, dbConfig);
    this.dbConfig = dbConfig;
  }

  async addDocuments(documents: Document[]): Promise<void> {
    const vectors = await this.embeddings.embedDocuments(
      documents.map((doc) => doc.pageContent)
    );
    return await this.addVectors(vectors, documents);
  }

  async addVectors(vectors: number[][], documents: Document[]): Promise<void> {
    if (vectors.length === 0) {
      return;
    }

    if (vectors.length !== documents.length) {
      throw new Error(`Vectors and metadatas must have the same length`);
    }

    if (vectors[0].length !== this.numDimensions) {
      throw new Error(
        `Vectors must have the same length as the number of dimensions (${this.numDimensions})`
      );
    }
    for (let i = 0; i < vectors.length; i += 1) {
      await this.dbConfig.connection.query(
        `INSERT INTO ${this.dbConfig.tableName} (page_content, metadata, embedding) VALUES ($1, $2, $3)`,
        [
          documents[i].pageContent,
          JSON.stringify(documents[i].metadata),
          JSON.stringify(vectors[i]),
        ]
      );
    }
  }

  async similaritySearchVectorWithScore(
    query: number[],
    k: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filter?: object
  ): Promise<[Document, number][]> {
    const res = await this.dbConfig.connection.query<{
      page_content: string;
      metadata: object;
      distance: number;
    }>(
      `SELECT page_content, metadata, embedding <-> $1 AS distance FROM ${this.dbConfig.tableName} ORDER BY distance LIMIT $2`,
      [JSON.stringify(query), k]
    );
    return res.rows.map((item) => {
      return [
        {
          pageContent: item.page_content,
          metadata: item.metadata,
        },
        item.distance,
      ];
    });
  }
}
