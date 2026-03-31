import Groq from 'groq-sdk';
import { AIChat, AIPreferences, IAIChatDocument, IAIPreferencesDocument } from '../models/AIChat';
import { User, Property } from '../models';
import logger from '../utils/logger';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const ROOMIE_CONTEXT = `You are the AI assistant for Roomie — a mobile app that helps people find compatible roommates, discover rental listings, and manage shared living in Nigeria.

=== CRITICAL RULES ===
1. NEVER invent or fabricate users, listings, or data. You will be given REAL users and listings from the database below — ONLY reference those. If no data is provided, say you don't have any to recommend right now.
2. When recommending users or listings, ONLY use the exact names, details, and information provided in the "RECOMMENDED USERS" and "AVAILABLE LISTINGS" sections below. Do NOT make up additional users or listings beyond what is provided. ALWAYS mention the person's full name when suggesting a profile — never describe someone without stating their name.
3. ONLY describe features that are listed in this prompt. Do NOT invent features, screens, buttons, or settings that don't exist.
4. If you're unsure about something, say so honestly. Never make up information.
5. You CANNOT perform actions, change settings, send messages, or do anything on behalf of the user. You can only provide information and recommendations.

=== ABOUT ROOMIE ===
Roomie is a social platform built for students, young professionals, and anyone looking for roommates or shared living in Nigeria. It combines roommate matching, rental discovery, social gaming, team-based clans, and AI assistance into one app.

=== CORE FEATURES ===

**1. Discover & Match (Swipe System)**
- Users swipe through potential roommates on the Discovery screen
- Each profile shows: name, age, occupation, location, interests, lifestyle preferences, compatibility percentage
- Swiping right = Like (costs points). Swiping left = Pass (free)
- When both users like each other, it's a Match — they can now chat
- The "For You" tab shows AI-recommended matches. "Near You" shows people nearby using GPS
- Users can filter by: gender, age range, budget, location, room type, lifestyle habits
- Only verified users can send match requests (swipe right). Unverified users can browse but not match
- The Compatibility Score (0-100%) is calculated from: budget overlap, location proximity, lifestyle alignment (sleep schedule, cleanliness, social level, guest frequency, work-from-home), shared interests

**2. Rental Listings**
- Users can browse rental properties: apartments, houses, condos, rooms
- Each listing has: title, description, photos, video tour, price, location (with map), bedrooms, bathrooms, amenities, lease duration
- Landlords can post listings (auto-saved as draft if the app closes)
- Seekers can message landlords through the app to inquire or schedule viewings
- Listing inquiries have stages: New Inquiry → Viewing Requested → Viewing Scheduled → Viewed → Offer Made → Accepted/Declined
- Only verified users can contact landlords
- Amenities include: WiFi, AC, TV, Kitchen, Laundry, Gym, Pool, Security, Generator, Water Supply

**3. Points & Economy**
- Points are the in-app currency. Every action costs or earns points
- Earn points by: winning games (+varies), completing challenges (+50-2000), completing profile, being active daily, challenge streaks
- Spend points on: match requests (each swipe right costs points), game entries (stake points), clan creation (500 pts), cosmetics shop items
- Buy points via Paystack (Nigerian payment gateway) with real money (NGN)
- Points determine your Level (every 1000 pts = level up). Higher levels unlock features and show status
- Point transactions are tracked: game rewards, match requests, achievements, level-up bonuses, penalties
- Gift points to other users

**4. Games (13 Games)**
Play against your matches to earn points and build connections:
- **Trivia Master**: General knowledge quiz with multiple choice. Speed bonus for fast answers
- **Word Scramble**: Unscramble letters to form words. Hints available
- **Emoji Guess**: Guess the word/phrase from emoji combinations
- **Speed Math**: Solve math equations as fast as possible. Time pressure scoring
- **Memory Match**: Classic card-matching game with emoji pairs
- **Geography Quiz**: Questions about countries, capitals, flags
- **Logic Master**: Brain-teasing logic puzzles with explanations
- **Pattern Master**: Complete visual/number patterns
- **Color Challenge**: Stroop-effect game — identify colors quickly despite misleading text
- **Quick Draw**: Drawing prompts with timed rounds
- **Reaction Race**: Tap when the screen turns green. Fake-outs (yellow screen) test reflexes. Fastest reaction = most points
- **Riddle Rush**: Solve riddles against the clock. Streak bonuses for consecutive correct answers
- **Word Chain**: Given a category, type words starting with the last letter of the previous word. Speed and word length = more points

Games can be 1v1 (duel) or multiplayer (up to 6 players). Winners take points from losers (70% of stake). Games are played in real-time via WebSocket. Game invitations are sent through chat.

**5. Challenges System**
- Daily, Weekly, and Monthly challenges with different rewards
- Examples: "Match Master" (get 5 matches today, 100pts), "Chat Champion" (send 20 messages, 75pts), "Game Master" (win 10 games this week, 600pts), "Roomie Royale" (earn 5000 pts this month, 2000pts + cash prize)
- Multi-requirement challenges track each action separately (e.g., "Profile Perfectionist" needs 1 profile update AND 2 photo uploads)
- Tier rewards: Gold, Silver, Bronze ranks with badges and point bonuses
- Challenge leaderboard filterable by: Daily, Weekly, Monthly, All Time
- Progress is tracked automatically when users perform actions (matching, messaging, gaming, viewing properties, completing chores, attending events)

**6. Clans (Team Competition)**
- Clans are teams of 5-20+ users who compete together
- Create a clan: choose name, tag (3-6 chars like [RME]), emoji, color, description. Costs 500 points
- Clan roles: Leader (crown icon), Co-Leader (star icon), Member
- Leader can: edit clan, promote/demote members, kick members, start wars, disband
- Co-Leader can: kick regular members, participate in management
- Clan levels: every 1000 total clan points = level up. Max members increases by 5 per level
- Points flow into clans automatically: game wins (+10 clan pts), challenge completions (+15 clan pts)
- Clan Leaderboard: ranked by weekly, monthly, or all-time points
- Clan Wars: challenge another clan. Wars have multiple 1v1 matchups across games/study. Winning clan earns stake points
- War flow: Challenge sent → Accepted/Declined → Players assigned → Matches played → Winner determined → Points awarded
- Invite code system: share code for others to join
- Open clans (anyone can join) vs Closed (invite-only)
- Only verified users can join clans
- Clan Treasury Shop: spend clan points on items for the clan
- Clan Achievements: unlock achievements as a clan
- Clan Missions: complete missions together for rewards
- Clan Announcements: leaders can post announcements for members

**7. Roommate Groups**
- Once matched, users can form a Roommate Group to manage shared living
- Features within groups:
  - **Chores**: Create rotating/volunteer chores with due dates. Track completion with photo proof. Verification by other members
  - **Shared Expenses**: Log expenses, split bills, track who owes whom
  - **Shared Listings**: Save rental listings the group is interested in
  - **Agreements**: Create roommate agreements (house rules, responsibilities, expectations)
  - **Confessions**: Anonymous confession board for honest feedback without awkwardness
  - **Bonding**: Group activities and bonding suggestions
  - **Safety**: Emergency contacts and safety features
  - **Settings**: Group management, member roles, notifications

**8. Events**
- Discover local events, meetups, and community gatherings
- Create events with: title, description, date/time, location, max attendees, category
- RSVP as: Going, Interested, Not Going
- Event categories: Social, Academic, Sports, Housing, Community
- Nearby events shown based on GPS location
- Hosts get notifications when someone RSVPs

**9. Study Buddy**
- Find study partners by subject/category
- Categories: Science, History, Geography, Mathematics, Literature, Technology, etc.
- Challenge other users to timed quiz sessions
- Solo mode (practice) and Challenge mode (1v1)
- Points awarded for correct answers, speed bonuses
- Session results with score comparison

**10. Messaging & Chat**
- Real-time messaging via WebSocket (Socket.IO)
- Message types: text, images, voice notes, videos, files
- Reply to specific messages
- Read receipts (can be disabled in privacy settings)
- Typing indicators
- Chat options: clear chat, block user, report
- Game invitations sent through chat
- Unread message counts with badges

**11. Verification System**
- Users can verify their identity for trust and safety
- Verification unlocks: matching (swiping right), contacting landlords, joining clans
- Verification states: None → Pending → Verified / Rejected
- Verified users get a blue checkmark badge on their profile
- Unverified users can still browse profiles, view listings, and play games — but can't initiate contact

**12. Premium Subscription**
- Premium plan unlocks: profile boost, rewind (undo passes), advanced filters, priority matching, read receipts, extra photos
- Pro plan adds: analytics dashboard, unlimited rewinds, featured profile
- Subscription via Paystack
- Premium badge on profile (gold checkmark)

**13. Privacy Settings (Enforced)**
- Show Online Status: when off, others always see you as offline
- Show Last Seen: when off, last seen timestamp hidden from others
- Profile Visibility: "Everyone" (appear in discovery) or "Matches Only" (hidden from discovery, only matched users can see you)
- Read Receipts: when off, messages aren't marked as "read" for the sender
- Share Location with Roommates: controls location sharing in roommate groups

**14. AI Assistant (You!)**
- Personalized AI chat built into the app
- Users can customize: AI name, color theme, personality (Friendly/Professional/Casual/Motivational)
- Chat history saved and resumable across sessions
- Context-aware: knows the current user's name, location, budget, interests, occupation
- Helps with: roommate advice, rental guidance, app navigation, conflict resolution, budgeting, safety tips, moving checklists
- You are provided with real user and listing data from the database to make personalized recommendations.

**15. Notifications**
- Push notifications for: new matches, messages, game invitations, challenge completions, clan wars, event RSVPs
- In-app notification center with read/unread states
- Notification settings configurable per category

**16. Cosmetics Shop**
- Browse and purchase cosmetic items (profile decorations, badges, frames)
- Items purchased with points

**17. Listing Inquiries Dashboard**
- Track all inquiries you've sent to landlords
- View inquiry status and history

=== APP NAVIGATION ===
The app has 5 main tabs:
1. **Home** — Welcome screen, quick access cards (Groups, Study Buddy, Events, Challenges, Clans), nearby listings, nearby roomies, pending requests, AI assistant floating button
2. **Matches** — For You (swipe cards), Near You (radar view + list), Requests (received/sent), Matched (active matches)
3. **Discover** — Users tab (swipe cards with search/filters), Listings tab (property search)
4. **Messages** — All chat conversations, unread badges
5. **Profile** — Profile info, photos, clan badge, listings, favorites, social links, settings, premium, analytics

=== NIGERIAN CONTEXT ===
- Currency: Nigerian Naira (NGN / ₦)
- Major cities: Lagos (Lekki, Yaba, Ikeja, Surulere, VI, Ajah, Ikoyi), Abuja (Wuse, Garki, Maitama), Port Harcourt, Ibadan, Benin, Enugu, Kano, Kaduna, Owerri
- Primary users: university students (UNILAG, LASU, OAU, UI, FUTO, UNN, ABU, UNIBEN) and young professionals
- Shared apartments ("flats") are common. Self-contain, 1-bedroom, 2-bedroom, room & parlour
- Budget ranges: ₦50,000 - ₦500,000/year for shared rooms (varies by city/area)
- Lagos is the most expensive city. Yaba/Surulere are popular for students. Lekki/VI for professionals
- NEPA/power supply is a key concern — generator access is a valued amenity
- "Caution fee" is common (refundable deposit, usually 1 year's rent)
- Estate/gated community living is preferred for security
- Popular payment: bank transfer, Paystack, OPay, PalmPay

=== SAFETY TIPS (ALWAYS SHARE WHEN RELEVANT) ===
- Always verify your identity and encourage potential roommates to do the same
- Meet in public places first (cafes, restaurants, co-working spaces) before visiting a shared apartment
- Never send money or caution fees before seeing the property in person
- Check the neighborhood at different times of day (morning, evening, night)
- Verify the landlord's identity and property ownership documents
- Use Roomie's in-app chat to keep all communication documented
- Trust the compatibility score but also trust your instincts
- Report suspicious users, fake listings, or scam attempts immediately
- Bring a friend to property viewings
- Check water supply, electricity situation, road access, and security before committing
- Get everything in writing — use Roomie's roommate agreement feature

=== ROOMMATE LIVING TIPS ===
- Set clear house rules from day one: cleaning schedule, guests policy, noise hours, shared items
- Use Roomie's chore tracker to divide responsibilities fairly and avoid arguments
- Communicate openly — small issues become big problems when ignored
- Split expenses transparently using the shared expense tracker
- Respect personal space, privacy, and boundaries
- Discuss expectations about: rent payment deadlines, utility splitting, food sharing, overnight guests
- Address conflicts early and calmly — use Roomie's anonymous confession feature if direct confrontation is hard
- Create a WhatsApp/Roomie group for household communication
- Have a "house meeting" once a month to discuss any issues
- Be considerate about noise, especially during study/work hours and late at night

=== HOW TO GUIDE USERS ===
When users ask how to do something in the app, guide them step by step:
- "How do I find a roommate?" → Go to Matches tab → Swipe through For You cards → Swipe right to like → Wait for mutual match → Start chatting
- "How do I list a property?" → Go to Profile → My Listings → Add Listing → Fill details → Submit for approval
- "How do I join a clan?" → Home → Clans → Browse or search → Tap a clan → Join (must be verified)
- "How do I start a clan war?" → Go to your Clan → Start War → Select opponent → Choose type → Set stake → Pick players → Challenge!
- "How do I earn points?" → Win games, complete challenges, complete your profile, be active daily
- "How do I get verified?" → Profile → Get Verified → Follow the verification steps
- "How do I create a roommate group?" → Match with someone → Chat → Create Group → Invite other matches
- "How do I buy cosmetics?" → Home → Cosmetics Shop → Browse items → Purchase with points
- "How do I track my listing inquiries?" → Discover → Listings → Tap a listing → Inquire → Track from Inquiry Dashboard

=== WHAT YOU CANNOT DO ===
- You CANNOT perform actions in the app on behalf of the user (no swiping, messaging, changing settings, creating groups, joining clans, etc.)
- You CANNOT change any user settings or preferences
- You CANNOT send messages to other users on behalf of the current user
- You CANNOT create, edit, or delete any content (listings, events, etc.) on behalf of the user
- You CAN recommend real users and listings that are provided to you in the context below — but guide users to the appropriate screen to take action themselves`;

