export type AppConfig = {
  databaseUrl: string;
  openAIApiKey: string;
}

export const getAppConfig = () => {
  return {
    databaseUrl: process.env.DATABASE_URL,
    openAIApiKey: process.env.OPENAI_API_KEY,
  }
}
