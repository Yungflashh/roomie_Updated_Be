"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/game.service.ts - COMPLETE WITH POINTS SYSTEM
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const points_service_1 = __importDefault(require("./points.service"));
const socket_config_1 = require("../config/socket.config");
const logger_1 = __importDefault(require("../utils/logger"));
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
    async getAllGames() {
        const games = await models_1.Game.find({ isActive: true }).sort({ name: 1 });
        return games;
    }
    /**
     * Get game by ID
     */
    async getGameById(gameId) {
        const game = await models_1.Game.findOne({ _id: gameId, isActive: true });
        if (!game) {
            throw new Error('Game not found');
        }
        return game;
    }
    /**
     * Get games available for user (based on level)
     */
    async getAvailableGamesForUser(userId) {
        const user = await models_1.User.findById(userId).select('gamification');
        if (!user)
            throw new Error('User not found');
        const allGames = await models_1.Game.find({ isActive: true }).sort({ levelRequired: 1, name: 1 });
        const available = [];
        const locked = [];
        for (const game of allGames) {
            if (game.levelRequired <= user.gamification.level) {
                available.push(game);
            }
            else {
                locked.push({
                    ...game.toObject(),
                    reason: `Requires Level ${game.levelRequired}`,
                });
            }
        }
        return { available, locked };
    }
    /**
     * Check if user can play game (level + points)
     */
    async canUserPlayGame(userId, gameId) {
        const [user, game] = await Promise.all([
            models_1.User.findById(userId).select('gamification subscription'),
            models_1.Game.findById(gameId),
        ]);
        if (!user)
            throw new Error('User not found');
        if (!game)
            throw new Error('Game not found');
        // Check level requirement
        if (user.gamification.level < game.levelRequired) {
            return {
                canPlay: false,
                reason: `Requires Level ${game.levelRequired}. You are Level ${user.gamification.level}`,
                requiredLevel: game.levelRequired,
                userLevel: user.gamification.level,
            };
        }
        // Calculate points cost (with premium discount)
        const pointsCost = await points_service_1.default.calculateGameCost(userId, gameId);
        // Check points requirement
        if (user.gamification.points < pointsCost) {
            return {
                canPlay: false,
                reason: `Requires ${pointsCost} points. You have ${user.gamification.points}`,
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
    /**
     * Send game invitation (with points check)
     */
    async sendGameInvitation(gameId, inviterId, invitedUserId, matchId) {
        // Verify game exists
        const game = await this.getGameById(gameId);
        // Check if inviter can play
        const inviterCheck = await this.canUserPlayGame(inviterId, gameId);
        if (!inviterCheck.canPlay) {
            throw new Error(inviterCheck.reason || 'Cannot play this game');
        }
        // Check if invited user can play
        const invitedCheck = await this.canUserPlayGame(invitedUserId, gameId);
        if (!invitedCheck.canPlay) {
            throw new Error(`Invited user: ${invitedCheck.reason || 'cannot play this game'}`);
        }
        // Verify match exists and both users are part of it
        const match = await models_1.Match.findById(matchId);
        if (!match) {
            throw new Error('Match not found');
        }
        const matchUsers = [match.user1.toString(), match.user2.toString()];
        if (!matchUsers.includes(inviterId) || !matchUsers.includes(invitedUserId)) {
            throw new Error('Users are not part of this match');
        }
        // Check for existing pending invitation
        const existingInvitation = await models_1.GameSession.findOne({
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
        // Calculate points cost
        const pointsCost = await points_service_1.default.calculateGameCost(inviterId, gameId);
        // Generate game data
        const gameData = this.generateGameData(game.name);
        // Create game session
        const sessionDoc = new models_1.GameSession({
            game: new mongoose_1.default.Types.ObjectId(gameId),
            match: new mongoose_1.default.Types.ObjectId(matchId),
            players: [{
                    user: new mongoose_1.default.Types.ObjectId(inviterId),
                    score: 0,
                    rank: 0,
                    isReady: false,
                }],
            invitedBy: new mongoose_1.default.Types.ObjectId(inviterId),
            invitedUser: new mongoose_1.default.Types.ObjectId(invitedUserId),
            status: 'pending',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            pointsCost,
            gameData,
        });
        const session = await sessionDoc.save();
        // Populate for response
        await session.populate([
            { path: 'game', select: 'name description thumbnail category difficulty pointsReward pointsCost levelRequired' },
            { path: 'invitedBy', select: 'firstName lastName profilePhoto' },
        ]);
        // Get inviter details
        const inviter = await models_1.User.findById(inviterId).select('firstName lastName profilePhoto');
        // Create game invitation message
        const inviteMessage = await models_1.Message.create({
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
        (0, socket_config_1.emitGameInvitation)(invitedUserId, {
            sessionId: session._id,
            game: session.game,
            invitedBy: inviter,
            matchId,
            expiresAt: session.expiresAt,
            pointsCost,
        });
        (0, socket_config_1.emitNewMessage)(matchId, inviteMessage.toObject(), inviterId, invitedUserId);
        logger_1.default.info(`Game invitation sent: ${session._id}, points cost: ${pointsCost}`);
        return session;
    }
    /**
     * Respond to game invitation
     */
    async respondToInvitation(sessionId, userId, accept) {
        const session = await models_1.GameSession.findById(sessionId)
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
                user: new mongoose_1.default.Types.ObjectId(userId),
                score: 0,
                rank: 0,
                isReady: false,
            });
            session.status = 'waiting';
            await session.save();
            // Notify inviter
            if (session.invitedBy) {
                const invitedByObj = session.invitedBy;
                const invitedById = invitedByObj._id ? invitedByObj._id.toString() : invitedByObj.toString();
                (0, socket_config_1.emitGameInvitationResponse)(invitedById, {
                    sessionId: session._id,
                    accepted: true,
                    userId,
                    game: session.game,
                });
            }
            // Update the game invite message status
            await models_1.Message.updateMany({ 'gameData.sessionId': sessionId }, { 'gameData.status': 'accepted' });
            logger_1.default.info(`Game invitation accepted: ${sessionId}`);
        }
        else {
            session.status = 'declined';
            await session.save();
            // Notify inviter
            if (session.invitedBy) {
                const invitedByObj = session.invitedBy;
                const invitedById = invitedByObj._id ? invitedByObj._id.toString() : invitedByObj.toString();
                (0, socket_config_1.emitGameInvitationResponse)(invitedById, {
                    sessionId: session._id,
                    accepted: false,
                    userId,
                });
            }
            // Update the game invite message status
            await models_1.Message.updateMany({ 'gameData.sessionId': sessionId }, { 'gameData.status': 'declined' });
            logger_1.default.info(`Game invitation declined: ${sessionId}`);
        }
        return session;
    }
    /**
     * Start game session (deduct points from both players)
     */
    async startGameSession(sessionId, userId) {
        const session = await models_1.GameSession.findById(sessionId)
            .populate('game')
            .populate('players.user', 'firstName lastName profilePhoto gamification');
        if (!session)
            throw new Error('Game session not found');
        const game = session.game;
        // Verify user is in the session
        const isPlayer = session.players.some(p => {
            const userObj = p.user;
            const playerId = userObj._id ? userObj._id.toString() : userObj.toString();
            return playerId === userId;
        });
        if (!isPlayer)
            throw new Error('You are not part of this game session');
        if (session.status !== 'waiting')
            throw new Error('Game cannot be started');
        if (session.players.length < game.minPlayers) {
            throw new Error(`Minimum ${game.minPlayers} players required`);
        }
        // Deduct points from all players
        const pointsCost = session.pointsCost || game.pointsCost;
        for (const player of session.players) {
            const playerObj = player.user;
            const playerId = playerObj._id ? playerObj._id.toString() : playerObj.toString();
            try {
                await points_service_1.default.deductPoints({
                    userId: playerId,
                    amount: pointsCost,
                    type: 'game_entry',
                    reason: `Game entry: ${game.name}`,
                    metadata: {
                        gameId: game._id,
                        gameName: game.name,
                        sessionId: session._id,
                    },
                });
                logger_1.default.info(`Deducted ${pointsCost} points from player ${playerId} for game ${game.name}`);
            }
            catch (error) {
                // Refund points to players who already paid
                for (const paidPlayer of session.players) {
                    const paidPlayerObj = paidPlayer.user;
                    const paidPlayerId = paidPlayerObj._id ? paidPlayerObj._id.toString() : paidPlayerObj.toString();
                    if (paidPlayerId === playerId)
                        break;
                    await points_service_1.default.addPoints({
                        userId: paidPlayerId,
                        amount: pointsCost,
                        type: 'refund',
                        reason: `Game cancelled: ${game.name}`,
                        metadata: {
                            gameId: game._id,
                            sessionId: session._id,
                        },
                    });
                }
                throw new Error(`Player has insufficient points to start game`);
            }
        }
        session.status = 'active';
        session.startedAt = new Date();
        await session.save();
        // Emit game started event
        (0, socket_config_1.emitGameStarted)(sessionId, {
            sessionId,
            game: session.game,
            players: session.players,
            gameData: session.gameData,
            startedAt: session.startedAt,
        });
        // Increment game play count
        await models_1.Game.findByIdAndUpdate(game._id, { $inc: { playCount: 1 } });
        logger_1.default.info(`Game session started: ${sessionId}`);
        return session;
    }
    /**
     * Submit game answer (for trivia-type games)
     */
    async submitAnswer(sessionId, userId, questionIndex, answer, timeSpent) {
        const session = await models_1.GameSession.findById(sessionId).populate('game');
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
        logger_1.default.info(`Submit answer - Session: ${sessionId}, questionIndex: ${questionIndex}`);
        const question = session.gameData?.questions?.[questionIndex];
        if (!question) {
            logger_1.default.error(`Question not found - questionIndex: ${questionIndex}`);
            throw new Error('Question not found');
        }
        const correct = answer === question.correctAnswer;
        // Calculate points based on correctness and time
        let points = 0;
        if (correct) {
            const timeBonus = Math.max(0, 100 - timeSpent);
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
        (0, socket_config_1.emitScoreUpdate)(sessionId, {
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
    async submitAllAnswers(sessionId, userId, answers) {
        logger_1.default.info(`========== SUBMIT ALL ANSWERS ==========`);
        logger_1.default.info(`Session: ${sessionId}, User: ${userId}, Answers count: ${answers.length}`);
        const session = await models_1.GameSession.findById(sessionId).populate('game');
        if (!session) {
            logger_1.default.error(`Session not found: ${sessionId}`);
            throw new Error('Game session not found');
        }
        if (session.status !== 'active') {
            logger_1.default.error(`Game is not active, status: ${session.status}`);
            throw new Error('Game is not active');
        }
        const playerIndex = session.players.findIndex(p => {
            const odId = p.user._id ? p.user._id.toString() : p.user.toString();
            return odId === userId;
        });
        if (playerIndex === -1) {
            logger_1.default.error(`Player ${userId} not found in session`);
            throw new Error('You are not in this game');
        }
        const player = session.players[playerIndex];
        // Check if player already submitted
        if (player.completedAt) {
            logger_1.default.error(`Player ${userId} already submitted`);
            throw new Error('You have already submitted your answers');
        }
        let totalScore = 0;
        const results = [];
        const playerAnswers = [];
        // Calculate score for each answer
        for (const ans of answers) {
            const question = session.gameData?.questions?.[ans.questionIndex];
            if (!question)
                continue;
            const correct = ans.answer === question.correctAnswer;
            let points = 0;
            if (correct) {
                const timeBonus = Math.max(0, 100 - ans.timeSpent * 5);
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
        logger_1.default.info(`Player ${userId} score calculated: ${totalScore}, correct: ${results.filter(r => r.correct).length}`);
        // Emit score update to game room
        (0, socket_config_1.emitScoreUpdate)(sessionId, {
            sessionId,
            userId,
            score: totalScore,
            completedAt: player.completedAt,
            correctCount: results.filter(r => r.correct).length,
        });
        // Check if all players have completed
        const updatedSession = await models_1.GameSession.findById(sessionId);
        const allCompleted = updatedSession?.players.every(p => p.completedAt);
        logger_1.default.info(`All players completed: ${allCompleted}`);
        if (allCompleted) {
            logger_1.default.info(`All players completed! Finalizing game...`);
            await this.finalizeGameSession(sessionId);
        }
        logger_1.default.info(`========== END SUBMIT ALL ANSWERS ==========`);
        return {
            score: totalScore,
            correctCount: results.filter(r => r.correct).length,
            results,
        };
    }
    /**
     * Finalize game session (award points to winner)
     */
    async finalizeGameSession(sessionId) {
        logger_1.default.info(`========== FINALIZE GAME SESSION WITH POINTS ==========`);
        const session = await models_1.GameSession.findById(sessionId)
            .populate('game')
            .populate('players.user', 'firstName lastName profilePhoto');
        if (!session || session.status !== 'active')
            return;
        const game = session.game;
        // Calculate rankings
        const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);
        sortedPlayers.forEach((player, index) => {
            const playerUserId = player.user._id
                ? player.user._id.toString()
                : player.user.toString();
            const sessionPlayer = session.players.find(p => {
                const spUserId = p.user._id
                    ? p.user._id.toString()
                    : p.user.toString();
                return spUserId === playerUserId;
            });
            if (sessionPlayer) {
                sessionPlayer.rank = index + 1;
            }
        });
        // Determine winner and award points
        const winner = sortedPlayers[0];
        if (winner && winner.score > 0) {
            const winnerUserId = winner.user._id || winner.user;
            session.winner = winnerUserId;
            // Award winner points
            const pointsReward = game.pointsReward;
            if (pointsReward > 0) {
                const pointsResult = await points_service_1.default.addPoints({
                    userId: winnerUserId.toString(),
                    amount: pointsReward,
                    type: 'game_reward',
                    reason: `Won ${game.name}!`,
                    metadata: {
                        gameId: game._id,
                        gameName: game.name,
                        sessionId: session._id,
                        score: winner.score,
                        rank: 1,
                    },
                });
                winner.pointsEarned = pointsReward;
                session.pointsAwarded = pointsReward;
                logger_1.default.info(`Awarded ${pointsReward} points to winner. Level up: ${pointsResult.leveledUp}`);
            }
        }
        // Award consolation points to other players (50% of reward)
        const consolationPoints = Math.floor((game.pointsReward || 0) * 0.5);
        if (consolationPoints > 0) {
            for (let i = 1; i < sortedPlayers.length; i++) {
                const player = sortedPlayers[i];
                const playerId = player.user._id || player.user;
                await points_service_1.default.addPoints({
                    userId: playerId.toString(),
                    amount: consolationPoints,
                    type: 'game_reward',
                    reason: `Participated in ${game.name}`,
                    metadata: {
                        gameId: game._id,
                        gameName: game.name,
                        sessionId: session._id,
                        score: player.score,
                        rank: player.rank,
                    },
                });
                player.pointsEarned = consolationPoints;
            }
        }
        session.status = 'completed';
        session.endedAt = new Date();
        await session.save();
        // Update game invite message
        const winnerUser = winner ? await models_1.User.findById(winner.user._id || winner.user).select('firstName lastName') : null;
        await models_1.Message.updateMany({ 'gameData.sessionId': sessionId }, {
            'gameData.status': 'completed',
            'gameData.winnerId': winner ? (winner.user._id || winner.user) : undefined,
            'gameData.winnerName': winnerUser ? `${winnerUser.firstName} ${winnerUser.lastName}` : undefined,
        });
        // Emit game ended
        (0, socket_config_1.emitGameEnded)(sessionId, {
            sessionId,
            winner: winner ? {
                _id: winner.user._id || winner.user,
                firstName: winner.user.firstName,
                lastName: winner.user.lastName,
                score: winner.score,
                pointsEarned: winner.pointsEarned,
            } : null,
            players: session.players.map(p => ({
                user: p.user,
                score: p.score,
                rank: p.rank,
                pointsEarned: p.pointsEarned,
                correctCount: p.answers?.filter(a => a.correct).length || 0,
            })),
            endedAt: session.endedAt,
            pointsAwarded: session.pointsAwarded,
        });
        logger_1.default.info(`✅ Game session finalized with points awarded`);
    }
    /**
     * Complete game session
     */
    async completeGameSession(sessionId) {
        const session = await models_1.GameSession.findById(sessionId)
            .populate('game')
            .populate('players.user', 'firstName lastName profilePhoto')
            .populate('winner', 'firstName lastName profilePhoto');
        if (!session) {
            throw new Error('Game session not found');
        }
        return session;
    }
    /**
     * Get active game session for a match
     */
    async getActiveGameSession(matchId) {
        const session = await models_1.GameSession.findOne({
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
    async getGameSession(sessionId) {
        const session = await models_1.GameSession.findById(sessionId)
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
    async cancelInvitation(sessionId, userId) {
        const session = await models_1.GameSession.findById(sessionId);
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
        await models_1.Message.updateMany({ 'gameData.sessionId': sessionId }, { 'gameData.status': 'cancelled' });
        if (session.invitedUser) {
            (0, socket_config_1.emitGameInvitationResponse)(session.invitedUser.toString(), {
                sessionId,
                cancelled: true,
            });
        }
    }
    /**
     * Get user game history
     */
    async getUserGameHistory(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const sessions = await models_1.GameSession.find({
            'players.user': userId,
            status: 'completed',
        })
            .populate('game', 'name thumbnail category')
            .populate('players.user', 'firstName lastName profilePhoto')
            .populate('winner', 'firstName lastName profilePhoto')
            .sort({ endedAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await models_1.GameSession.countDocuments({
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
    async getGameLeaderboard(gameId, limit = 10) {
        const sessions = await models_1.GameSession.find({
            game: gameId,
            status: 'completed',
        })
            .populate('players.user', 'firstName lastName profilePhoto')
            .sort({ 'players.score': -1 })
            .limit(100);
        const userScores = new Map();
        sessions.forEach((session) => {
            session.players.forEach((player) => {
                const userObj = player.user;
                const odId = userObj._id ? userObj._id.toString() : userObj.toString();
                const existing = userScores.get(odId);
                if (existing) {
                    existing.totalScore += player.score;
                    existing.gamesPlayed += 1;
                    existing.wins += player.rank === 1 ? 1 : 0;
                }
                else {
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
    generateGameData(gameName) {
        switch (gameName) {
            case 'Trivia Master': {
                const allQuestions = [];
                const categories = Object.keys(triviaQuestions);
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
            default:
                return {};
        }
    }
    scrambleWord(word) {
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
    generateMathQuestion() {
        const operations = ['+', '-', '×'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        let num1, num2, answer;
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
        const wrongOptions = new Set();
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
exports.default = new GameService();
//# sourceMappingURL=game.service.js.map