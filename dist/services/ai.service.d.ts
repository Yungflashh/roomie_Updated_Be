import { IAIChatDocument, IAIPreferencesDocument } from '../models/AIChat';
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
declare class AIService {
    private getRecommendedUsers;
    private getAvailableListings;
    chat(messages: ChatMessage[], userId: string): Promise<string>;
    getChats(userId: string): Promise<IAIChatDocument[]>;
    getChat(chatId: string, userId: string): Promise<IAIChatDocument | null>;
    saveMessage(userId: string, chatId: string | null, role: 'user' | 'assistant', content: string): Promise<IAIChatDocument>;
    deleteChat(chatId: string, userId: string): Promise<boolean>;
    getPreferences(userId: string): Promise<IAIPreferencesDocument>;
    updatePreferences(userId: string, updates: {
        aiName?: string;
        colorTheme?: string;
        personality?: string;
    }): Promise<IAIPreferencesDocument>;
    getSuggestedQuestions(): string[];
}
declare const _default: AIService;
export default _default;
//# sourceMappingURL=ai.service.d.ts.map