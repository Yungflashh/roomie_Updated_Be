// src/services/game.service.ts
import mongoose from 'mongoose';
import { Game, GameSession, User, Match, Message, IGameDocument, IGameSessionDocument } from '../models';
import { 
  emitGameInvitation, 
  emitGameInvitationResponse, 
  emitGameStarted, 
  emitGameEnded,
  emitScoreUpdate,
  emitNewMessage,
} from '../config/socket.config';
import logger from '../utils/logger';

// Trivia questions database
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

// Word scramble words
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
];

// Emoji guess challenges
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
];

class GameService {
  /**
   * Get all available games
   */
  async getAllGames(): Promise<IGameDocument[]> {
    const games = await Game.find({ isActive: true }).sort({ name: 1 });
    return games;
  }

  /**
   * Get game by ID
   */
  async getGameById(gameId: string): Promise<IGameDocument> {
    const game = await Game.findOne({ _id: gameId, isActive: true });
    
    if (!game) {
      throw new Error('Game not found');
    }

    return game;
  }

  /**
   * Send game invitation to a match
   */
  async sendGameInvitation(
    gameId: string,
    inviterId: string,
    invitedUserId: string,
    matchId: string
  ): Promise<IGameSessionDocument> {
    // Verify game exists
    const game = await this.getGameById(gameId);

    // Verify match exists and both users are part of it
    const match = await Match.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    const matchUsers = [match.user1.toString(), match.user2.toString()];
    if (!matchUsers.includes(inviterId) || !matchUsers.includes(invitedUserId)) {
      throw new Error('Users are not part of this match');
    }

    // Check for existing pending invitation
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

    // Generate game data based on game type
    const gameData = this.generateGameData(game.name);

    // Create game session with pending status
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
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
      gameData,
    });

    const session = await sessionDoc.save();

    // Populate for response
    await session.populate([
      { path: 'game', select: 'name description thumbnail category difficulty pointsReward' },
      { path: 'invitedBy', select: 'firstName lastName profilePhoto' },
    ]);

    // Get inviter details
    const inviter = await User.findById(inviterId).select('firstName lastName profilePhoto');

    // Create game invitation message in chat
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

    // Emit socket events
    emitGameInvitation(invitedUserId, {
      sessionId: session._id,
      game: session.game,
      invitedBy: inviter,
      matchId,
      expiresAt: session.expiresAt,
    });

    // Emit message to receiver
    emitNewMessage(matchId, inviteMessage.toObject(), inviterId, invitedUserId);

    logger.info(`Game invitation sent: ${session._id} from ${inviterId} to ${invitedUserId}`);
    return session;
  }

  /**
   * Respond to game invitation
   */
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

    if (session.invitedUser?.toString() !== userId) {
      throw new Error('You are not invited to this game');
    }

    if (session.status !== 'pending') {
      throw new Error('Invitation is no longer valid');
    }

    if (session.expiresAt && new Date() > session.expiresAt) {
      session.status = 'expired';
      await session.save();
      throw new Error('Invitation has expired');
    }

    if (accept) {
      // Add player to session
      session.players.push({
        user: new mongoose.Types.ObjectId(userId),
        score: 0,
        rank: 0,
        isReady: false,
      } as any);
      session.status = 'waiting';
      await session.save();

      // Notify inviter
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

      // Update the game invite message status
      await Message.updateMany(
        { 'gameData.sessionId': sessionId },
        { 'gameData.status': 'accepted' }
      );

      logger.info(`Game invitation accepted: ${sessionId}`);
    } else {
      session.status = 'declined';
      await session.save();

      // Notify inviter
      if (session.invitedBy) {
        const invitedByObj = session.invitedBy as any;
        const invitedById = invitedByObj._id ? invitedByObj._id.toString() : invitedByObj.toString();
        
        emitGameInvitationResponse(invitedById, {
          sessionId: session._id,
          accepted: false,
          userId,
        });
      }

      // Update the game invite message status
      await Message.updateMany(
        { 'gameData.sessionId': sessionId },
        { 'gameData.status': 'declined' }
      );

      logger.info(`Game invitation declined: ${sessionId}`);
    }

    return session;
  }

  /**
   * Start game session
   */
  async startGameSession(sessionId: string, userId: string): Promise<IGameSessionDocument> {
    const session = await GameSession.findById(sessionId)
      .populate('game')
      .populate('players.user', 'firstName lastName profilePhoto');

    if (!session) {
      throw new Error('Game session not found');
    }

    const game = session.game as any;

    // Verify user is in the session
    const isPlayer = session.players.some(p => {
      const userObj = p.user as any;
      const odId = userObj._id ? userObj._id.toString() : userObj.toString();
      return odId === userId;
    });
    
    if (!isPlayer) {
      throw new Error('You are not part of this game session');
    }

    if (session.status !== 'waiting') {
      throw new Error('Game cannot be started');
    }

    if (session.players.length < game.minPlayers) {
      throw new Error(`Minimum ${game.minPlayers} players required`);
    }

    session.status = 'active';
    session.startedAt = new Date();
    await session.save();

    // Emit game started event
    emitGameStarted(sessionId, {
      sessionId,
      game: session.game,
      players: session.players,
      gameData: session.gameData,
      startedAt: session.startedAt,
    });

    logger.info(`Game session started: ${sessionId}`);
    return session;
  }

  /**
   * Submit game answer (for trivia-type games)
   */
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

    logger.info(`Submit answer - Session: ${sessionId}, questionIndex: ${questionIndex}, gameData: ${JSON.stringify(session.gameData)}`);

    const question = session.gameData?.questions?.[questionIndex];
    if (!question) {
      logger.error(`Question not found - gameData.questions length: ${session.gameData?.questions?.length || 0}, questionIndex: ${questionIndex}`);
      throw new Error('Question not found');
    }

    const correct = answer === question.correctAnswer;
    
    // Calculate points based on correctness and time
    let points = 0;
    if (correct) {
      // Base points + time bonus
      const timeBonus = Math.max(0, 100 - timeSpent); // Max 100 bonus points for quick answers
      points = 100 + Math.floor(timeBonus);
    }

    // Record answer
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

    // Emit score update
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

  /**
   * Submit all answers at once when player completes
   */
  async submitAllAnswers(
    sessionId: string,
    userId: string,
    answers: Array<{ questionIndex: number; answer: string; timeSpent: number }>
  ): Promise<{ score: number; correctCount: number; results: Array<{ questionIndex: number; correct: boolean; correctAnswer: string; points: number }> }> {
    logger.info(`========== SUBMIT ALL ANSWERS ==========`);
    logger.info(`Session: ${sessionId}, User: ${userId}, Answers count: ${answers.length}`);
    
    const session = await GameSession.findById(sessionId).populate('game');

    if (!session) {
      logger.error(`Session not found: ${sessionId}`);
      throw new Error('Game session not found');
    }

    logger.info(`Session status: ${session.status}`);
    logger.info(`Players: ${JSON.stringify(session.players.map(p => ({
      oderId: p.user.toString(),
      score: p.score,
      completedAt: p.completedAt
    })))}`);

    if (session.status !== 'active') {
      logger.error(`Game is not active, status: ${session.status}`);
      throw new Error('Game is not active');
    }

    const playerIndex = session.players.findIndex(p => {
      const odId = (p.user as any)._id ? (p.user as any)._id.toString() : p.user.toString();
      return odId === userId;
    });

    logger.info(`Player index: ${playerIndex}`);

    if (playerIndex === -1) {
      logger.error(`Player ${userId} not found in session`);
      throw new Error('You are not in this game');
    }

    const player = session.players[playerIndex];
    
    // Check if player already submitted
    if (player.completedAt) {
      logger.error(`Player ${userId} already submitted`);
      throw new Error('You have already submitted your answers');
    }

    let totalScore = 0;
    const results: Array<{ questionIndex: number; correct: boolean; correctAnswer: string; points: number }> = [];
    const playerAnswers: Array<{ questionIndex: number; answer: string; correct: boolean; timeSpent: number }> = [];

    // Calculate score for each answer
    for (const ans of answers) {
      const question = session.gameData?.questions?.[ans.questionIndex];
      if (!question) continue;

      const correct = ans.answer === question.correctAnswer;
      let points = 0;
      
      if (correct) {
        // Base points + time bonus (faster = more points)
        const timeBonus = Math.max(0, 100 - ans.timeSpent * 5); // 5 points per second penalty
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

    // Update player in session
    player.score = totalScore;
    player.answers = playerAnswers;
    player.completedAt = new Date();
    await session.save();

    logger.info(`Player ${userId} score calculated: ${totalScore}, correct: ${results.filter(r => r.correct).length}`);

    // Emit score update to game room
    emitScoreUpdate(sessionId, {
      sessionId,
      userId,
      score: totalScore,
      completedAt: player.completedAt,
      correctCount: results.filter(r => r.correct).length,
    });

    logger.info(`Score update emitted for player ${userId}`);

    // Check if all players have completed
    // Need to re-fetch to get latest state
    const updatedSession = await GameSession.findById(sessionId);
    const allCompleted = updatedSession?.players.every(p => p.completedAt);
    
    logger.info(`========== COMPLETION CHECK ==========`);
    logger.info(`All players completed: ${allCompleted}`);
    logger.info(`Players completion status: ${JSON.stringify(updatedSession?.players.map(p => ({
      oderId: p.user.toString(),
      completedAt: p.completedAt ? 'YES' : 'NO'
    })))}`);
    
    if (allCompleted) {
      logger.info(`All players completed! Finalizing game...`);
      await this.finalizeGameSession(sessionId);
    } else {
      logger.info(`Waiting for other players to complete`);
    }

    logger.info(`========== END SUBMIT ALL ANSWERS ==========`);
    return {
      score: totalScore,
      correctCount: results.filter(r => r.correct).length,
      results,
    };
  }

  /**
   * Finalize game session when all players complete
   */
  private async finalizeGameSession(sessionId: string): Promise<void> {
    logger.info(`========== FINALIZE GAME SESSION ==========`);
    logger.info(`Session: ${sessionId}`);
    
    const session = await GameSession.findById(sessionId)
      .populate('game')
      .populate('players.user', 'firstName lastName profilePhoto');

    if (!session) {
      logger.error(`Session not found: ${sessionId}`);
      return;
    }
    
    logger.info(`Session status: ${session.status}`);
    
    if (session.status !== 'active') {
      logger.info(`Session is not active (${session.status}), skipping finalization`);
      return;
    }

    logger.info(`Players scores: ${JSON.stringify(session.players.map(p => ({
      oderId: (p.user as any)._id || p.user,
      firstName: (p.user as any).firstName,
      score: p.score
    })))}`);

    // Calculate rankings
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
        sessionPlayer.rank = index + 1;
      }
    });

    // Determine winner (highest score)
    const winner = sortedPlayers[0];
    logger.info(`Winner determined: ${winner ? `${(winner.user as any).firstName} with score ${winner.score}` : 'No winner (tie or no scores)'}`);
    
    if (winner && winner.score > 0) {
      const winnerUserId = (winner.user as any)._id || winner.user;
      session.winner = winnerUserId;
      
      // Award points to winner
      const game = session.game as any;
      if (game.pointsReward) {
        await User.findByIdAndUpdate(winnerUserId, {
          $inc: { points: game.pointsReward },
        });
        logger.info(`Awarded ${game.pointsReward} points to winner ${winnerUserId}`);
      }
    }

    session.status = 'completed';
    session.endedAt = new Date();
    await session.save();
    
    logger.info(`Session saved with status: completed`);

    // Update game invite message
    const winnerUser = winner ? await User.findById((winner.user as any)._id || winner.user).select('firstName lastName') : null;
    await Message.updateMany(
      { 'gameData.sessionId': sessionId },
      { 
        'gameData.status': 'completed',
        'gameData.winnerId': winner ? ((winner.user as any)._id || winner.user) : undefined,
        'gameData.winnerName': winnerUser ? `${winnerUser.firstName} ${winnerUser.lastName}` : undefined,
      }
    );

    // Emit game ended to all players
    const gameEndedData = {
      sessionId,
      winner: winner ? {
        _id: (winner.user as any)._id || winner.user,
        firstName: (winner.user as any).firstName,
        lastName: (winner.user as any).lastName,
        score: winner.score,
      } : null,
      players: session.players.map(p => ({
        user: p.user,
        score: p.score,
        rank: p.rank,
        correctCount: p.answers?.filter(a => a.correct).length || 0,
      })),
      endedAt: session.endedAt,
    };
    
    logger.info(`Emitting game:ended event with data: ${JSON.stringify(gameEndedData)}`);
    emitGameEnded(sessionId, gameEndedData);

    logger.info(`✅ Game session finalized: ${sessionId}`);
    logger.info(`========== END FINALIZE GAME SESSION ==========`);
  }

  /**
   * Complete game session (legacy - now just returns session status)
   */
  async completeGameSession(sessionId: string): Promise<IGameSessionDocument> {
    const session = await GameSession.findById(sessionId)
      .populate('game')
      .populate('players.user', 'firstName lastName profilePhoto')
      .populate('winner', 'firstName lastName profilePhoto');

    if (!session) {
      throw new Error('Game session not found');
    }

    // Just return the current session state
    return session;
  }

  /**
   * Get active game session for a match
   */
  async getActiveGameSession(matchId: string): Promise<IGameSessionDocument | null> {
    const session = await GameSession.findOne({
      match: matchId,
      status: { $in: ['pending', 'waiting', 'active'] },
    })
      .populate('game')
      .populate('players.user', 'firstName lastName profilePhoto')
      .populate('invitedBy', 'firstName lastName profilePhoto');

    return session;
  }

  /**
   * Get game session by ID
   */
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

  /**
   * Cancel game invitation
   */
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

    // Update message
    await Message.updateMany(
      { 'gameData.sessionId': sessionId },
      { 'gameData.status': 'cancelled' }
    );

    // Notify invited user
    if (session.invitedUser) {
      emitGameInvitationResponse(session.invitedUser.toString(), {
        sessionId,
        cancelled: true,
      });
    }
  }

  /**
   * Get user game history
   */
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

  /**
   * Get game leaderboard
   */
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

  /**
   * Generate game data based on game type
   */
  private generateGameData(gameName: string): any {
    switch (gameName) {
      case 'Trivia Master': {
        // Pick random questions from different categories
        const allQuestions: any[] = [];
        const categories = Object.keys(triviaQuestions) as (keyof typeof triviaQuestions)[];
        
        categories.forEach(category => {
          const categoryQuestions = triviaQuestions[category].map(q => ({
            ...q,
            category,
          }));
          allQuestions.push(...categoryQuestions);
        });

        // Shuffle and pick 10 questions
        const shuffled = allQuestions.sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, 10);

        return {
          questions: selectedQuestions,
          totalRounds: 10,
          currentRound: 0,
          timeLimit: 15, // seconds per question
        };
      }

      case 'Word Scramble': {
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

      case 'Emoji Guess': {
        const shuffled = [...emojiChallenges].sort(() => Math.random() - 0.5);
        const selectedChallenges = shuffled.slice(0, 5);

        return {
          challenges: selectedChallenges,
          totalRounds: 5,
          currentRound: 0,
          timeLimit: 20,
        };
      }

      case 'Speed Math': {
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

      case 'Memory Match': {
        // Generate pairs of items
        const items = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍒', '🥝', '🍑'];
        const pairs = [...items, ...items];
        const shuffledPairs = pairs.sort(() => Math.random() - 0.5);

        return {
          cards: shuffledPairs.map((emoji, index) => ({
            id: index,
            emoji,
          })),
          totalPairs: items.length,
          timeLimit: 60, // total game time
        };
      }

      default:
        return {};
    }
  }

  private scrambleWord(word: string): string {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    // Make sure it's actually scrambled
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

    // Generate wrong options
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
}

export default new GameService();