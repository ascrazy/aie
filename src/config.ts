export type AppConfig = {
  databaseUrl: string;
  openAIApiKey: string;
};

export const getAppConfig = () => {
  return {
    databaseUrl: process.env.DATABASE_URL ?? '',
    openAIApiKey: process.env.OPENAI_API_KEY ?? '',
    ingestion: {
      limit: 5000,
      dumpPath: './data/chat-logs.json',
      tableName: 'documents_debug',
    },
  };
};
