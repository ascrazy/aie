import { promises as fs } from 'fs';

export type ChatHistoryDump = {
  id: number;
  name: string;
  messages: Array<Message>;
};

export type Message = {
  id: number;
  type: string;
  text: unknown;
};

export async function readChatHistoryDump(
  path: string
): Promise<ChatHistoryDump> {
  return JSON.parse(await fs.readFile(path, 'utf8')) as ChatHistoryDump;
}

export function getMessageText(message: Message): string | undefined {
  if (typeof message.text === 'string' && message.text.length > 0) {
    return message.text;
  }
  if (typeof message.text === 'object' && message.text instanceof Array) {
    const parts = message.text.filter((part) => typeof part === 'string');

    const cleanedText = parts.join('');

    if (cleanedText.length > 0) {
      return cleanedText;
    }
  }

  return undefined;
}
