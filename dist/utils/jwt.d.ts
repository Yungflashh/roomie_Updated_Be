import { TokenPayload } from '../types';
export declare const generateAccessToken: (payload: TokenPayload) => string;
export declare const generateRefreshToken: (payload: TokenPayload) => string;
export declare const verifyAccessToken: (token: string) => TokenPayload;
export declare const verifyRefreshToken: (token: string) => TokenPayload;
export declare const generateTokenPair: (userId: string, email: string) => {
    accessToken: string;
    refreshToken: string;
};
//# sourceMappingURL=jwt.d.ts.map