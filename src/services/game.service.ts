// src/services/game.service.ts - COMPLETE VERSION WITH ALL GAMES
import mongoose from 'mongoose';
import { Game, GameSession, User, Match, Message, IGameDocument, IGameSessionDocument } from '../models';
import pointsService from './points.service';
import { 
  emitGameInvitation, 
  emitGameInvitationResponse, 
  emitGameStarted, 
  emitGameEnded,
  emitScoreUpdate,
  emitNewMessage,
} from '../config/socket.config';
import weeklyChallengeService from './weeklyChallenge.service';
import logger from '../utils/logger';

// ============================================
// GAME DATA - TRIVIA
// ============================================
const triviaQuestions = {
  general: [
    { question: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correctAnswer: 'Paris' },
    { question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correctAnswer: 'Mars' },
    { question: 'What is the largest ocean on Earth?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctAnswer: 'Pacific' },
    { question: 'Who painted the Mona Lisa?', options: ['Van Gogh', 'Picasso', 'Da Vinci', 'Michelangelo'], correctAnswer: 'Da Vinci' },
    { question: 'What year did World War II end?', options: ['1943', '1944', '1945', '1946'], correctAnswer: '1945' },
    { question: 'What is the chemical symbol for gold?', options: ['Go', 'Gd', 'Au', 'Ag'], correctAnswer: 'Au' },
    { question: 'Which country has the largest population?', options: ['USA', 'India', 'China', 'Indonesia'], correctAnswer: 'China' },
    { question: 'What is the hardest natural substance?', options: ['Gold', 'Iron', 'Diamond', 'Platinum'], correctAnswer: 'Diamond' },
    { question: 'How many continents are there?', options: ['5', '6', '7', '8'], correctAnswer: '7' },
    { question: 'What is the smallest country in the world?', options: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correctAnswer: 'Vatican City' },
  ],
  science: [
    { question: 'What is H2O commonly known as?', options: ['Salt', 'Water', 'Sugar', 'Oxygen'], correctAnswer: 'Water' },
    { question: 'What gas do plants absorb from the atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Hydrogen'], correctAnswer: 'Carbon Dioxide' },
    { question: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '450,000 km/s', '600,000 km/s'], correctAnswer: '300,000 km/s' },
    { question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi Body'], correctAnswer: 'Mitochondria' },
    { question: 'What planet has the most moons?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], correctAnswer: 'Saturn' },
  ],
  entertainment: [
    { question: 'Who directed Titanic?', options: ['Steven Spielberg', 'James Cameron', 'Christopher Nolan', 'Martin Scorsese'], correctAnswer: 'James Cameron' },
    { question: 'What is the highest-grossing film of all time?', options: ['Titanic', 'Avatar', 'Avengers: Endgame', 'Star Wars'], correctAnswer: 'Avatar' },
    { question: 'Which band performed "Bohemian Rhapsody"?', options: ['The Beatles', 'Led Zeppelin', 'Queen', 'Pink Floyd'], correctAnswer: 'Queen' },
    { question: 'What year was the first iPhone released?', options: ['2005', '2006', '2007', '2008'], correctAnswer: '2007' },
    { question: 'Who played Iron Man in the MCU?', options: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'], correctAnswer: 'Robert Downey Jr.' },
  ],
  sports: [
    { question: 'How many players are on a soccer team?', options: ['9', '10', '11', '12'], correctAnswer: '11' },
    { question: 'Which country won the 2022 FIFA World Cup?', options: ['France', 'Brazil', 'Argentina', 'Germany'], correctAnswer: 'Argentina' },
    { question: 'What sport is played at Wimbledon?', options: ['Golf', 'Cricket', 'Tennis', 'Rugby'], correctAnswer: 'Tennis' },
    { question: 'How many rings are on the Olympic flag?', options: ['4', '5', '6', '7'], correctAnswer: '5' },
    { question: 'Which NBA player is known as "King James"?', options: ['Michael Jordan', 'Kobe Bryant', 'LeBron James', 'Stephen Curry'], correctAnswer: 'LeBron James' },
  ],
  geography: [
    { question: 'What is the longest river in the world?', options: ['Amazon', 'Nile', 'Yangtze', 'Mississippi'], correctAnswer: 'Nile' },
    { question: 'Which country is known as the Land of the Rising Sun?', options: ['China', 'Korea', 'Japan', 'Thailand'], correctAnswer: 'Japan' },
    { question: 'What is the largest desert in the world?', options: ['Sahara', 'Arabian', 'Gobi', 'Antarctic'], correctAnswer: 'Antarctic' },
    { question: 'Which African country has the largest economy?', options: ['South Africa', 'Egypt', 'Nigeria', 'Kenya'], correctAnswer: 'Nigeria' },
    { question: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'], correctAnswer: 'Canberra' },
  ],
};

// ============================================
// GAME DATA - WORD SCRAMBLE
// ============================================
const wordScrambleWords = [
  { word: 'ROOMMATE', hint: 'Someone you share a room with' },
  { word: 'APARTMENT', hint: 'A place to live' },
  { word: 'FRIENDLY', hint: 'Nice and kind' },
  { word: 'KITCHEN', hint: 'Where you cook' },
  { word: 'BEDROOM', hint: 'Where you sleep' },
  { word: 'NEIGHBOR', hint: 'Person living next door' },
  { word: 'CLEANING', hint: 'Making things tidy' },
  { word: 'SHARING', hint: 'Giving part to others' },
  { word: 'COMFORTABLE', hint: 'Feeling at ease' },
  { word: 'LOCATION', hint: 'Where something is' },
  { word: 'ADVENTURE', hint: 'Exciting journey' },
  { word: 'BEAUTIFUL', hint: 'Very pretty' },
  { word: 'COMMUNITY', hint: 'Group of people' },
  { word: 'DELICIOUS', hint: 'Tasty food' },
  { word: 'EXCELLENT', hint: 'Very good' },
];

// ============================================
// GAME DATA - EMOJI GUESS
// ============================================
const emojiChallenges = [
  { emojis: '🦁👑', answer: 'LION KING', hint: 'Disney movie' },
  { emojis: '🕷️🧑', answer: 'SPIDER-MAN', hint: 'Marvel superhero' },
  { emojis: '⭐🔫', answer: 'STAR WARS', hint: 'Space movie franchise' },
  { emojis: '🧊❄️👸', answer: 'FROZEN', hint: 'Disney movie with Elsa' },
  { emojis: '🦈🌊', answer: 'JAWS', hint: 'Classic shark movie' },
  { emojis: '🏠🔝', answer: 'UP', hint: 'Pixar movie with balloons' },
  { emojis: '🧙‍♂️💍', answer: 'LORD OF THE RINGS', hint: 'Fantasy trilogy' },
  { emojis: '🦇🧑', answer: 'BATMAN', hint: 'DC superhero' },
  { emojis: '👻👻👻', answer: 'GHOSTBUSTERS', hint: 'Who you gonna call?' },
  { emojis: '🎭😢😂', answer: 'DRAMA', hint: 'Genre of movies' },
  { emojis: '🧜‍♀️🌊', answer: 'LITTLE MERMAID', hint: 'Disney princess under the sea' },
  { emojis: '🤖👦', answer: 'IRON GIANT', hint: 'Animated robot movie' },
  { emojis: '🏴‍☠️💀', answer: 'PIRATES', hint: 'Sailors who steal treasure' },
  { emojis: '🦖🌴', answer: 'JURASSIC PARK', hint: 'Dinosaur movie' },
  { emojis: '🧙‍♂️⚡', answer: 'HARRY POTTER', hint: 'Boy wizard' },
];

// ============================================
// GAME DATA - GEOGRAPHY QUIZ
// ============================================
const geographyQuestions = [
  { question: 'What is the capital of Japan?', options: ['Seoul', 'Beijing', 'Tokyo', 'Bangkok'], correctAnswer: 'Tokyo', flag: '🇯🇵' },
  { question: 'Which country has the shape of a boot?', options: ['Spain', 'Italy', 'Greece', 'Portugal'], correctAnswer: 'Italy', flag: '🇮🇹' },
  { question: 'The Amazon River flows through which continent?', options: ['Africa', 'Asia', 'South America', 'Australia'], correctAnswer: 'South America', flag: '🌎' },
  { question: 'What is the largest country by area?', options: ['China', 'USA', 'Canada', 'Russia'], correctAnswer: 'Russia', flag: '🇷🇺' },
  { question: 'Which ocean lies between Africa and Australia?', options: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], correctAnswer: 'Indian', flag: '🌊' },
  { question: 'What is the capital of Brazil?', options: ['Rio de Janeiro', 'São Paulo', 'Brasília', 'Salvador'], correctAnswer: 'Brasília', flag: '🇧🇷' },
  { question: 'Mount Everest is located in which mountain range?', options: ['Alps', 'Andes', 'Rockies', 'Himalayas'], correctAnswer: 'Himalayas', flag: '🏔️' },
  { question: 'Which country is known as the Land Down Under?', options: ['New Zealand', 'Australia', 'South Africa', 'Argentina'], correctAnswer: 'Australia', flag: '🇦🇺' },
  { question: 'The Sahara Desert is located in which continent?', options: ['Asia', 'Africa', 'Australia', 'South America'], correctAnswer: 'Africa', flag: '🏜️' },
  { question: 'What is the capital of Canada?', options: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], correctAnswer: 'Ottawa', flag: '🇨🇦' },
  { question: 'Which river runs through Egypt?', options: ['Amazon', 'Nile', 'Ganges', 'Yangtze'], correctAnswer: 'Nile', flag: '🇪🇬' },
  { question: 'What is the smallest continent?', options: ['Europe', 'Antarctica', 'Australia', 'South America'], correctAnswer: 'Australia', flag: '🌏' },
];

// ============================================
// GAME DATA - LOGIC MASTER (Puzzles)
// ============================================
const logicPuzzles = [
  {
    puzzle: 'If all Bloops are Razzles, and all Razzles are Lazzles, are all Bloops definitely Lazzles?',
    options: ['Yes', 'No', 'Cannot determine', 'Only some'],
    correctAnswer: 'Yes',
    explanation: 'This is a transitive relationship - if A→B and B→C, then A→C',
  },
  {
    puzzle: 'What comes next in the sequence: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '46'],
    correctAnswer: '42',
    explanation: 'The differences are 4, 6, 8, 10, 12... (increasing by 2)',
  },
  {
    puzzle: 'A bat and ball cost $1.10. The bat costs $1 more than the ball. How much is the ball?',
    options: ['$0.10', '$0.05', '$0.15', '$0.20'],
    correctAnswer: '$0.05',
    explanation: 'If ball = x, then bat = x + 1. So x + (x+1) = 1.10, meaning x = 0.05',
  },
  {
    puzzle: 'Which number does not belong: 2, 5, 10, 17, __(26)__, 37, 50?',
    options: ['5', '10', '17', 'All belong'],
    correctAnswer: 'All belong',
    explanation: 'Pattern: +3, +5, +7, +9, +11, +13 (differences increase by 2)',
  },
  {
    puzzle: 'If you rearrange "CIFAIPC" you get the name of a(n):',
    options: ['City', 'Animal', 'Ocean', 'Country'],
    correctAnswer: 'Ocean',
    explanation: 'CIFAIPC rearranges to PACIFIC',
  },
  {
    puzzle: 'Mary\'s father has 5 daughters: Nana, Nene, Nini, Nono, and ___?',
    options: ['Nunu', 'Mary', 'Nana', 'None'],
    correctAnswer: 'Mary',
    explanation: 'The question says "Mary\'s father" - so the fifth daughter is Mary!',
  },
  {
    puzzle: 'What is the next letter: O, T, T, F, F, S, S, ?',
    options: ['E', 'N', 'T', 'S'],
    correctAnswer: 'E',
    explanation: 'First letters of: One, Two, Three, Four, Five, Six, Seven, Eight',
  },
  {
    puzzle: 'A farmer has 17 sheep. All but 9 die. How many are left?',
    options: ['8', '9', '17', '0'],
    correctAnswer: '9',
    explanation: '"All but 9" means 9 survive',
  },
  {
    puzzle: 'How many times can you subtract 5 from 25?',
    options: ['5', '1', '4', 'Infinite'],
    correctAnswer: '1',
    explanation: 'You can only subtract 5 from 25 once. After that, you\'re subtracting from 20.',
  },
  {
    puzzle: 'If there are 3 apples and you take away 2, how many do YOU have?',
    options: ['1', '2', '3', '0'],
    correctAnswer: '2',
    explanation: 'You took 2 apples, so YOU have 2',
  },
];

// ============================================
// GAME DATA - PATTERN MASTER
// ============================================
const patternChallenges = [
  {
    pattern: ['🔴', '🔵', '🔴', '🔵', '🔴', '?'],
    options: ['🔴', '🔵', '🟢', '🟡'],
    correctAnswer: '🔵',
    type: 'alternating',
  },
  {
    pattern: ['1', '2', '4', '8', '16', '?'],
    options: ['24', '32', '20', '18'],
    correctAnswer: '32',
    type: 'doubling',
  },
  {
    pattern: ['🌙', '🌙', '⭐', '🌙', '🌙', '⭐', '🌙', '🌙', '?'],
    options: ['🌙', '⭐', '☀️', '🌟'],
    correctAnswer: '⭐',
    type: 'repeating',
  },
  {
    pattern: ['A', 'C', 'E', 'G', 'I', '?'],
    options: ['J', 'K', 'L', 'M'],
    correctAnswer: 'K',
    type: 'skip_letter',
  },
  {
    pattern: ['🟥', '🟧', '🟨', '🟩', '🟦', '?'],
    options: ['🟥', '🟪', '⬛', '⬜'],
    correctAnswer: '🟪',
    type: 'rainbow',
  },
  {
    pattern: ['3', '6', '9', '12', '15', '?'],
    options: ['16', '17', '18', '19'],
    correctAnswer: '18',
    type: 'counting_by_3',
  },
  {
    pattern: ['😀', '😃', '😄', '😁', '😆', '?'],
    options: ['😅', '😂', '🤣', '😊'],
    correctAnswer: '😅',
    type: 'emoji_sequence',
  },
  {
    pattern: ['↑', '→', '↓', '←', '↑', '?'],
    options: ['↑', '→', '↓', '←'],
    correctAnswer: '→',
    type: 'rotation',
  },
  {
    pattern: ['1', '1', '2', '3', '5', '8', '?'],
    options: ['11', '12', '13', '14'],
    correctAnswer: '13',
    type: 'fibonacci',
  },
  {
    pattern: ['🔲', '🔳', '🔲', '🔳', '🔲', '?'],
    options: ['🔲', '🔳', '⬛', '⬜'],
    correctAnswer: '🔳',
    type: 'checkerboard',
  },
];

// ============================================
// GAME DATA - COLOR CHALLENGE
// ============================================
const colorChallenges = [
  { colorName: 'RED', displayColor: '#3B82F6', correctAnswer: 'BLUE' }, // Word says RED, shown in BLUE
  { colorName: 'GREEN', displayColor: '#EF4444', correctAnswer: 'RED' }, // Word says GREEN, shown in RED
  { colorName: 'BLUE', displayColor: '#22C55E', correctAnswer: 'GREEN' }, // Word says BLUE, shown in GREEN
  { colorName: 'YELLOW', displayColor: '#8B5CF6', correctAnswer: 'PURPLE' }, // Word says YELLOW, shown in PURPLE
  { colorName: 'PURPLE', displayColor: '#F59E0B', correctAnswer: 'ORANGE' }, // Word says PURPLE, shown in ORANGE
  { colorName: 'ORANGE', displayColor: '#EC4899', correctAnswer: 'PINK' }, // Word says ORANGE, shown in PINK
  { colorName: 'PINK', displayColor: '#14B8A6', correctAnswer: 'TEAL' }, // Word says PINK, shown in TEAL
  { colorName: 'BLACK', displayColor: '#FFFFFF', correctAnswer: 'WHITE' }, // Word says BLACK, shown in WHITE
  { colorName: 'WHITE', displayColor: '#000000', correctAnswer: 'BLACK' }, // Word says WHITE, shown in BLACK
  { colorName: 'TEAL', displayColor: '#EF4444', correctAnswer: 'RED' }, // Word says TEAL, shown in RED
];

const colorOptions = ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK', 'TEAL', 'BLACK', 'WHITE'];

// ============================================
// GAME DATA - QUICK DRAW (Drawing prompts)
// ============================================
const quickDrawPrompts = [
  { prompt: 'Cat', category: 'Animals', difficulty: 'easy' },
  { prompt: 'House', category: 'Objects', difficulty: 'easy' },
  { prompt: 'Sun', category: 'Nature', difficulty: 'easy' },
  { prompt: 'Tree', category: 'Nature', difficulty: 'easy' },
  { prompt: 'Car', category: 'Vehicles', difficulty: 'easy' },
  { prompt: 'Fish', category: 'Animals', difficulty: 'easy' },
  { prompt: 'Flower', category: 'Nature', difficulty: 'easy' },
  { prompt: 'Book', category: 'Objects', difficulty: 'easy' },
  { prompt: 'Pizza', category: 'Food', difficulty: 'medium' },
  { prompt: 'Airplane', category: 'Vehicles', difficulty: 'medium' },
  { prompt: 'Guitar', category: 'Objects', difficulty: 'medium' },
  { prompt: 'Elephant', category: 'Animals', difficulty: 'medium' },
  { prompt: 'Castle', category: 'Buildings', difficulty: 'medium' },
  { prompt: 'Robot', category: 'Fantasy', difficulty: 'medium' },
  { prompt: 'Bicycle', category: 'Vehicles', difficulty: 'medium' },
  { prompt: 'Dragon', category: 'Fantasy', difficulty: 'hard' },
  { prompt: 'Lighthouse', category: 'Buildings', difficulty: 'hard' },
  { prompt: 'Octopus', category: 'Animals', difficulty: 'hard' },
  { prompt: 'Treehouse', category: 'Buildings', difficulty: 'hard' },
  { prompt: 'Rollercoaster', category: 'Objects', difficulty: 'hard' },
];

class GameService {
  private detectGameType(session: any): string {
    if (!session?.gameData) return 'unknown';
    
    // Check for specific game data structures
    if (session.gameData.reactionRounds && session.gameData.reactionRounds.length > 0) {
      return 'reaction_race';
    } else if (session.gameData.riddles && session.gameData.riddles.length > 0) {
      return 'riddle_rush';
    } else if (session.gameData.wordChain) {
      return 'word_chain';
    } else if (session.gameData.colorChallenges && session.gameData.colorChallenges.length > 0) {
      return 'color_challenge';
    } else if (session.gameData.patterns && session.gameData.patterns.length > 0) {
      return 'pattern_master';
    } else if (session.gameData.puzzles && session.gameData.puzzles.length > 0) {
      return 'logic_master';
    } else if (session.gameData.drawingPrompts && session.gameData.drawingPrompts.length > 0) {
      return 'quick_draw';
    } else if (session.gameData.questions && session.gameData.questions.length > 0) {
      const firstQuestion = session.gameData.questions[0];
      // Speed Math has "=" in the question
      if (firstQuestion.question && firstQuestion.question.includes('=')) {
        return 'speed_math';
      }
      // Geography Quiz has a flag property
      if (firstQuestion.flag) {
        return 'geography_quiz';
      }
      return 'trivia';
    } else if (session.gameData.challenges && session.gameData.challenges.length > 0) {
      return 'emoji';
    } else if (session.gameData.words && session.gameData.words.length > 0) {
      return 'word_scramble';
    } else if (session.gameData.cards && session.gameData.cards.length > 0) {
      return 'memory';
    }
    
    return 'unknown';
  }

  async getAllGames(): Promise<IGameDocument[]> {
    const games = await Game.find({ isActive: true }).sort({ name: 1 });
    return games;
  }

  async getGameById(gameId: string): Promise<IGameDocument> {
    const game = await Game.findOne({ _id: gameId, isActive: true });
    if (!game) {
      throw new Error('Game not found');
    }
    return game;
  }

  async getAvailableGamesForUser(userId: string): Promise<{
    available: IGameDocument[];
    locked: Array<IGameDocument & { reason: string }>;
  }> {
    const user = await User.findById(userId).select('gamification');
    if (!user) throw new Error('User not found');

    const allGames = await Game.find({ isActive: true }).sort({ levelRequired: 1, name: 1 });

    const available: IGameDocument[] = [];
    const locked: Array<IGameDocument & { reason: string }> = [];

    for (const game of allGames) {
      if (game.levelRequired <= user.gamification.level) {
        available.push(game);
      } else {
        locked.push({
          ...game.toObject(),
          reason: `Requires Level ${game.levelRequired}`,
        } as any);
      }
    }

    return { available, locked };
  }

  async canUserPlayGame(userId: string, gameId: string): Promise<{
    canPlay: boolean;
    reason?: string;
    requiredLevel?: number;
    requiredPoints?: number;
    userLevel?: number;
    userPoints?: number;
  }> {
    const [user, game] = await Promise.all([
      User.findById(userId).select('gamification subscription'),
      Game.findById(gameId),
    ]);

    if (!user) throw new Error('User not found');
    if (!game) throw new Error('Game not found');

    if (user.gamification.level < game.levelRequired) {
      return {
        canPlay: false,
        reason: `Requires Level ${game.levelRequired} (you're Level ${user.gamification.level})`,
        requiredLevel: game.levelRequired,
        userLevel: user.gamification.level,
      };
    }

    const pointsCost = await pointsService.calculateGameCost(userId, gameId);

    if (user.gamification.points < pointsCost) {
      return {
        canPlay: false,
        reason: `Needs ${pointsCost} points to stake (you have ${user.gamification.points}). Loser loses 70% to the winner!`,
        requiredPoints: pointsCost,
        userPoints: user.gamification.points,
      };
    }

    return {
      canPlay: true,
      userLevel: user.gamification.level,
      userPoints: user.gamification.points,
      requiredPoints: pointsCost,
    };
  }

  async sendGameInvitation(
    gameId: string,
    inviterId: string,
    invitedUserId: string,
    matchId: string
  ): Promise<IGameSessionDocument> {
    const game = await this.getGameById(gameId);

    const inviterCheck = await this.canUserPlayGame(inviterId, gameId);
    if (!inviterCheck.canPlay) {
      throw new Error(inviterCheck.reason || 'Cannot play this game');
    }

    const invitedCheck = await this.canUserPlayGame(invitedUserId, gameId);
    if (!invitedCheck.canPlay) {
      const invitedUser = await User.findById(invitedUserId).select('firstName');
      const name = invitedUser?.firstName || 'The invited user';
      if (invitedCheck.requiredLevel) {
        throw new Error(`${name} needs to be Level ${invitedCheck.requiredLevel} to play this game (currently Level ${invitedCheck.userLevel})`);
      }
      if (invitedCheck.requiredPoints) {
        throw new Error(`${name} doesn't have enough points for this game (needs ${invitedCheck.requiredPoints}, has ${invitedCheck.userPoints})`);
      }
      throw new Error(`${name} can't play this game right now`);
    }

    const match = await Match.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    const matchUsers = [match.user1.toString(), match.user2.toString()];
    if (!matchUsers.includes(inviterId) || !matchUsers.includes(invitedUserId)) {
      throw new Error('Users are not part of this match');
    }

    const existingInvitation = await GameSession.findOne({
      match: matchId,
      game: gameId,
      status: 'pending',
      $or: [
        { invitedBy: inviterId, invitedUser: invitedUserId },
        { invitedBy: invitedUserId, invitedUser: inviterId },
      ],
    });

    if (existingInvitation) {
      throw new Error('There is already a pending game invitation');
    }

    const pointsCost = await pointsService.calculateGameCost(inviterId, gameId);
    const gameData = this.generateGameData(game.name);

    const sessionDoc = new GameSession({
      game: new mongoose.Types.ObjectId(gameId),
      match: new mongoose.Types.ObjectId(matchId),
      players: [{
        user: new mongoose.Types.ObjectId(inviterId),
        score: 0,
        rank: 0,
        isReady: false,
      }],
      invitedBy: new mongoose.Types.ObjectId(inviterId),
      invitedUser: new mongoose.Types.ObjectId(invitedUserId),
      status: 'pending',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      pointsCost,
      gameData,
    });

    const session = await sessionDoc.save();

    await session.populate([
      { path: 'game', select: 'name description thumbnail category difficulty pointsReward pointsCost levelRequired' },
      { path: 'invitedBy', select: 'firstName lastName profilePhoto' },
    ]);

    const inviter = await User.findById(inviterId).select('firstName lastName profilePhoto');

    const inviteMessage = await Message.create({
      match: matchId,
      sender: inviterId,
      receiver: invitedUserId,
      type: 'game_invite',
      content: `🎮 Invited you to play ${game.name}!`,
      gameData: {
        sessionId: session._id,
        gameId: game._id,
        gameName: game.name,
        gameThumbnail: game.thumbnail,
        status: 'pending',
      },
    });

    await inviteMessage.populate('sender', 'firstName lastName profilePhoto');

    emitGameInvitation(invitedUserId, {
      sessionId: session._id,
      game: session.game,
      invitedBy: inviter,
      matchId,
      expiresAt: session.expiresAt,
      pointsCost,
    });

    emitNewMessage(matchId, inviteMessage.toObject(), inviterId, invitedUserId);

    logger.info(`Game invitation sent: ${session._id}, points cost: ${pointsCost}`);
    return session;
  }

  async sendMultiplayerInvitation(
    gameId: string,
    inviterId: string,
    invitees: Array<{ userId: string; matchId: string }>
  ): Promise<IGameSessionDocument> {
    const game = await this.getGameById(gameId);

    if (invitees.length + 1 > game.maxPlayers) {
      throw new Error(`Maximum ${game.maxPlayers} players allowed (including you)`);
    }

    const inviterCheck = await this.canUserPlayGame(inviterId, gameId);
    if (!inviterCheck.canPlay) {
      throw new Error(inviterCheck.reason || 'Cannot play this game');
    }

    // Validate each invitee
    for (const inv of invitees) {
      const invitedCheck = await this.canUserPlayGame(inv.userId, gameId);
      if (!invitedCheck.canPlay) {
        const invUser = await User.findById(inv.userId).select('firstName');
        throw new Error(`${invUser?.firstName || 'Invited user'}: ${invitedCheck.reason || 'cannot play this game'}`);
      }

      const match = await Match.findById(inv.matchId);
      if (!match) {
        throw new Error('Match not found');
      }
      const matchUsers = [match.user1.toString(), match.user2.toString()];
      if (!matchUsers.includes(inviterId) || !matchUsers.includes(inv.userId)) {
        throw new Error('Users are not part of this match');
      }
    }

    // Check for existing pending multiplayer session from same inviter
    const existingSession = await GameSession.findOne({
      game: gameId,
      invitedBy: inviterId,
      mode: 'multiplayer',
      status: 'pending',
    });
    if (existingSession) {
      throw new Error('You already have a pending multiplayer game invitation');
    }

    const pointsCost = await pointsService.calculateGameCost(inviterId, gameId);
    const gameData = this.generateGameData(game.name);

    const sessionDoc = new GameSession({
      game: new mongoose.Types.ObjectId(gameId),
      mode: 'multiplayer',
      players: [{
        user: new mongoose.Types.ObjectId(inviterId),
        score: 0,
        rank: 0,
        isReady: false,
      }],
      invitedBy: new mongoose.Types.ObjectId(inviterId),
      invitations: invitees.map(inv => ({
        user: new mongoose.Types.ObjectId(inv.userId),
        matchId: new mongoose.Types.ObjectId(inv.matchId),
        status: 'pending',
      })),
      status: 'pending',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min for multiplayer
      pointsCost,
      gameData,
    });

    const session = await sessionDoc.save();

    await session.populate([
      { path: 'game', select: 'name description thumbnail category difficulty pointsReward pointsCost levelRequired' },
      { path: 'invitedBy', select: 'firstName lastName profilePhoto' },
    ]);

    const inviter = await User.findById(inviterId).select('firstName lastName profilePhoto');

    // Send invite message to each invitee via their match chat
    for (const inv of invitees) {
      const inviteMessage = await Message.create({
        match: inv.matchId,
        sender: inviterId,
        receiver: inv.userId,
        type: 'game_invite',
        content: `🎮 Invited you to play ${game.name} with ${invitees.length} others!`,
        gameData: {
          sessionId: session._id,
          gameId: game._id,
          gameName: game.name,
          gameThumbnail: game.thumbnail,
          status: 'pending',
        },
      });

      await inviteMessage.populate('sender', 'firstName lastName profilePhoto');

      emitGameInvitation(inv.userId, {
        sessionId: session._id,
        game: session.game,
        invitedBy: inviter,
        matchId: inv.matchId,
        expiresAt: session.expiresAt,
        pointsCost,
        mode: 'multiplayer',
        totalInvited: invitees.length,
      });

      emitNewMessage(inv.matchId, inviteMessage.toObject(), inviterId, inv.userId);
    }

    logger.info(`Multiplayer game invitation sent: ${session._id}, ${invitees.length} invitees`);
    return session;
  }

  async respondToInvitation(
    sessionId: string,
    userId: string,
    accept: boolean
  ): Promise<IGameSessionDocument> {
    const session = await GameSession.findById(sessionId)
      .populate('game')
      .populate('invitedBy', 'firstName lastName profilePhoto');

    if (!session) {
      throw new Error('Game session not found');
    }

    if (session.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }

    if (session.expiresAt && new Date() > session.expiresAt) {
      session.status = 'expired';
      await session.save();
      throw new Error('Invitation has expired');
    }

    const isMultiplayer = session.mode === 'multiplayer';

    if (isMultiplayer) {
      // Multiplayer path: check invitations array
      const invitation = session.invitations?.find(
        inv => inv.user.toString() === userId
      );
      if (!invitation) {
        throw new Error('You are not invited to this game');
      }
      if (invitation.status !== 'pending') {
        throw new Error('You have already responded to this invitation');
      }

      if (accept) {
        invitation.status = 'accepted';
        invitation.respondedAt = new Date();
        session.players.push({
          user: new mongoose.Types.ObjectId(userId),
          score: 0,
          rank: 0,
          isReady: false,
        } as any);

        // Check if all invitations are responded to
        const allResponded = session.invitations!.every(inv => inv.status !== 'pending');
        const acceptedCount = session.invitations!.filter(inv => inv.status === 'accepted').length;
        const game = session.game as any;
        const minPlayers = game.minPlayers || 2;

        // Async: game becomes active as soon as anyone accepts
        if (session.status === 'pending') {
          session.status = 'active';
          if (!session.startedAt) session.startedAt = new Date();
        }
        if (allResponded && acceptedCount + 1 < minPlayers) {
          session.status = 'cancelled';
        }

        await session.save();

        // Update message for this invitee's match chat
        const inv = session.invitations!.find(i => i.user.toString() === userId);
        if (inv) {
          await Message.updateMany(
            { 'gameData.sessionId': sessionId, match: inv.matchId },
            { 'gameData.status': 'accepted' }
          );
        }
      } else {
        invitation.status = 'declined';
        invitation.respondedAt = new Date();

        const allResponded = session.invitations!.every(inv => inv.status !== 'pending');
        const acceptedCount = session.invitations!.filter(inv => inv.status === 'accepted').length;
        const game = session.game as any;
        const minPlayers = game.minPlayers || 2;

        if (allResponded && acceptedCount + 1 < minPlayers) {
          session.status = 'cancelled';
        }

        await session.save();

        const inv = session.invitations!.find(i => i.user.toString() === userId);
        if (inv) {
          await Message.updateMany(
            { 'gameData.sessionId': sessionId, match: inv.matchId },
            { 'gameData.status': 'declined' }
          );
        }
      }

      // Notify host
      if (session.invitedBy) {
        const invitedByObj = session.invitedBy as any;
        const invitedById = invitedByObj._id ? invitedByObj._id.toString() : invitedByObj.toString();
        emitGameInvitationResponse(invitedById, {
          sessionId: session._id,
          accepted: accept,
          userId,
          game: session.game,
          mode: 'multiplayer',
          acceptedCount: session.invitations!.filter(inv => inv.status === 'accepted').length,
          totalInvited: session.invitations!.length,
          sessionStatus: session.status,
        });
      }

      logger.info(`Multiplayer invitation ${accept ? 'accepted' : 'declined'}: ${sessionId} by ${userId}`);
    } else {
      // Legacy duel path
      if (session.invitedUser?.toString() !== userId) {
        throw new Error('You are not invited to this game');
      }

      if (accept) {
        session.players.push({
          user: new mongoose.Types.ObjectId(userId),
          score: 0,
          rank: 0,
          isReady: false,
        } as any);
        // Async: game becomes active immediately
        session.status = 'active';
        if (!session.startedAt) session.startedAt = new Date();
        await session.save();

        if (session.invitedBy) {
          const invitedByObj = session.invitedBy as any;
          const invitedById = invitedByObj._id ? invitedByObj._id.toString() : invitedByObj.toString();
          emitGameInvitationResponse(invitedById, {
            sessionId: session._id,
            accepted: true,
            userId,
            game: session.game,
          });
        }

        await Message.updateMany(
          { 'gameData.sessionId': sessionId },
          { 'gameData.status': 'accepted' }
        );

        logger.info(`Game invitation accepted: ${sessionId}`);
      } else {
        session.status = 'declined';
        await session.save();

        if (session.invitedBy) {
          const invitedByObj = session.invitedBy as any;
          const invitedById = invitedByObj._id ? invitedByObj._id.toString() : invitedByObj.toString();
          emitGameInvitationResponse(invitedById, {
            sessionId: session._id,
            accepted: false,
            userId,
          });
        }

        await Message.updateMany(
          { 'gameData.sessionId': sessionId },
          { 'gameData.status': 'declined' }
        );

        logger.info(`Game invitation declined: ${sessionId}`);
      }
    }

    return session;
  }

  /**
   * Start game for a single player. Deducts their points and lets them play.
   * The game is async — each player plays on their own schedule.
   */
  async startGameSession(sessionId: string, userId: string): Promise<IGameSessionDocument> {
    const session = await GameSession.findById(sessionId)
      .populate('game')
      .populate('players.user', 'firstName lastName profilePhoto gamification');

    if (!session) throw new Error('Game session not found');
    const game = session.game as any;

    const player = session.players.find(p => {
      const userObj = p.user as any;
      const playerId = userObj._id ? userObj._id.toString() : userObj.toString();
      return playerId === userId;
    });

    if (!player) throw new Error('You are not part of this game session');
    if (session.status === 'completed' || session.status === 'cancelled' || session.status === 'expired') {
      throw new Error('This game session has ended');
    }
    // Check if player already completed
    if ((player as any).completedAt) {
      throw new Error('You have already played this game');
    }

    // Deduct points for THIS player only (if not already deducted)
    // Skip deduction for war games (pointsCost = 0)
    const pointsCost = session.pointsCost || game?.pointsCost || 0;
    if (!(player as any).pointsDeducted && pointsCost > 0) {
      try {
        await pointsService.deductPoints({
          userId,
          amount: pointsCost,
          type: 'game_entry',
          reason: `Game entry: ${game?.name || 'Game'}`,
          metadata: { gameId: game?._id, gameName: game?.name, sessionId: session._id },
        });
        (player as any).pointsDeducted = true;
        logger.info(`Deducted ${pointsCost} points from ${userId} for game ${game?.name}`);
      } catch (error: any) {
        throw new Error('Insufficient points to play this game');
      }
    }

    // Set session to active if it's still pending/waiting
    if (session.status === 'pending' || session.status === 'waiting') {
      session.status = 'active';
      if (!session.startedAt) session.startedAt = new Date();
      await Game.findByIdAndUpdate(game._id, { $inc: { playCount: 1 } });
    }

    await session.save();

    // Emit that this player has started (so others can see)
    emitGameStarted(sessionId, {
      sessionId,
      game: session.game,
      players: session.players,
      gameData: session.gameData,
      startedAt: session.startedAt,
      startedBy: userId,
    });

    logger.info(`Player ${userId} started game session: ${sessionId}`);
    return session;
  }

  async submitAnswer(
    sessionId: string,
    userId: string,
    questionIndex: number,
    answer: string,
    timeSpent: number
  ): Promise<{ correct: boolean; correctAnswer: string; points: number }> {
    const session = await GameSession.findById(sessionId).populate('game');

    if (!session) {
      throw new Error('Game session not found');
    }

    if (session.status !== 'active') {
      throw new Error('Game is not active');
    }

    const player = session.players.find(p => p.user.toString() === userId);
    if (!player) {
      throw new Error('You are not in this game');
    }

    const question = session.gameData?.questions?.[questionIndex];
    if (!question) {
      throw new Error('Question not found');
    }

    const correct = answer === question.correctAnswer;
    
    let points = 0;
    if (correct) {
      const timeBonus = Math.max(0, 100 - timeSpent);
      points = 100 + Math.floor(timeBonus);
    }

    if (!player.answers) {
      player.answers = [];
    }
    player.answers.push({
      questionIndex,
      answer,
      correct,
      timeSpent,
    });

    player.score += points;
    await session.save();

    emitScoreUpdate(sessionId, {
      sessionId,
      userId,
      score: player.score,
      questionIndex,
      correct,
    });

    return {
      correct,
      correctAnswer: question.correctAnswer,
      points,
    };
  }

  async submitAllAnswers(
    sessionId: string,
    userId: string,
    answers: Array<{ questionIndex: number; answer: string; timeSpent: number; correct?: boolean; points?: number }>
  ): Promise<{ score: number; correctCount: number; results: Array<{ questionIndex: number; correct: boolean; correctAnswer: string; points: number }> }> {
    logger.info(`========== SUBMIT ALL ANSWERS ==========`);
    logger.info(`Session: ${sessionId}, User: ${userId}, Answers count: ${answers.length}`);
    logger.info(`Answers received: ${JSON.stringify(answers)}`);
    
    const session = await GameSession.findById(sessionId).populate('game');

    if (!session) {
      logger.error(`Session not found: ${sessionId}`);
      throw new Error('Game session not found');
    }

    if (session.status !== 'active' && session.status !== 'waiting') {
      logger.error(`Game is not active, status: ${session.status}`);
      throw new Error('Game is not active');
    }

    const playerIndex = session.players.findIndex(p => {
      const odId = (p.user as any)._id ? (p.user as any)._id.toString() : p.user.toString();
      return odId === userId;
    });

    if (playerIndex === -1) {
      logger.error(`Player ${userId} not found in session`);
      throw new Error('You are not in this game');
    }

    const player = session.players[playerIndex];
    
    if (player.completedAt) {
      logger.error(`Player ${userId} already submitted`);
      throw new Error('You have already submitted your answers');
    }

    const gameType = this.detectGameType(session);
    logger.info(`Game type detected: ${gameType}`);

    let totalScore = 0;
    const results: Array<{ questionIndex: number; correct: boolean; correctAnswer: string; points: number }> = [];
    const playerAnswers: Array<{ questionIndex: number; answer: string; correct: boolean; timeSpent: number }> = [];

    if (gameType === 'trivia' || gameType === 'speed_math' || gameType === 'geography_quiz') {
      for (const ans of answers) {
        const question = session.gameData?.questions?.[ans.questionIndex];
        if (!question) continue;

        const correct = ans.answer === question.correctAnswer;
        let points = 0;
        
        if (correct) {
          // Speed math has faster time bonus
          const timeMultiplier = gameType === 'speed_math' ? 10 : 5;
          const timeBonus = Math.max(0, 100 - ans.timeSpent * timeMultiplier);
          points = 100 + Math.floor(timeBonus);
        }

        totalScore += points;
        results.push({
          questionIndex: ans.questionIndex,
          correct,
          correctAnswer: question.correctAnswer,
          points,
        });
        
        playerAnswers.push({
          questionIndex: ans.questionIndex,
          answer: ans.answer,
          correct,
          timeSpent: ans.timeSpent,
        });
      }
    } else if (gameType === 'emoji') {
      for (const ans of answers) {
        const challenge = session.gameData?.challenges?.[ans.questionIndex];
        
        if (!challenge) {
          const correct = ans.correct ?? false;
          const points = ans.points ?? 0;
          totalScore += points;
          results.push({
            questionIndex: ans.questionIndex,
            correct,
            correctAnswer: 'N/A',
            points,
          });
          playerAnswers.push({
            questionIndex: ans.questionIndex,
            answer: ans.answer,
            correct,
            timeSpent: ans.timeSpent,
          });
          continue;
        }

        const userAnswer = (ans.answer || '').trim().toUpperCase();
        const correctAnswer = (challenge.answer || '').trim().toUpperCase();
        const correct = userAnswer === correctAnswer;
        
        let points = 0;
        if (correct) {
          const timeBonus = Math.max(0, 100 - ans.timeSpent * 5);
          points = 100 + Math.floor(timeBonus);
        }

        totalScore += points;
        results.push({
          questionIndex: ans.questionIndex,
          correct,
          correctAnswer: challenge.answer,
          points,
        });
        
        playerAnswers.push({
          questionIndex: ans.questionIndex,
          answer: ans.answer,
          correct,
          timeSpent: ans.timeSpent,
        });
      }
    } else if (gameType === 'word_scramble') {
      for (const ans of answers) {
        const word = session.gameData?.words?.[ans.questionIndex];
        
        if (!word) {
          const correct = ans.correct ?? false;
          const points = ans.points ?? 0;
          totalScore += points;
          results.push({
            questionIndex: ans.questionIndex,
            correct,
            correctAnswer: 'N/A',
            points,
          });
          playerAnswers.push({
            questionIndex: ans.questionIndex,
            answer: ans.answer,
            correct,
            timeSpent: ans.timeSpent,
          });
          continue;
        }

        const userAnswer = (ans.answer || '').trim().toUpperCase();
        const correctAnswer = (word.answer || '').trim().toUpperCase();
        const correct = userAnswer === correctAnswer;
        
        let points = 0;
        if (correct) {
          const timeBonus = Math.max(0, 100 - ans.timeSpent * 3);
          points = 100 + Math.floor(timeBonus);
        }

        totalScore += points;
        results.push({
          questionIndex: ans.questionIndex,
          correct,
          correctAnswer: word.answer,
          points,
        });
        
        playerAnswers.push({
          questionIndex: ans.questionIndex,
          answer: ans.answer,
          correct,
          timeSpent: ans.timeSpent,
        });
      }
    } else if (gameType === 'logic_master') {
      for (const ans of answers) {
        const puzzle = session.gameData?.puzzles?.[ans.questionIndex];
        
        if (!puzzle) {
          const correct = ans.correct ?? false;
          const points = ans.points ?? 0;
          totalScore += points;
          results.push({
            questionIndex: ans.questionIndex,
            correct,
            correctAnswer: 'N/A',
            points,
          });
          playerAnswers.push({
            questionIndex: ans.questionIndex,
            answer: ans.answer,
            correct,
            timeSpent: ans.timeSpent,
          });
          continue;
        }

        const correct = ans.answer === puzzle.correctAnswer;
        
        let points = 0;
        if (correct) {
          // Logic puzzles have less time pressure
          const timeBonus = Math.max(0, 100 - ans.timeSpent * 2);
          points = 150 + Math.floor(timeBonus); // Higher base points for logic
        }

        totalScore += points;
        results.push({
          questionIndex: ans.questionIndex,
          correct,
          correctAnswer: puzzle.correctAnswer,
          points,
        });
        
        playerAnswers.push({
          questionIndex: ans.questionIndex,
          answer: ans.answer,
          correct,
          timeSpent: ans.timeSpent,
        });
      }
    } else if (gameType === 'pattern_master') {
      for (const ans of answers) {
        const pattern = session.gameData?.patterns?.[ans.questionIndex];
        
        if (!pattern) {
          const correct = ans.correct ?? false;
          const points = ans.points ?? 0;
          totalScore += points;
          results.push({
            questionIndex: ans.questionIndex,
            correct,
            correctAnswer: 'N/A',
            points,
          });
          playerAnswers.push({
            questionIndex: ans.questionIndex,
            answer: ans.answer,
            correct,
            timeSpent: ans.timeSpent,
          });
          continue;
        }

        const correct = ans.answer === pattern.correctAnswer;
        
        let points = 0;
        if (correct) {
          const timeBonus = Math.max(0, 100 - ans.timeSpent * 5);
          points = 100 + Math.floor(timeBonus);
        }

        totalScore += points;
        results.push({
          questionIndex: ans.questionIndex,
          correct,
          correctAnswer: pattern.correctAnswer,
          points,
        });
        
        playerAnswers.push({
          questionIndex: ans.questionIndex,
          answer: ans.answer,
          correct,
          timeSpent: ans.timeSpent,
        });
      }
    } else if (gameType === 'color_challenge') {
      for (const ans of answers) {
        const challenge = session.gameData?.colorChallenges?.[ans.questionIndex];
        
        if (!challenge) {
          const correct = ans.correct ?? false;
          const points = ans.points ?? 0;
          totalScore += points;
          results.push({
            questionIndex: ans.questionIndex,
            correct,
            correctAnswer: 'N/A',
            points,
          });
          playerAnswers.push({
            questionIndex: ans.questionIndex,
            answer: ans.answer,
            correct,
            timeSpent: ans.timeSpent,
          });
          continue;
        }

        const correct = (ans.answer || '').toUpperCase() === (challenge.correctAnswer || '').toUpperCase();
        
        let points = 0;
        if (correct) {
          // Color challenge rewards speed heavily
          const timeBonus = Math.max(0, 150 - ans.timeSpent * 20);
          points = 50 + Math.floor(timeBonus);
        }

        totalScore += points;
        results.push({
          questionIndex: ans.questionIndex,
          correct,
          correctAnswer: challenge.correctAnswer,
          points,
        });
        
        playerAnswers.push({
          questionIndex: ans.questionIndex,
          answer: ans.answer,
          correct,
          timeSpent: ans.timeSpent,
        });
      }
    } else if (gameType === 'reaction_race') {
      // Reaction Race: lower reaction time = more points. Fake-out taps = penalty
      for (const ans of answers) {
        const round = session.gameData?.reactionRounds?.[ans.questionIndex];
        let points = 0;
        let correct = false;

        if (round?.isFake) {
          // Fake round: tapping = wrong, not tapping = correct
          correct = (ans.answer || '') === 'HELD';
          points = correct ? 100 : -50;
        } else {
          // Real round: faster = more points
          correct = (ans.answer || '') === 'TAPPED';
          if (correct && ans.timeSpent) {
            points = Math.max(10, Math.floor(300 - ans.timeSpent * 500));
          }
        }

        totalScore += Math.max(0, points);
        results.push({ questionIndex: ans.questionIndex, correct, correctAnswer: round?.isFake ? 'HOLD' : 'TAP', points: Math.max(0, points) });
        playerAnswers.push({ questionIndex: ans.questionIndex, answer: ans.answer, correct, timeSpent: ans.timeSpent });
      }
    } else if (gameType === 'riddle_rush') {
      // Riddle Rush: correct answer + speed bonus
      for (const ans of answers) {
        const riddle = session.gameData?.riddles?.[ans.questionIndex];
        if (!riddle) continue;

        const correct = ans.answer?.toUpperCase() === riddle.correctAnswer.toUpperCase();
        let points = 0;
        if (correct) {
          const timeBonus = Math.max(0, 150 - ans.timeSpent * 10);
          points = 100 + Math.floor(timeBonus);
        }

        totalScore += points;
        results.push({ questionIndex: ans.questionIndex, correct, correctAnswer: riddle.correctAnswer, points });
        playerAnswers.push({ questionIndex: ans.questionIndex, answer: ans.answer, correct, timeSpent: ans.timeSpent });
      }
    } else if (gameType === 'word_chain') {
      // Word Chain: client-calculated (valid words checked on frontend)
      for (const ans of answers) {
        const correct = ans.correct ?? false;
        const points = ans.points ?? 0;
        totalScore += points;
        results.push({ questionIndex: ans.questionIndex, correct, correctAnswer: 'Valid word', points });
        playerAnswers.push({ questionIndex: ans.questionIndex, answer: ans.answer, correct, timeSpent: ans.timeSpent });
      }
    } else if (gameType === 'quick_draw' || gameType === 'memory') {
      // These games use client-calculated scores
      for (const ans of answers) {
        const correct = ans.correct ?? false;
        const points = ans.points ?? 0;

        totalScore += points;
        results.push({
          questionIndex: ans.questionIndex,
          correct,
          correctAnswer: gameType === 'memory' ? `${session.gameData?.totalPairs || 8} pairs` : 'Drawing',
          points,
        });
        
        playerAnswers.push({
          questionIndex: ans.questionIndex,
          answer: ans.answer,
          correct,
          timeSpent: ans.timeSpent,
        });
      }
      logger.info(`${gameType} game - using client score: ${totalScore}`);
    } else {
      logger.warn(`Unknown game type: ${gameType}, using client-provided scores`);
      for (const ans of answers) {
        const correct = ans.correct ?? false;
        const points = ans.points ?? 0;

        totalScore += points;
        results.push({
          questionIndex: ans.questionIndex,
          correct,
          correctAnswer: 'N/A',
          points,
        });
        
        playerAnswers.push({
          questionIndex: ans.questionIndex,
          answer: ans.answer,
          correct,
          timeSpent: ans.timeSpent,
        });
      }
    }

    player.score = totalScore;
    player.answers = playerAnswers;
    player.completedAt = new Date();
    await session.save();

    logger.info(`Player ${userId} final score: ${totalScore}, correct: ${results.filter(r => r.correct).length}`);

    emitScoreUpdate(sessionId, {
      sessionId,
      userId,
      score: totalScore,
      completedAt: player.completedAt,
      correctCount: results.filter(r => r.correct).length,
    });

    const updatedSession = await GameSession.findById(sessionId);
    const allCompleted = updatedSession?.players.every(p => p.completedAt);
    
    logger.info(`All players completed: ${allCompleted}`);
    
    if (allCompleted) {
      logger.info(`All players completed! Finalizing game...`);
      await this.finalizeGameSession(sessionId);

      // Send notification to all players that game is complete
      try {
        const notifService = (await import('./notification.service')).default;
        const finalSession = await GameSession.findById(sessionId).populate('game').populate('players.user', 'firstName lastName');
        if (finalSession) {
          const gameName = (finalSession.game as any)?.name || 'Game';
          const playerNames = finalSession.players.map(p => (p.user as any)?.firstName || 'Player').join(', ');
          const winnerPlayer = finalSession.players.find(p => p.rank === 1);
          const winnerName = winnerPlayer ? ((winnerPlayer.user as any)?.firstName || 'Player') : null;

          for (const p of finalSession.players) {
            const pId = ((p.user as any)?._id || p.user).toString();
            try {
              await notifService.createNotification({
                user: pId,
                type: 'system',
                title: `${gameName} Complete!`,
                body: winnerName
                  ? `Game between ${playerNames} has ended. ${winnerName} won!`
                  : `Game between ${playerNames} has ended. It's a tie!`,
                data: { sessionId, type: 'game_complete' },
              });
            } catch {}
          }
        }
      } catch (e) { logger.warn('Game complete notification error:', e); }
    } else {
      // Emit score update so other players can see this player finished
      emitScoreUpdate(sessionId, { userId, score: totalScore, correctCount: results.filter(r => r.correct).length, completed: true });
    }

    logger.info(`========== END SUBMIT ALL ANSWERS ==========`);
    return {
      score: totalScore,
      correctCount: results.filter(r => r.correct).length,
      results,
    };
  }

  private async finalizeGameSession(sessionId: string): Promise<void> {
    logger.info(`========== FINALIZE GAME SESSION WITH POINTS ==========`);
    
    const session = await GameSession.findById(sessionId)
      .populate('game')
      .populate('players.user', 'firstName lastName profilePhoto');

    if (!session || session.status !== 'active') return;

    const game = session.game as any;

    const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);
    sortedPlayers.forEach((player, index) => {
      const playerUserId = (player.user as any)._id 
        ? (player.user as any)._id.toString() 
        : player.user.toString();
      
      const sessionPlayer = session.players.find(p => {
        const spUserId = (p.user as any)._id 
          ? (p.user as any)._id.toString() 
          : p.user.toString();
        return spUserId === playerUserId;
      });
      
      if (sessionPlayer) {
        // Handle ties: same score = same rank
        if (index > 0 && sortedPlayers[index].score === sortedPlayers[index - 1].score) {
          const prevPlayer = session.players.find(sp => {
            const prevUserId = (sortedPlayers[index - 1].user as any)?._id
              ? (sortedPlayers[index - 1].user as any)._id.toString()
              : sortedPlayers[index - 1].user.toString();
            const spUserId = (sp.user as any)?._id
              ? (sp.user as any)._id.toString()
              : sp.user.toString();
            return spUserId === prevUserId;
          });
          sessionPlayer.rank = prevPlayer?.rank || index + 1;
        } else {
          sessionPlayer.rank = index + 1;
        }
      }
    });

    const winner = sortedPlayers[0];
    const stake = session.pointsCost || game.pointsCost || 0;

    if (winner && winner.score > 0 && sortedPlayers.length >= 2) {
      const winnerUserId = (winner.user as any)._id || winner.user;
      session.winner = winnerUserId;

      // Losers lose 70% of stake to winner
      let totalWinnings = 0;
      for (let i = 1; i < sortedPlayers.length; i++) {
        const loser = sortedPlayers[i];
        const loserId = (loser.user as any)._id || loser.user;
        const lossAmount = Math.floor(stake * 0.7);

        if (lossAmount > 0) {
          try {
            await pointsService.deductPoints({
              userId: loserId.toString(),
              amount: lossAmount,
              type: 'penalty',
              reason: `Lost ${game.name} — ${lossAmount} pts to winner`,
              metadata: {
                gameId: game._id,
                sessionId: session._id,
                score: loser.score,
                rank: i + 1,
              },
            });
            loser.pointsEarned = -lossAmount;
            totalWinnings += lossAmount;
          } catch (e) {
            logger.warn(`Failed to deduct points from loser ${loserId}:`, e);
          }
        }
      }

      // Winner receives all collected losers' points
      if (totalWinnings > 0) {
        try {
          const pointsResult = await pointsService.addPoints({
            userId: winnerUserId.toString(),
            amount: totalWinnings,
            type: 'game_reward',
            reason: `Won ${game.name}! Earned ${totalWinnings} pts from opponents`,
            metadata: {
              gameId: game._id,
              gameName: game.name,
              sessionId: session._id,
              score: winner.score,
              rank: 1,
            },
          });

          winner.pointsEarned = totalWinnings;
          session.pointsAwarded = totalWinnings;
          logger.info(`Winner earned ${totalWinnings} pts from ${sortedPlayers.length - 1} losers. Level up: ${pointsResult.leveledUp}`);

          // Track challenge progress for game win
          try { await weeklyChallengeService.trackAction(winnerUserId.toString(), 'game_win'); } catch (e) { logger.warn('Challenge tracking (game_win) error:', e); }

          // Track clan points for game win
          try {
            const clanService = (await import('./clan.service')).default;
            await clanService.trackMemberActivity(winnerUserId.toString(), 'game_win', 3);
            // Track competition points
            const { Clan: ClanModel } = await import('../models/Clan');
            const winnerClan = await ClanModel.findOne({ 'members.user': winnerUserId }).select('_id');
            if (winnerClan) {
              const compService = (await import('./clanCompetition.service')).default;
              await compService.recordCompetitionPoints(winnerUserId.toString(), winnerClan._id.toString(), winner.score || 10, 'game');
            }
          } catch (e) { logger.warn('Clan/competition tracking error:', e); }
        } catch (e) {
          logger.warn('Failed to award winner points:', e);
        }
      }
    } else if (sortedPlayers.length >= 2) {
      // Tie or all scored 0 — no points change
      logger.info('Game ended in tie or zero scores — no points transferred');
      for (const p of sortedPlayers) {
        p.pointsEarned = 0;
      }
    }

    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();

    const winnerUser = winner ? await User.findById((winner.user as any)._id || winner.user).select('firstName lastName') : null;
    await Message.updateMany(
      { 'gameData.sessionId': sessionId },
      { 
        'gameData.status': 'completed',
        'gameData.winnerId': winner ? ((winner.user as any)._id || winner.user) : undefined,
        'gameData.winnerName': winnerUser ? `${winnerUser.firstName} ${winnerUser.lastName}` : undefined,
      }
    );

    // Populate user data for all players
    const playerUserIds = session.players.map(p => (p.user as any)?._id || p.user);
    const playerUsers = await User.find({ _id: { $in: playerUserIds } }).select('firstName lastName profilePhoto').lean();
    const userMap = new Map(playerUsers.map(u => [u._id.toString(), u]));

    emitGameEnded(sessionId, {
      sessionId,
      winner: winner ? {
        _id: (winner.user as any)._id || winner.user,
        firstName: userMap.get(((winner.user as any)._id || winner.user).toString())?.firstName || 'Player',
        lastName: userMap.get(((winner.user as any)._id || winner.user).toString())?.lastName || '',
        score: winner.score,
        pointsEarned: winner.pointsEarned,
      } : null,
      players: session.players.map(p => {
        const uid = ((p.user as any)?._id || p.user).toString();
        const u = userMap.get(uid);
        return {
          user: { _id: uid, firstName: u?.firstName || 'Player', lastName: u?.lastName || '', profilePhoto: u?.profilePhoto },
          score: p.score,
          rank: p.rank,
          pointsEarned: p.pointsEarned,
          correctCount: p.answers?.filter(a => a.correct).length || 0,
        };
      }),
      endedAt: session.endedAt,
      pointsAwarded: session.pointsAwarded,
    });

    // If this is a war game session, submit the result to the war match
    if (session.warId && session.warMatchIndex !== undefined) {
      try {
        const clanService = (await import('./clan.service')).default;
        const players = session.players;
        const p1 = players[0];
        const p2 = players[1];

        if (p1 && p2) {
          // Determine which player is challenger vs defender
          const { ClanWar: ClanWarModel } = await import('../models/Clan');
          const war = await ClanWarModel.findById(session.warId);
          if (war && war.matches[session.warMatchIndex]) {
            const warMatch = war.matches[session.warMatchIndex];
            const p1Id = ((p1.user as any)?._id || p1.user).toString();
            const p2Id = ((p2.user as any)?._id || p2.user).toString();

            let challengerScore = 0;
            let defenderScore = 0;

            if (p1Id === warMatch.challengerPlayer.toString()) {
              challengerScore = p1.score;
              defenderScore = p2.score;
            } else {
              challengerScore = p2.score;
              defenderScore = p1.score;
            }

            const winningSide: 'challenger' | 'defender' | 'tie' =
              challengerScore > defenderScore ? 'challenger' :
              defenderScore > challengerScore ? 'defender' : 'tie';

            await clanService.submitWarMatchResult(
              session.warId.toString(),
              session.warMatchIndex,
              winningSide,
              { challengerScore, defenderScore }
            );
            logger.info(`War match result submitted: war ${session.warId} match ${session.warMatchIndex} → ${winningSide}`);
          }
        }
      } catch (e) {
        logger.warn('Failed to submit war match result from game session:', e);
      }
    }

    logger.info(`✅ Game session finalized with points awarded`);
  }

  async completeGameSession(sessionId: string): Promise<IGameSessionDocument> {
    const session = await GameSession.findById(sessionId)
      .populate('game')
      .populate('players.user', 'firstName lastName profilePhoto')
      .populate('winner', 'firstName lastName profilePhoto');

    if (!session) {
      throw new Error('Game session not found');
    }

    return session;
  }

  async getActiveGameSession(matchId: string): Promise<IGameSessionDocument | null> {
    const session = await GameSession.findOne({
      $or: [
        { match: matchId },
        { 'invitations.matchId': new mongoose.Types.ObjectId(matchId) },
      ],
      status: { $in: ['pending', 'waiting', 'active'] },
    })
      .populate('game')
      .populate('players.user', 'firstName lastName profilePhoto')
      .populate('invitedBy', 'firstName lastName profilePhoto');

    return session;
  }

  async getGameSession(sessionId: string): Promise<IGameSessionDocument> {
    const session = await GameSession.findById(sessionId)
      .populate('game')
      .populate('players.user', 'firstName lastName profilePhoto')
      .populate('invitedBy', 'firstName lastName profilePhoto')
      .populate('winner', 'firstName lastName profilePhoto');

    if (!session) {
      throw new Error('Game session not found');
    }

    return session;
  }

  async cancelInvitation(sessionId: string, userId: string): Promise<void> {
    const session = await GameSession.findById(sessionId);

    if (!session) {
      throw new Error('Game session not found');
    }

    if (!session.invitedBy || session.invitedBy.toString() !== userId) {
      throw new Error('Only the inviter can cancel');
    }

    if (session.status !== 'pending') {
      throw new Error('Cannot cancel this invitation');
    }

    session.status = 'cancelled';
    await session.save();

    await Message.updateMany(
      { 'gameData.sessionId': sessionId },
      { 'gameData.status': 'cancelled' }
    );

    if (session.invitedUser) {
      emitGameInvitationResponse(session.invitedUser.toString(), {
        sessionId,
        cancelled: true,
      });
    }
  }

  async getUserGameHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    sessions: IGameSessionDocument[];
    pagination: any;
  }> {
    const skip = (page - 1) * limit;

    const sessions = await GameSession.find({
      'players.user': userId,
      status: 'completed',
    })
      .populate('game', 'name thumbnail category')
      .populate('players.user', 'firstName lastName profilePhoto')
      .populate('winner', 'firstName lastName profilePhoto')
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await GameSession.countDocuments({
      'players.user': userId,
      status: 'completed',
    });

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getGameLeaderboard(gameId: string, limit: number = 10): Promise<any[]> {
    const sessions = await GameSession.find({
      game: gameId,
      status: 'completed',
    })
      .populate('players.user', 'firstName lastName profilePhoto')
      .sort({ 'players.score': -1 })
      .limit(100);

    const userScores: Map<string, any> = new Map();

    sessions.forEach((session) => {
      session.players.forEach((player) => {
        const userObj = player.user as any;
        const odId = userObj._id ? userObj._id.toString() : userObj.toString();
        const existing = userScores.get(odId);

        if (existing) {
          existing.totalScore += player.score;
          existing.gamesPlayed += 1;
          existing.wins += player.rank === 1 ? 1 : 0;
        } else {
          userScores.set(odId, {
            user: player.user,
            totalScore: player.score,
            gamesPlayed: 1,
            wins: player.rank === 1 ? 1 : 0,
          });
        }
      });
    });

    const leaderboard = Array.from(userScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        user: entry.user,
        totalScore: entry.totalScore,
        gamesPlayed: entry.gamesPlayed,
        wins: entry.wins,
        winRate: ((entry.wins / entry.gamesPlayed) * 100).toFixed(1),
      }));

    return leaderboard;
  }

  // ============================================
  // GAME DATA GENERATORS
  // ============================================
  private generateGameData(gameName: string): any {
    switch (gameName) {
      case 'Trivia Master':
        return this.generateTriviaData();

      case 'Word Scramble':
        return this.generateWordScrambleData();

      case 'Emoji Guess':
        return this.generateEmojiGuessData();

      case 'Speed Math':
        return this.generateSpeedMathData();

      case 'Memory Match':
        return this.generateMemoryMatchData();

      case 'Geography Quiz':
        return this.generateGeographyQuizData();

      case 'Logic Master':
        return this.generateLogicMasterData();

      case 'Pattern Master':
        return this.generatePatternMasterData();

      case 'Color Challenge':
        return this.generateColorChallengeData();

      case 'Quick Draw':
        return this.generateQuickDrawData();

      case 'Reaction Race':
        return this.generateReactionRaceData();

      case 'Riddle Rush':
        return this.generateRiddleRushData();

      case 'Word Chain':
        return this.generateWordChainData();

      default:
        logger.warn(`Unknown game: ${gameName}, returning empty data`);
        return {};
    }
  }

  private generateTriviaData(): any {
    const allQuestions: any[] = [];
    const categories = Object.keys(triviaQuestions) as (keyof typeof triviaQuestions)[];
    
    categories.forEach(category => {
      const categoryQuestions = triviaQuestions[category].map(q => ({
        ...q,
        category,
      }));
      allQuestions.push(...categoryQuestions);
    });

    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, 10);

    return {
      questions: selectedQuestions,
      totalRounds: 10,
      currentRound: 0,
      timeLimit: 15,
    };
  }

  private generateWordScrambleData(): any {
    const shuffled = [...wordScrambleWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, 5);

    return {
      words: selectedWords.map(w => ({
        scrambled: this.scrambleWord(w.word),
        hint: w.hint,
        answer: w.word,
      })),
      totalRounds: 5,
      currentRound: 0,
      timeLimit: 30,
    };
  }

  private generateEmojiGuessData(): any {
    const shuffled = [...emojiChallenges].sort(() => Math.random() - 0.5);
    const selectedChallenges = shuffled.slice(0, 5);

    return {
      challenges: selectedChallenges,
      totalRounds: 5,
      currentRound: 0,
      timeLimit: 20,
    };
  }

  private generateSpeedMathData(): any {
    const questions = [];
    for (let i = 0; i < 10; i++) {
      const question = this.generateMathQuestion();
      questions.push(question);
    }

    return {
      questions,
      totalRounds: 10,
      currentRound: 0,
      timeLimit: 10,
    };
  }

  private generateMemoryMatchData(): any {
    const items = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'];
    const pairs = [...items, ...items];
    const shuffledPairs = pairs.sort(() => Math.random() - 0.5);

    return {
      cards: shuffledPairs.map((emoji, index) => ({
        id: index,
        emoji,
      })),
      totalPairs: items.length,
      timeLimit: 60,
    };
  }

  private generateGeographyQuizData(): any {
    const shuffled = [...geographyQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, 10);

    return {
      questions: selectedQuestions,
      totalRounds: 10,
      currentRound: 0,
      timeLimit: 15,
    };
  }

  private generateLogicMasterData(): any {
    const shuffled = [...logicPuzzles].sort(() => Math.random() - 0.5);
    const selectedPuzzles = shuffled.slice(0, 5);

    return {
      puzzles: selectedPuzzles.map(p => ({
        puzzle: p.puzzle,
        options: p.options,
        correctAnswer: p.correctAnswer,
        explanation: p.explanation,
      })),
      totalRounds: 5,
      currentRound: 0,
      timeLimit: 45, // More time for logic puzzles
    };
  }

  private generatePatternMasterData(): any {
    const shuffled = [...patternChallenges].sort(() => Math.random() - 0.5);
    const selectedPatterns = shuffled.slice(0, 8);

    return {
      patterns: selectedPatterns.map(p => ({
        pattern: p.pattern,
        options: p.options,
        correctAnswer: p.correctAnswer,
        type: p.type,
      })),
      totalRounds: 8,
      currentRound: 0,
      timeLimit: 15,
    };
  }

  private generateColorChallengeData(): any {
    const shuffled = [...colorChallenges].sort(() => Math.random() - 0.5);
    const selectedChallenges = shuffled.slice(0, 15); // More rounds, faster pace

    return {
      colorChallenges: selectedChallenges.map(c => ({
        colorName: c.colorName,
        displayColor: c.displayColor,
        correctAnswer: c.correctAnswer,
      })),
      colorOptions: colorOptions,
      totalRounds: 15,
      currentRound: 0,
      timeLimit: 5, // Very fast - it's a reflex game
    };
  }

  private generateQuickDrawData(): any {
    const shuffled = [...quickDrawPrompts].sort(() => Math.random() - 0.5);
    const selectedPrompts = shuffled.slice(0, 5);

    return {
      drawingPrompts: selectedPrompts.map(p => ({
        prompt: p.prompt,
        category: p.category,
        difficulty: p.difficulty,
      })),
      totalRounds: 5,
      currentRound: 0,
      timeLimit: 30, // 30 seconds per drawing
    };
  }

  private generateReactionRaceData(): any {
    // Generate random delays for each round (1.5s - 5s wait before "GO!")
    const rounds = Array.from({ length: 10 }, (_, i) => ({
      round: i + 1,
      delay: Math.floor(1500 + Math.random() * 3500),
      isFake: Math.random() < 0.2, // 20% chance of fake-out (screen flashes but shouldn't tap)
    }));

    return {
      reactionRounds: rounds,
      totalRounds: 10,
      currentRound: 0,
      timeLimit: 60,
    };
  }

  private generateRiddleRushData(): any {
    const allRiddles = [
      { riddle: 'I have cities but no houses, forests but no trees, water but no fish. What am I?', answer: 'MAP', options: ['MAP', 'GLOBE', 'BOOK', 'DREAM'] },
      { riddle: 'What has hands but can\'t clap?', answer: 'CLOCK', options: ['CLOCK', 'TREE', 'ROBOT', 'STATUE'] },
      { riddle: 'What has a head and tail but no body?', answer: 'COIN', options: ['SNAKE', 'COIN', 'ARROW', 'COMET'] },
      { riddle: 'I speak without a mouth and hear without ears. I have no body but come alive with wind. What am I?', answer: 'ECHO', options: ['ECHO', 'GHOST', 'SHADOW', 'MUSIC'] },
      { riddle: 'What gets wetter the more it dries?', answer: 'TOWEL', options: ['SPONGE', 'TOWEL', 'RAIN', 'SOAP'] },
      { riddle: 'What can travel around the world while staying in a corner?', answer: 'STAMP', options: ['STAMP', 'SPIDER', 'SHADOW', 'WIFI'] },
      { riddle: 'I have keys but no locks. I have space but no room. You can enter but can\'t go inside. What am I?', answer: 'KEYBOARD', options: ['KEYBOARD', 'PIANO', 'HOUSE', 'CAR'] },
      { riddle: 'What has many teeth but cannot bite?', answer: 'COMB', options: ['SAW', 'COMB', 'ZIPPER', 'GEAR'] },
      { riddle: 'What is always in front of you but can\'t be seen?', answer: 'FUTURE', options: ['AIR', 'FUTURE', 'NOSE', 'THOUGHTS'] },
      { riddle: 'I\'m tall when I\'m young and short when I\'m old. What am I?', answer: 'CANDLE', options: ['CANDLE', 'TREE', 'PERSON', 'SHADOW'] },
      { riddle: 'What has one eye but can\'t see?', answer: 'NEEDLE', options: ['NEEDLE', 'CYCLOPS', 'CAMERA', 'POTATO'] },
      { riddle: 'What can you break even if you never pick it up or touch it?', answer: 'PROMISE', options: ['PROMISE', 'HEART', 'SILENCE', 'RECORD'] },
      { riddle: 'What building has the most stories?', answer: 'LIBRARY', options: ['SKYSCRAPER', 'LIBRARY', 'SCHOOL', 'HOSPITAL'] },
      { riddle: 'What has legs but doesn\'t walk?', answer: 'TABLE', options: ['TABLE', 'CHAIR', 'BED', 'STOOL'] },
      { riddle: 'What word becomes shorter when you add two letters to it?', answer: 'SHORT', options: ['SHORT', 'SMALL', 'TINY', 'BRIEF'] },
      { riddle: 'What has a neck but no head?', answer: 'BOTTLE', options: ['GUITAR', 'BOTTLE', 'SHIRT', 'SWAN'] },
      { riddle: 'I follow you everywhere but you can\'t catch me. What am I?', answer: 'SHADOW', options: ['SHADOW', 'TIME', 'WIND', 'MEMORY'] },
      { riddle: 'What starts with "e" and ends with "e" but only has one letter?', answer: 'ENVELOPE', options: ['ENVELOPE', 'EYE', 'EDGE', 'EAGLE'] },
    ];

    const shuffled = [...allRiddles].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 8);

    return {
      riddles: selected.map(r => ({
        riddle: r.riddle,
        options: r.options.sort(() => Math.random() - 0.5),
        correctAnswer: r.answer,
      })),
      totalRounds: 8,
      currentRound: 0,
      timeLimit: 15,
    };
  }

  private generateWordChainData(): any {
    const categories = [
      { name: 'Animals', startWord: 'CAT', examples: ['CAT', 'TIGER', 'RABBIT', 'TURTLE', 'EAGLE'] },
      { name: 'Countries', startWord: 'NIGERIA', examples: ['NIGERIA', 'ARGENTINA', 'AUSTRALIA', 'ANGOLA', 'ALGERIA'] },
      { name: 'Foods', startWord: 'RICE', examples: ['RICE', 'EGG', 'GRAPE', 'EGGPLANT', 'TOMATO'] },
      { name: 'Cities', startWord: 'LAGOS', examples: ['LAGOS', 'SEATTLE', 'EDMONTON', 'NAIROBI', 'ISTANBUL'] },
    ];

    const category = categories[Math.floor(Math.random() * categories.length)];

    return {
      wordChain: {
        category: category.name,
        startWord: category.startWord,
        examples: category.examples,
      },
      totalRounds: 10,
      currentRound: 0,
      timeLimit: 10,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================
  private scrambleWord(word: string): string {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (arr.join('') === word) {
      return this.scrambleWord(word);
    }
    return arr.join('');
  }

  private generateMathQuestion(): { question: string; options: string[]; correctAnswer: string } {
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let num1: number, num2: number, answer: number;

    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 50) + 20;
        num2 = Math.floor(Math.random() * 20) + 1;
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }

    const wrongOptions = new Set<number>();
    while (wrongOptions.size < 3) {
      const wrong = answer + (Math.floor(Math.random() * 20) - 10);
      if (wrong !== answer && wrong > 0) {
        wrongOptions.add(wrong);
      }
    }

    const options = [answer.toString(), ...Array.from(wrongOptions).map(n => n.toString())];
    const shuffledOptions = options.sort(() => Math.random() - 0.5);

    return {
      question: `${num1} ${operation} ${num2} = ?`,
      options: shuffledOptions,
      correctAnswer: answer.toString(),
    };
  }

  // ============================================
  // CLAN WAR GAME SESSIONS
  // ============================================

  private static WAR_GAME_MAP: Record<string, string> = {
    speed_math: 'Speed Math',
    word_scramble: 'Word Scramble',
    emoji_guess: 'Emoji Guess',
    memory_match: 'Memory Match',
    trivia: 'Trivia Master',
  };

  /**
   * Create a game session for a clan war match.
   * If a session already exists for this war match, return it instead.
   */
  async createWarGameSession(
    warId: string,
    matchIndex: number,
    userId: string
  ): Promise<IGameSessionDocument> {
    // Check for existing active session for this war match
    const existing = await GameSession.findOne({
      warId: new mongoose.Types.ObjectId(warId),
      warMatchIndex: matchIndex,
      status: { $in: ['pending', 'waiting', 'active'] },
    }).populate('game', 'name description category thumbnail')
      .populate('players.user', 'firstName lastName profilePhoto');

    if (existing) {
      // If this user isn't in the session yet, add them
      const alreadyIn = existing.players.some(
        p => ((p.user as any)?._id || p.user).toString() === userId
      );
      if (!alreadyIn) {
        existing.players.push({
          user: new mongoose.Types.ObjectId(userId),
          score: 0,
          rank: 0,
          isReady: false,
        } as any);
        existing.status = 'active';
        existing.startedAt = new Date();
        await existing.save();
        await existing.populate('players.user', 'firstName lastName profilePhoto');
      }
      return existing;
    }

    // Load the war to get match details
    const { ClanWar } = await import('../models/Clan');
    const war = await ClanWar.findById(warId);
    if (!war) throw new Error('War not found.');
    if (war.status !== 'in_progress') throw new Error('War is not in progress.');
    if (matchIndex < 0 || matchIndex >= war.matches.length) throw new Error('Invalid match index.');

    const warMatch = war.matches[matchIndex];
    if (warMatch.status === 'completed') throw new Error('This match is already completed.');

    // Verify the user is one of the players in this match
    const isPlayer = warMatch.challengerPlayer.toString() === userId ||
                     warMatch.defenderPlayer.toString() === userId;
    if (!isPlayer) throw new Error('You are not assigned to this match.');

    // Find or create the Game document for this game type
    const gameName = GameService.WAR_GAME_MAP[warMatch.gameType] || 'Trivia Master';
    let game = await Game.findOne({ name: gameName });
    if (!game) {
      game = await Game.create({
        name: gameName,
        description: `${gameName} - Clan War`,
        category: 'war',
        thumbnail: 'https://via.placeholder.com/200',
        minPlayers: 2,
        maxPlayers: 2,
        difficulty: 'medium',
        pointsReward: 0,
        pointsCost: 0,
        levelRequired: 1,
        isActive: true,
      });
    }

    // Generate game data
    const gameData = this.generateGameData(gameName);

    // Create the session with BOTH players
    const opponentId = warMatch.challengerPlayer.toString() === userId
      ? warMatch.defenderPlayer.toString()
      : warMatch.challengerPlayer.toString();

    const session = await GameSession.create({
      game: game._id,
      warId: new mongoose.Types.ObjectId(warId),
      warMatchIndex: matchIndex,
      players: [
        { user: new mongoose.Types.ObjectId(userId), score: 0, rank: 0, isReady: false },
        { user: new mongoose.Types.ObjectId(opponentId), score: 0, rank: 0, isReady: false },
      ],
      invitedBy: new mongoose.Types.ObjectId(userId),
      mode: 'duel',
      status: 'active',
      startedAt: new Date(),
      pointsCost: 0,
      pointsAwarded: 0,
      gameData,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
    });

    // Mark the war match as playing
    warMatch.status = 'playing';
    await war.save();

    // Notify the opponent
    try {
      const currentUser = await User.findById(userId).select('firstName');
      const notifService = (await import('./notification.service')).default;
      await notifService.createNotification({
        user: opponentId,
        type: 'system',
        title: 'War Match Started!',
        body: `${currentUser?.firstName || 'Your opponent'} is ready to play ${gameName}! Tap to join the battle.`,
        data: { type: 'war_game', warId, matchIndex: matchIndex.toString(), sessionId: session._id.toString() },
      });
    } catch (e) { logger.warn('War game notification error:', e); }

    await session.populate('game', 'name description category thumbnail');
    await session.populate('players.user', 'firstName lastName profilePhoto');

    logger.info(`War game session created: ${session._id} for war ${warId} match ${matchIndex}`);
    return session;
  }
}

export default new GameService();