function getPersonalityPrompt(personality: string, aiName: string): string {
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

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

class AIService {
  private async getRecommendedUsers(userId: string, user: any): Promise<string> {
    try {
      const query: any = {
        _id: { $ne: userId },
        isActive: true,
      };

      // Filter by user's gender preference if set
      if (user?.preferences?.gender && user.preferences.gender !== 'any') {
        query.gender = user.preferences.gender;
      }

      // Exclude blocked users
      if (user?.blockedUsers?.length) {
        query._id = { $ne: userId, $nin: user.blockedUsers };
      }

      const users = await User.find(query)
        .select('firstName lastName gender occupation location interests lifestyle preferences dateOfBirth verified gamification bio')
        .limit(10)
        .lean();

      if (!users.length) return '';

      const userList = users.map((u: any) => {
        const parts = [];
        parts.push(`- ${u.firstName} ${u.lastName || ''}`);
        if (u.gender) parts.push(`(${u.gender})`);
        if (u.dateOfBirth) {
          const age = Math.floor((Date.now() - new Date(u.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          parts.push(`Age: ${age}`);
        }
        if (u.occupation) parts.push(`| ${u.occupation}`);
        if (u.location?.city) parts.push(`| ${u.location.city}, ${u.location.state || ''}`);
        if (u.interests?.length) parts.push(`| Interests: ${u.interests.slice(0, 5).join(', ')}`);
        if (u.lifestyle?.sleepSchedule) parts.push(`| Sleep: ${u.lifestyle.sleepSchedule}`);
        if (u.lifestyle?.cleanliness) parts.push(`| Cleanliness: ${u.lifestyle.cleanliness}/5`);
        if (u.lifestyle?.socialLevel) parts.push(`| Social: ${u.lifestyle.socialLevel}/5`);
        if (u.preferences?.budget) parts.push(`| Budget: ₦${u.preferences.budget.min?.toLocaleString()}-₦${u.preferences.budget.max?.toLocaleString()}/yr`);
        if (u.preferences?.roomType) parts.push(`| Room: ${u.preferences.roomType}`);
        if (u.verified) parts.push(`| ✓ Verified`);
        if (u.bio) parts.push(`| Bio: "${u.bio.substring(0, 80)}"`);
        return parts.join(' ');
      }).join('\n');

      return `\n\n=== RECOMMENDED USERS ON ROOMIE (real users — only reference these) ===\nThese are real users currently on the platform. When recommending a user, you MUST ALWAYS include their full name (e.g. "I'd suggest checking out **Chioma Okafor**"). Never describe a user without stating their name. Always tell the user to check them out on the Discover or Matches tab.\n${userList}`;
    } catch (e) {
      logger.warn('Failed to load recommended users for AI:', e);
      return '';
    }
  }

  private async getAvailableListings(user: any): Promise<string> {
    try {
      const query: any = { status: 'available' };

      // Filter by user's city if available
      if (user?.location?.city) {
        query['location.city'] = { $regex: new RegExp(user.location.city, 'i') };
      }

      let listings = await Property.find(query)
        .select('title type price location bedrooms bathrooms amenities furnished availableFrom leaseDuration')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // If no listings in user's city, get any available listings
      if (!listings.length && user?.location?.city) {
        listings = await Property.find({ status: 'available' })
          .select('title type price location bedrooms bathrooms amenities furnished availableFrom leaseDuration')
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();
      }

      if (!listings.length) return '';

      const listingList = listings.map((l: any) => {
        const parts = [];
        parts.push(`- "${l.title}"`);
        parts.push(`| ${l.type}`);
        parts.push(`| ₦${l.price?.toLocaleString()}`);
        if (l.location?.city) parts.push(`| ${l.location.city}, ${l.location.state || ''}`);
        parts.push(`| ${l.bedrooms} bed, ${l.bathrooms} bath`);
        if (l.furnished) parts.push(`| Furnished`);
        if (l.amenities?.length) parts.push(`| Amenities: ${l.amenities.slice(0, 5).join(', ')}`);
        if (l.leaseDuration) parts.push(`| Lease: ${l.leaseDuration} months`);
        return parts.join(' ');
      }).join('\n');

      return `\n\n=== AVAILABLE LISTINGS ON ROOMIE (real listings — only reference these) ===\nThese are real rental listings currently on the platform. You can recommend them when relevant. Always tell the user to check the Discover → Listings tab for full details and photos.\n${listingList}`;
    } catch (e) {
      logger.warn('Failed to load listings for AI:', e);
      return '';
    }
  }

  async chat(messages: ChatMessage[], userId: string): Promise<string> {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('AI service not configured');
    }

    // Load user preferences
    const prefs = await this.getPreferences(userId);
    const personalityPrompt = getPersonalityPrompt(prefs.personality, prefs.aiName);

    // Load user context for personalized responses
    let userContext = '';
    let currentUser: any = null;
    try {
      currentUser = await User.findById(userId).select('firstName lastName location preferences lifestyle occupation interests gender dateOfBirth gamification verified subscription blockedUsers').lean();
      if (currentUser) {
        const parts = [];
        if (currentUser.firstName) parts.push(`Name: ${currentUser.firstName} ${currentUser.lastName || ''}.`);
        if (currentUser.gender) parts.push(`Gender: ${currentUser.gender}.`);
        if (currentUser.dateOfBirth) {
          const age = Math.floor((Date.now() - new Date(currentUser.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          parts.push(`Age: ${age}.`);
        }
        if (currentUser.occupation) parts.push(`Occupation: ${currentUser.occupation}.`);
        if (currentUser.location?.city) parts.push(`Location: ${currentUser.location.city}, ${currentUser.location.state || 'Nigeria'}.`);
        if (currentUser.preferences?.budget) parts.push(`Budget: ₦${currentUser.preferences.budget.min?.toLocaleString()} - ₦${currentUser.preferences.budget.max?.toLocaleString()}/year.`);
        if (currentUser.preferences?.roomType) parts.push(`Room preference: ${currentUser.preferences.roomType}.`);
        if (currentUser.interests?.length) parts.push(`Interests: ${currentUser.interests.slice(0, 8).join(', ')}.`);
        if (currentUser.lifestyle?.sleepSchedule) parts.push(`Sleep: ${currentUser.lifestyle.sleepSchedule}.`);
        if (currentUser.lifestyle?.cleanliness) parts.push(`Cleanliness: ${currentUser.lifestyle.cleanliness}/5.`);
        if (currentUser.lifestyle?.socialLevel) parts.push(`Social level: ${currentUser.lifestyle.socialLevel}/5.`);
        if (currentUser.lifestyle?.guestFrequency) parts.push(`Guest frequency: ${currentUser.lifestyle.guestFrequency}.`);
        if (currentUser.lifestyle?.workFromHome) parts.push(`Works from home.`);
        if (currentUser.gamification) parts.push(`Points: ${currentUser.gamification.points?.toLocaleString() || 0}. Level: ${currentUser.gamification.level || 1}.`);
        if (currentUser.verified) parts.push(`Account verified.`);
        if (currentUser.subscription?.plan) parts.push(`Subscription: ${currentUser.subscription.plan}.`);

        // Load clan info
        try {
          const { Clan } = await import('../models/Clan');
          const clan = await Clan.findOne({ 'members.user': userId }).select('name tag level').lean();
          if (clan) parts.push(`Clan: ${(clan as any).name} [${(clan as any).tag}], Level ${(clan as any).level}.`);
        } catch {}

        if (parts.length) userContext = `\n\n=== ABOUT THIS USER (use to personalize responses) ===\n${parts.join(' ')}`;
      }
    } catch (e) {
      logger.warn('Failed to load user context for AI:', e);
    }

    // Load real users and listings from the database
    const [recommendedUsers, availableListings] = await Promise.all([
      this.getRecommendedUsers(userId, currentUser),
      this.getAvailableListings(currentUser),
    ]);

    const systemPrompt = `${ROOMIE_CONTEXT}\n\n${personalityPrompt}${userContext}${recommendedUsers}${availableListings}\n\nKeep responses under 200 words unless the user asks for detail. Format with short paragraphs and bullet points for lists.`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9,
      });

      const reply = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response. Please try again.';
      logger.info(`AI chat for user ${userId}: ${messages[messages.length - 1]?.content?.substring(0, 50)}...`);
      return reply;
    } catch (error: any) {
      logger.error('AI service error:', error.message);
      throw new Error('AI is temporarily unavailable. Please try again later.');
    }
  }

  // ── Chat History ──

  async getChats(userId: string): Promise<IAIChatDocument[]> {
    return AIChat.find({ user: userId }).sort({ updatedAt: -1 }).limit(20).lean();
  }

  async getChat(chatId: string, userId: string): Promise<IAIChatDocument | null> {
    return AIChat.findOne({ _id: chatId, user: userId }).lean();
  }

  async saveMessage(userId: string, chatId: string | null, role: 'user' | 'assistant', content: string): Promise<IAIChatDocument> {
    if (chatId) {
      const chat = await AIChat.findOneAndUpdate(
        { _id: chatId, user: userId },
        { $push: { messages: { role, content, createdAt: new Date() } } },
        { new: true }
      );
      if (chat) return chat;
    }

    // Create new chat with auto-title from first message
    const title = role === 'user' ? content.substring(0, 40) + (content.length > 40 ? '...' : '') : 'New Chat';
    const chat = await AIChat.create({
      user: userId,
      title,
      messages: [{ role, content, createdAt: new Date() }],
    });
    return chat;
  }

  async deleteChat(chatId: string, userId: string): Promise<boolean> {
    const result = await AIChat.deleteOne({ _id: chatId, user: userId });
    return result.deletedCount > 0;
  }

  // ── Preferences ──

  async getPreferences(userId: string): Promise<IAIPreferencesDocument> {
    let prefs = await AIPreferences.findOne({ user: userId });
    if (!prefs) {
      prefs = await AIPreferences.create({ user: userId });
    }
    return prefs;
  }

  async updatePreferences(userId: string, updates: { aiName?: string; colorTheme?: string; personality?: string }): Promise<IAIPreferencesDocument> {
    const prefs = await AIPreferences.findOneAndUpdate(
      { user: userId },
      { $set: updates },
      { new: true, upsert: true }
    );
    return prefs!;
  }

  getSuggestedQuestions(): string[] {
    return [
      'How do I find a compatible roommate?',
      'What areas in Lagos are best for shared apartments?',
      'How do clans and clan wars work?',
      'Help me budget for a shared apartment',
      'What games can I play to earn points?',
      'How do I get verified on Roomie?',
    ];
  }
}

export default new AIService();
