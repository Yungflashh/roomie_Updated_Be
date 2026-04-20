export declare const socialAuthConfig: {
    facebook: {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
        profileFields: string[];
        scope: string[];
    };
    instagram: {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
        scope: string[];
    };
    twitter: {
        consumerKey: string;
        consumerSecret: string;
        callbackURL: string;
    };
    linkedin: {
        clientID: string;
        clientSecret: string;
        callbackURL: string;
        scope: string[];
    };
};
/**
 * Build the deep-link redirect URL used after a mobile OAuth callback.
 * The mobile app must register the scheme defined by APP_SCHEME (default: "roomie").
 */
export declare const getMobileRedirectUrl: (platform: string, status: "success" | "error", data?: any) => string;
//# sourceMappingURL=social-auth.config.d.ts.map