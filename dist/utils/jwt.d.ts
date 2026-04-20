import { TokenPayload } from '../types';
/** Signs a short-lived access token. */
export declare const generateAccessToken: (payload: TokenPayload) => string;
/** Signs a long-lived refresh token used to rotate access tokens. */
export declare const generateRefreshToken: (payload: TokenPayload) => string;
/** Verifies and decodes an access token. Throws on invalid or expired tokens. */
export declare const verifyAccessToken: (token: string) => TokenPayload;
/** Verifies and decodes a refresh token. Throws on invalid or expired tokens. */
export declare const verifyRefreshToken: (token: string) => TokenPayload;
/** Generates a new access/refresh token pair for the given user. */
export declare const generateTokenPair: (userId: string, email: string) => {
    accessToken: string;
    refreshToken: string;
};
//# sourceMappingURL=jwt.d.ts.map