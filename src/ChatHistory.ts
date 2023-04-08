import { z } from 'zod';
import { promises as fs } from 'fs';

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
] as const;

const ChatHistoryDump = z.object({
  id: z.number(),
  name: z.string(),
  messages: z.array(
    z.object({
      id: z.number(),
      type: z.enum(['message', 'service']),
      text_entities: z.array(
        z.object({
          type: z.enum(TextEntityTypes),
          text: z.string(),
        })
      ),
    })
  ),
});

type ChatHistoryDumpType = z.infer<typeof ChatHistoryDump>;

type MessageType = ChatHistoryDumpType['messages'][0];

export async function readChatHistoryDump(
  path: string
): Promise<ChatHistoryDumpType> {
  const source = await fs.readFile(path, 'utf8');
  return ChatHistoryDump.parse(JSON.parse(source));
}

export function getMessageText(message: MessageType): string {
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

export function preprocessChatHistory(dump: ChatHistoryDumpType): string {
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
