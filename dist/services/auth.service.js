"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const axios_1 = __importDefault(require("axios"));
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const logger_1 = __importDefault(require("../utils/logger"));
const points_service_1 = __importDefault(require("./points.service"));
const email_service_1 = __importDefault(require("./email.service"));
class AuthService {
    formatUserResponse(user) {
        const profileCompletion = user.getProfileCompletion();
        return {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePhoto: user.profilePhoto,
            photos: user.photos,
            bio: user.bio,
            occupation: user.occupation,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            phoneNumber: user.phoneNumber,
            location: user.location,
            preferences: user.preferences,
            lifestyle: user.lifestyle,
            interests: user.interests,
            languages: user.languages,
            socialLinks: user.socialLinks,
            verified: user.verified,
            emailVerified: user.emailVerified,
            subscription: user.subscription,
            gamification: user.gamification,
            equippedCosmetics: user.equippedCosmetics,
            isProfileComplete: profileCompletion.isComplete,
            profileCompletionPercentage: profileCompletion.percentage,
            missingProfileFields: profileCompletion.missingFields,
            age: user.age,
            metadata: {
                verificationStatus: user.metadata?.verificationStatus || 'none',
                verificationRejectionReason: user.metadata?.verificationRejectionReason,
                verificationRequested: user.metadata?.verificationRequested,
            },
        };
    }
    /**
     * Creates a new user account, awards the signup bonus, and sends a
     * verification email in the background.
     */
    async register(data) {
        const { email, password, firstName, lastName, dateOfBirth, gender } = data;
        const existingUser = await models_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        const user = await models_1.User.create({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            dateOfBirth,
            gender,
            provider: 'email',
            gamification: {
                points: 0,
                level: 1,
                badges: ['newcomer'],
                achievements: [],
                streak: 0,
                lastActiveDate: new Date(),
            },
        });
        try {
            await points_service_1.default.addPoints({
                userId: user._id.toString(),
                amount: 100,
                type: 'bonus',
                reason: 'Welcome bonus for signing up',
                metadata: { source: 'registration' },
            });
        }
        catch (error) {
            logger_1.default.error('Error awarding signup bonus:', error);
        }
        const { accessToken, refreshToken } = (0, jwt_1.generateTokenPair)(user._id.toString(), user.email);
        user.refreshToken = refreshToken;
        user.lastSeen = new Date();
        await user.save();
        try {
            const code = this.generateOTP();
            user.emailVerificationCode = code;
            user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
            await user.save();
            email_service_1.default.sendVerificationCode(email, firstName, code).catch(err => {
                logger_1.default.error('Failed to send verification email:', err);
            });
        }
        catch (err) {
            logger_1.default.error('Failed to set verification code:', err);
        }
        logger_1.default.info(`New user registered: ${email}`);
        return {
            user: this.formatUserResponse(user),
            accessToken,
            refreshToken,
        };
    }
    /**
     * Authenticates a user by email/password and awards the daily login bonus
     * if it has not been claimed yet today.
     */
    async login(data) {
        const { email, password } = data;
        const user = await models_1.User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
        if (!user) {
            throw new Error('Invalid email or password');
        }
        if (!user.isActive) {
            throw new Error('Account has been deactivated');
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        let dailyReward = { awarded: false };
        try {
            const result = await points_service_1.default.awardDailyLoginBonus(user._id.toString());
            if (result.awarded) {
                // Re-fetch to get the updated streak written by pointsService
                const updatedUser = await models_1.User.findById(user._id);
                dailyReward = {
                    awarded: true,
                    points: result.amount,
                    streak: updatedUser?.gamification?.streak || 1,
                    newBalance: result.newBalance,
                };
            }
        }
        catch (error) {
            logger_1.default.error('Error awarding daily login bonus:', error);
        }
        const { accessToken, refreshToken } = (0, jwt_1.generateTokenPair)(user._id.toString(), user.email);
        // Use findOneAndUpdate to avoid a VersionError if pointsService already
        // incremented the document's __v during bonus processing.
        await models_1.User.findOneAndUpdate({ _id: user._id }, { $set: { refreshToken, lastSeen: new Date() } });
        const freshUser = await models_1.User.findById(user._id);
        if (!freshUser) {
            throw new Error('User not found');
        }
        logger_1.default.info(`User logged in: ${email}`);
        return {
            user: this.formatUserResponse(freshUser),
            accessToken,
            refreshToken,
            dailyReward,
        };
    }
    /**
     * Validates the supplied refresh token and issues a new token pair.
     */
    async refreshAccessToken(userId, refreshToken) {
        const user = await models_1.User.findById(userId).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            throw new Error('Invalid refresh token');
        }
        const tokens = (0, jwt_1.generateTokenPair)(user._id.toString(), user.email);
        user.refreshToken = tokens.refreshToken;
        await user.save();
        return tokens;
    }
    /** Clears the stored refresh token and updates `lastSeen`. */
    async logout(userId) {
        const user = await models_1.User.findById(userId);
        if (user) {
            user.refreshToken = undefined;
            user.lastSeen = new Date();
            await user.save();
        }
    }
    async getUserProfile(userId) {
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }
    async getUserProfileWithCompletion(userId) {
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return { user: this.formatUserResponse(user) };
    }
    async getProfileCompletion(userId) {
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user.getProfileCompletion();
    }
    async updateFcmToken(userId, fcmToken) {
        await models_1.User.findByIdAndUpdate(userId, { fcmToken });
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await models_1.User.findById(userId).select('+password');
        if (!user) {
            throw new Error('User not found');
        }
        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        user.password = newPassword;
        await user.save();
        logger_1.default.info(`Password changed for user: ${user.email}`);
    }
    /** Soft-deletes the account after verifying the user's password. */
    async deleteAccount(userId, password) {
        const user = await models_1.User.findById(userId).select('+password');
        if (!user) {
            throw new Error('User not found');
        }
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Password is incorrect');
        }
        user.isActive = false;
        await user.save();
        logger_1.default.info(`Account deleted for user: ${user.email}`);
    }
    async getUserStreak(userId) {
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return {
            currentStreak: user.gamification?.streak || 0,
            lastLoginDate: user.gamification?.lastActiveDate || user.lastSeen || null,
        };
    }
    generateOTP() {
        return crypto_1.default.randomInt(100000, 999999).toString();
    }
    async sendVerificationEmail(userId) {
        const user = await models_1.User.findById(userId).select('+emailVerificationCode +emailVerificationExpires');
        if (!user)
            throw new Error('User not found');
        if (user.emailVerified)
            throw new Error('Email already verified');
        const code = this.generateOTP();
        user.emailVerificationCode = code;
        user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        await email_service_1.default.sendVerificationCode(user.email, user.firstName, code);
        logger_1.default.info(`Verification email sent to: ${user.email}`);
    }
    async verifyEmail(userId, code) {
        const user = await models_1.User.findById(userId).select('+emailVerificationCode +emailVerificationExpires');
        if (!user)
            throw new Error('User not found');
        if (user.emailVerified)
            throw new Error('Email already verified');
        if (!user.emailVerificationCode ||
            !user.emailVerificationExpires ||
            user.emailVerificationCode !== code) {
            throw new Error('Invalid verification code');
        }
        if (user.emailVerificationExpires < new Date()) {
            throw new Error('Verification code has expired');
        }
        user.emailVerified = true;
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        logger_1.default.info(`Email verified for: ${user.email}`);
    }
    /**
     * Sends a 6-digit OTP to the given email address for password reset.
     * Returns silently if no account exists to prevent email enumeration.
     */
    async forgotPassword(email) {
        const user = await models_1.User.findOne({ email: email.toLowerCase() }).select('+passwordResetCode +passwordResetExpires');
        if (!user)
            return;
        const code = this.generateOTP();
        user.passwordResetCode = code;
        user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        await email_service_1.default.sendPasswordResetCode(user.email, user.firstName, code);
        logger_1.default.info(`Password reset code sent to: ${user.email}`);
    }
    /**
     * Validates the OTP and exchanges it for a short-lived reset token.
     * The reset token is stored in `passwordResetCode` to avoid adding a new field.
     */
    async verifyResetCode(email, code) {
        const user = await models_1.User.findOne({ email: email.toLowerCase() }).select('+passwordResetCode +passwordResetExpires');
        if (!user)
            throw new Error('Invalid reset code');
        if (!user.passwordResetCode ||
            !user.passwordResetExpires ||
            user.passwordResetCode !== code) {
            throw new Error('Invalid reset code');
        }
        if (user.passwordResetExpires < new Date()) {
            throw new Error('Reset code has expired');
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        user.passwordResetCode = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        return resetToken;
    }
    async resetPassword(email, resetToken, newPassword) {
        const user = await models_1.User.findOne({ email: email.toLowerCase() }).select('+passwordResetCode +passwordResetExpires +password');
        if (!user)
            throw new Error('Invalid request');
        if (!user.passwordResetCode ||
            !user.passwordResetExpires ||
            user.passwordResetCode !== resetToken) {
            throw new Error('Invalid or expired reset token');
        }
        if (user.passwordResetExpires < new Date()) {
            throw new Error('Reset token has expired');
        }
        user.password = newPassword;
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        await email_service_1.default.sendPasswordResetSuccess(user.email, user.firstName);
        logger_1.default.info(`Password reset for: ${user.email}`);
    }
    /**
     * Signs in or registers a user via Google id_token.
     * Looks up by provider ID first, then falls back to email to handle accounts
     * that were created with email/password before OAuth was available.
     */
    async loginWithGoogle(idToken) {
        const googleUser = await this.verifyGoogleToken(idToken);
        let user = await models_1.User.findOne({
            $or: [
                { provider: 'google', providerId: googleUser.sub },
                { email: googleUser.email.toLowerCase() },
            ],
        });
        if (!user) {
            user = await models_1.User.create({
                email: googleUser.email.toLowerCase(),
                firstName: googleUser.given_name || googleUser.name?.split(' ')[0] || 'User',
                lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
                profilePhoto: googleUser.picture || undefined,
                provider: 'google',
                providerId: googleUser.sub,
                emailVerified: true,
                gamification: {
                    points: 0,
                    level: 1,
                    badges: ['newcomer'],
                    achievements: [],
                    streak: 0,
                    lastActiveDate: new Date(),
                },
            });
            try {
                await points_service_1.default.addPoints({
                    userId: user._id.toString(),
                    amount: 100,
                    type: 'bonus',
                    reason: 'Welcome bonus for signing up',
                    metadata: { source: 'oauth_google' },
                });
            }
            catch (err) {
                logger_1.default.error('Error awarding Google signup bonus:', err);
            }
            logger_1.default.info(`New user registered via Google: ${user.email}`);
        }
        else {
            // Link Google provider to an existing email account on first OAuth sign-in
            if (user.provider === 'email' || !user.providerId) {
                await models_1.User.findByIdAndUpdate(user._id, {
                    provider: 'google',
                    providerId: googleUser.sub,
                    emailVerified: true,
                });
            }
        }
        const userId = user._id.toString();
        const userEmail = user.email;
        const { accessToken, refreshToken } = (0, jwt_1.generateTokenPair)(userId, userEmail);
        await models_1.User.findByIdAndUpdate(userId, { refreshToken, lastSeen: new Date() });
        const freshUser = await models_1.User.findById(userId);
        if (!freshUser)
            throw new Error('User not found after OAuth login');
        logger_1.default.info(`Google login: ${freshUser.email}`);
        return {
            user: this.formatUserResponse(freshUser),
            accessToken,
            refreshToken,
        };
    }
    /**
     * Signs in or registers a user via Apple identity token.
     * Uses the same provider-ID-first, email-fallback lookup as `loginWithGoogle`.
     */
    async loginWithApple(params) {
        const { identityToken, email: emailFromClient, firstName, lastName } = params;
        const applePayload = await this.verifyAppleToken(identityToken);
        const appleId = applePayload.sub;
        const emailFromToken = applePayload.email;
        const resolvedEmail = (emailFromClient || emailFromToken || '').toLowerCase();
        const conditions = [{ provider: 'apple', providerId: appleId }];
        if (resolvedEmail)
            conditions.push({ email: resolvedEmail });
        let user = await models_1.User.findOne({ $or: conditions });
        if (!user) {
            if (!resolvedEmail) {
                throw new Error('Email is required for first-time Apple sign-in');
            }
            user = await models_1.User.create({
                email: resolvedEmail,
                firstName: firstName || 'User',
                lastName: lastName || '',
                provider: 'apple',
                providerId: appleId,
                emailVerified: true,
                gamification: {
                    points: 0,
                    level: 1,
                    badges: ['newcomer'],
                    achievements: [],
                    streak: 0,
                    lastActiveDate: new Date(),
                },
            });
            try {
                await points_service_1.default.addPoints({
                    userId: user._id.toString(),
                    amount: 100,
                    type: 'bonus',
                    reason: 'Welcome bonus for signing up',
                    metadata: { source: 'oauth_apple' },
                });
            }
            catch (err) {
                logger_1.default.error('Error awarding Apple signup bonus:', err);
            }
            logger_1.default.info(`New user registered via Apple: ${user.email}`);
        }
        else {
            // Link Apple provider to an existing email account on first OAuth sign-in
            if (user.provider === 'email' || !user.providerId) {
                await models_1.User.findByIdAndUpdate(user._id, {
                    provider: 'apple',
                    providerId: appleId,
                    emailVerified: true,
                });
            }
        }
        const userId = user._id.toString();
        const userEmail = user.email;
        const { accessToken, refreshToken } = (0, jwt_1.generateTokenPair)(userId, userEmail);
        await models_1.User.findByIdAndUpdate(userId, { refreshToken, lastSeen: new Date() });
        const freshUser = await models_1.User.findById(userId);
        if (!freshUser)
            throw new Error('User not found after OAuth login');
        logger_1.default.info(`Apple login: ${freshUser.email}`);
        return {
            user: this.formatUserResponse(freshUser),
            accessToken,
            refreshToken,
        };
    }
    /**
     * Validates a Google id_token via Google's tokeninfo endpoint.
     * If any GOOGLE_*_CLIENT_ID env vars are set, the token audience is checked
     * against all of them to support both Android and iOS clients.
     */
    async verifyGoogleToken(idToken) {
        const { data } = await axios_1.default.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
        if (!data.sub) {
            throw new Error('Invalid Google token — missing sub');
        }
        const validAudiences = [
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_ANDROID_CLIENT_ID,
            process.env.GOOGLE_IOS_CLIENT_ID,
        ].filter(Boolean);
        if (validAudiences.length > 0 && !validAudiences.includes(data.aud)) {
            throw new Error('Google token audience mismatch');
        }
        if (!data.email) {
            throw new Error('Google token does not contain email');
        }
        return data;
    }
    /**
     * Validates an Apple identity token (RS256 JWT) by fetching Apple's public
     * JWKS and verifying the signature with Node's built-in `crypto` module —
     * no third-party JWT library required.
     */
    async verifyAppleToken(identityToken) {
        const [rawHeader] = identityToken.split('.');
        const header = JSON.parse(Buffer.from(rawHeader, 'base64').toString('utf8'));
        const { data } = await axios_1.default.get('https://appleid.apple.com/auth/keys');
        const jwk = data.keys.find((k) => k.kid === header.kid);
        if (!jwk) {
            throw new Error('Apple public key not found for kid: ' + header.kid);
        }
        const publicKey = crypto_1.default.createPublicKey({ key: jwk, format: 'jwk' });
        const pem = publicKey.export({ type: 'spki', format: 'pem' });
        const verifyOptions = {
            algorithms: ['RS256'],
            issuer: 'https://appleid.apple.com',
        };
        if (process.env.APPLE_CLIENT_ID) {
            verifyOptions.audience = process.env.APPLE_CLIENT_ID;
        }
        const payload = jsonwebtoken_1.default.verify(identityToken, pem, verifyOptions);
        if (!payload.sub) {
            throw new Error('Invalid Apple token — missing sub');
        }
        return { sub: payload.sub, email: payload.email };
    }
}
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map