import { Injectable } from '@nestjs/common';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

@Injectable()
export class RagMemoryService {
  private memory = new Map<string, ChatMessage[]>();
  private readonly maxMessages = parseInt(
    process.env.RAG_CONVERSATION_MAX_MESSAGES || '20',
    10,
  );

  getHistory(conversationId: string): ChatMessage[] {
    return this.memory.get(conversationId) || [];
  }

  addMessage(conversationId: string, message: ChatMessage) {
    const history = this.getHistory(conversationId);
    history.push(message);

    if (history.length > this.maxMessages) {
      history.shift();
    }

    this.memory.set(conversationId, history);
  }
}
