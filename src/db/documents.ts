import { Document } from 'langchain/document';
import { Embeddings } from 'langchain/embeddings';
import { VectorStore } from 'langchain/vectorstores';
import { Client } from 'pg';

export const cleanPageContent = (pageContent: string): string => {
  return pageContent.replace(/\n/g, ' ');
};

type DBConfig = {
  connectionString: string;
  tableName: string;
};

export class PGVectorStore extends VectorStore {
  dbConfig: DBConfig;
  dbClient: Client;
  numDimensions = 1536;

  constructor(
    embeddings: Embeddings,
    dbConfig: {
      connectionString: string;
      tableName: string;
    }
  ) {
    super(embeddings, dbConfig);
    this.dbConfig = dbConfig;
    this.dbClient = new Client(dbConfig);
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
    try {
      await this.dbClient.connect();

      for (let i = 0; i < vectors.length; i += 1) {
        await this.dbClient.query(
          `INSERT INTO ${this.dbConfig.tableName} (page_content, metadata, embeddings) VALUES ($1, $2, $3)`,
          [
            documents[i].pageContent,
            JSON.stringify(documents[i].metadata),
            JSON.stringify(vectors[i]),
          ]
        );
      }

      await this.dbClient.end();
    } catch (err) {
      await this.dbClient.end();
      throw err;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async similaritySearchVectorWithScore(
    query: number[],
    k: number,
    filter?: object
  ): Promise<[Document, number][]> {
    try {
      await this.dbClient.connect();
      const res = await this.dbClient.query<{
        page_content: string;
        metadata: object;
        distance: number;
      }>(
        `SELECT page_content, metadata, embeddings <-> $1 AS distance FROM ${this.dbConfig.tableName} ORDER BY distance LIMIT $2`,
        [JSON.stringify(query), k]
      );
      return res.rows.map((item) => {
        return [
          {
            pageContent: cleanPageContent(item.page_content),
            metadata: item.metadata,
          },
          item.distance,
        ];
      });
    } catch (err) {
      await this.dbClient.end();
      throw err;
    }
  }
}
