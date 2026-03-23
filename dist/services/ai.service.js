"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const groq_sdk_1 = __importDefault(require("groq-sdk"));
const AIChat_1 = require("../models/AIChat");
const models_1 = require("../models");
const logger_1 = __importDefault(require("../utils/logger"));
const groq = new groq_sdk_1.default({
    apiKey: process.env.GROQ_API_KEY || '',
});
const ROOMIE_CONTEXT = `You are the AI assistant for Roomie — a mobile app that helps people find compatible roommates, discover rental listings, and manage shared living in Nigeria and beyond.

=== ABOUT ROOMIE ===
Roomie is a social platform where users can:
- **Discover & Match**: Swipe through potential roommates based on compatibility scores. The app calculates compatibility using lifestyle preferences (sleep schedule, cleanliness, social level, guest frequency, work-from-home), budget range, location, and interests.
- **Rental Listings**: Browse, list, and inquire about rental properties. Landlords can post listings with photos, pricing, and details. Seekers can message landlords and schedule viewings.
- **Points System**: Users earn points by completing challenges, winning games, and being active. Points are used to send match requests (each request costs points). Users can also buy points.
- **Games**: Play fun mini-games (Emoji Guess, Memory Match, Word Scramble, Speed Math, Color Challenge, Geography Quiz, etc.) against matches to earn points and build connections.
- **Challenges**: Daily, weekly, and monthly challenges with leaderboards. Challenges include things like "Get 5 matches today", "Send 20 messages", "Win 10 games this week". Completing challenges earns points and badges.
- **Roommate Groups**: Once matched, users can form roommate groups to manage shared living — track chores, split expenses, share listings, and set house rules.
- **Events**: Discover and RSVP to local events, meetups, and community gatherings near you.
- **Study Buddy**: Find study partners, challenge them to quizzes across categories (Science, History, Geography, etc.), and earn points.
- **Confessions**: Anonymous confession board within roommate groups for honest feedback.
- **Premium**: Upgrade for benefits like profile boost, rewind (undo passes), advanced filters, priority matching, and more.
- **Verification**: Users can verify their identity for trust and safety. Verified users get a badge and access to features like matching.

=== HOW MATCHING WORKS ===
1. Users set preferences: budget range, room type, gender preference, age range, location, lifestyle habits
2. The app calculates a compatibility percentage based on how well two users' preferences align
3. Swiping right (liking) costs points — this prevents spam and encourages thoughtful matching
4. When both users like each other, it's a match! They can then chat
5. Users can also send "super likes" for higher visibility

=== POINTS & ECONOMY ===
- New users start with welcome points
- Earn points: daily login, completing challenges, winning games, completing profile, inviting friends
- Spend points: sending match requests, super likes, profile boosts
- Buy points: in-app purchase via Paystack (Nigerian payment gateway)
- Points determine your level and unlock badges

=== NIGERIAN CONTEXT ===
- Currency is Nigerian Naira (NGN/₦)
- Common cities: Lagos, Abuja, Port Harcourt, Ibadan, Benin, Enugu, Kano
- University students and young professionals are primary users
- Shared apartments (flats) are common, especially in cities like Lagos (Lekki, Yaba, Ikeja, Surulere, Victoria Island)
- Budget ranges typically ₦50,000 - ₦500,000/year for shared rooms

=== SAFETY TIPS YOU SHOULD SHARE ===
- Always verify your identity and encourage potential roommates to do the same
- Meet in public places first before visiting a shared apartment
- Never send money before seeing the property in person
- Check the neighborhood, security, and amenities before committing
- Use Roomie's in-app chat to keep communication documented
- Trust the compatibility score but also trust your instincts
- Report suspicious users immediately

=== ROOMMATE LIVING TIPS ===
- Set clear house rules from day one (cleaning schedule, guests, noise, shared items)
- Use Roomie's chore tracker to divide responsibilities fairly
- Communicate openly — use the app's group chat for household matters
- Split expenses transparently using the shared expense tracker
- Respect personal space and privacy
- Address issues early before they escalate`;
function getPersonalityPrompt(personality, aiName) {
    const base = `Your name is "${aiName}".`;
    switch (personality) {
        case 'professional':
            return `${base} You are professional, structured, and thorough. Use clear formatting and give detailed, well-organized advice. Address users formally.`;
        case 'casual':
            return `${base} You are super chill and casual. Use relaxed language, slang is okay. Keep it real and relatable. You can use expressions like "no wahala", "e go be", etc.`;
        case 'motivational':
            return `${base} You are upbeat, encouraging, and motivational. Hype users up! Celebrate their wins and encourage them to keep going. Use positive energy in every response.`;
        default:
            return `${base} You are warm, friendly, and approachable. Be helpful and conversational, like a knowledgeable friend who genuinely cares.`;
    }
}
class AIService {
    async chat(messages, userId) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('AI service not configured');
        }
        // Load user preferences
        const prefs = await this.getPreferences(userId);
        const personalityPrompt = getPersonalityPrompt(prefs.personality, prefs.aiName);
        // Load user context for personalized responses
        let userContext = '';
        try {
            const user = await models_1.User.findById(userId).select('firstName location preferences lifestyle occupation interests').lean();
            if (user) {
                const parts = [];
                if (user.firstName)
                    parts.push(`The user's name is ${user.firstName}.`);
                if (user.occupation)
                    parts.push(`They work as: ${user.occupation}.`);
                if (user.location?.city)
                    parts.push(`They are in ${user.location.city}, ${user.location.state || 'Nigeria'}.`);
                if (user.preferences?.budget)
                    parts.push(`Budget: ₦${user.preferences.budget.min?.toLocaleString()} - ₦${user.preferences.budget.max?.toLocaleString()}/year.`);
                if (user.interests?.length)
                    parts.push(`Interests: ${user.interests.slice(0, 5).join(', ')}.`);
                if (user.lifestyle?.sleepSchedule)
                    parts.push(`Sleep schedule: ${user.lifestyle.sleepSchedule}.`);
                if (parts.length)
                    userContext = `\n\n=== ABOUT THIS USER ===\n${parts.join(' ')}`;
            }
        }
        catch (e) {
            logger_1.default.warn('Failed to load user context for AI:', e);
        }
        const systemPrompt = `${ROOMIE_CONTEXT}\n\n${personalityPrompt}${userContext}\n\nKeep responses under 200 words unless the user asks for detail. Format with short paragraphs and bullet points for lists.`;
        try {
            const completion = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages.map(m => ({ role: m.role, content: m.content })),
                ],
                temperature: 0.7,
                max_tokens: 500,
                top_p: 0.9,
            });
            const reply = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response. Please try again.';
            logger_1.default.info(`AI chat for user ${userId}: ${messages[messages.length - 1]?.content?.substring(0, 50)}...`);
            return reply;
        }
        catch (error) {
            logger_1.default.error('AI service error:', error.message);
            throw new Error('AI is temporarily unavailable. Please try again later.');
        }
    }
    // ── Chat History ──
    async getChats(userId) {
        return AIChat_1.AIChat.find({ user: userId }).sort({ updatedAt: -1 }).limit(20).lean();
    }
    async getChat(chatId, userId) {
        return AIChat_1.AIChat.findOne({ _id: chatId, user: userId }).lean();
    }
    async saveMessage(userId, chatId, role, content) {
        if (chatId) {
            const chat = await AIChat_1.AIChat.findOneAndUpdate({ _id: chatId, user: userId }, { $push: { messages: { role, content, createdAt: new Date() } } }, { new: true });
            if (chat)
                return chat;
        }
        // Create new chat with auto-title from first message
        const title = role === 'user' ? content.substring(0, 40) + (content.length > 40 ? '...' : '') : 'New Chat';
        const chat = await AIChat_1.AIChat.create({
            user: userId,
            title,
            messages: [{ role, content, createdAt: new Date() }],
        });
        return chat;
    }
    async deleteChat(chatId, userId) {
        const result = await AIChat_1.AIChat.deleteOne({ _id: chatId, user: userId });
        return result.deletedCount > 0;
    }
    // ── Preferences ──
    async getPreferences(userId) {
        let prefs = await AIChat_1.AIPreferences.findOne({ user: userId });
        if (!prefs) {
            prefs = await AIChat_1.AIPreferences.create({ user: userId });
        }
        return prefs;
    }
    async updatePreferences(userId, updates) {
        const prefs = await AIChat_1.AIPreferences.findOneAndUpdate({ user: userId }, { $set: updates }, { new: true, upsert: true });
        return prefs;
    }
    getSuggestedQuestions() {
        return [
            'How do I find a compatible roommate?',
            'What areas in Lagos are best for shared apartments?',
            'Tips for a first roommate meeting?',
            'How to create a roommate agreement?',
            'How do points and challenges work?',
            'Help me budget for a shared apartment',
        ];
    }
}
exports.default = new AIService();
//# sourceMappingURL=ai.service.js.map