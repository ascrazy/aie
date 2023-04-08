import { promises as fs } from 'fs';

export type ChatHistoryDump = {
  id: number;
  name: string;
  messages: Array<Message>;
};

export type Message = {
  id: number;
  type: 'message' | 'service';
  text_entities: TextEntity[];
};

type TextEntity = {
  type: string;
  text: string;
};

const TextEntityTypes = [
  'plain',
  'link',
  'bot_command',
  'mention',
  'mention_name',
  'bold',
  'phone',
  'email',
  'italic',
  'text_link',
  'pre',
  'underline',
  'hashtag',
  'code',
  'strikethrough',
  'spoiler',
  'custom_emoji',
];

export type MessageWithAggregatedText = Message & {
  aggregatedText: string;
};

export async function readChatHistoryDump(
  path: string
): Promise<ChatHistoryDump> {
  const source = await fs.readFile(path, 'utf8');
  const dump = JSON.parse(source) as ChatHistoryDump;
  validateChatHistory(dump);
  return dump;
}

export function getMessageText(message: Message): string {
  const aggregatedText = message.text_entities
    .filter((entity) => {
      return [
        'plain',
        'link',
        'bold',
        'phone',
        'email',
        'italic',
        'text_link',
        'pre',
        'underline',
        'hashtag',
        'code',
        'strikethrough',
        'spoiler',
      ].includes(entity.type);
    })
    .map((entity) => {
      return entity.text;
    })
    .join('');

  return aggregatedText;
}

export function preprocessChatHistory(dump: ChatHistoryDump): string {
  const texts: string[] = [];

  for (const message of dump.messages) {
    if (message.type !== 'message') {
      continue;
    }
    const messageText = cleanMessageText(getMessageText(message));
    if (messageText.length < 3) {
      continue;
    }
    texts.push(messageText);
  }

  return texts.join('\n\n');
}

export function cleanMessageText(text: string): string {
  return text.replace(/\n{2,}/g, '\n').trim();
}

export function validateChatHistory(dump: ChatHistoryDump): void {
  for (const msg of dump.messages) {
    if (msg.type !== 'message' && msg.type !== 'service') {
      throw new Error(`Invalid message type: ${msg.type}`);
    }
    for (const entity of msg.text_entities) {
      if (!TextEntityTypes.includes(entity.type)) {
        throw new Error(`Invalid entity type: ${JSON.stringify(entity)}`);
      }
    }
  }
}
