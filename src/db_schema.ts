import { Message } from "./chat_history"

export type DBMessage = {
  id: number;
  body: Message;
  text: string;
}

export function toFormat(msg: DBMessage) {
  return [
    msg.id,
    JSON.stringify(msg.body).slice(0, 30),
    msg.text.replace('\n', ' ').slice(0, 30),
  ]
}
