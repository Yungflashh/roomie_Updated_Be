// src/config/social-auth.config.ts
export const socialAuthConfig = {
  facebook: {
    clientID: process.env.FACEBOOK_APP_ID || '',
    clientSecret: process.env.FACEBOOK_APP_SECRET || '',
    callbackURL: `${process.env.API_URL}/api/v1/social/facebook/callback`,
    profileFields: ['id', 'displayName', 'photos', 'email', 'link'],
    scope: ['email', 'public_profile'],
  },
  instagram: {
    clientID: process.env.INSTAGRAM_CLIENT_ID || '',
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET || '',
    callbackURL: `${process.env.API_URL}/api/v1/social/instagram/callback`,
    scope: ['user_profile'],
  },
  twitter: {
    consumerKey: process.env.TWITTER_API_KEY || '',
    consumerSecret: process.env.TWITTER_API_SECRET || '',
    callbackURL: `${process.env.API_URL}/api/v1/social/twitter/callback`,
  },
  linkedin: {
    clientID: process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
    callbackURL: `${process.env.API_URL}/api/v1/social/linkedin/callback`,
    scope: ['r_emailaddress', 'r_liteprofile'],
  },
};

// Deep link URL for mobile app
export const getMobileRedirectUrl = (platform: string, status: 'success' | 'error', data?: any) => {
  const appScheme = process.env.APP_SCHEME || 'roomie';
  const params = new URLSearchParams({
    platform,
    status,
    ...(data && { data: JSON.stringify(data) }),
  });
  return `${appScheme}://social-callback?${params.toString()}`;
};