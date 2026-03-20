// src/models/User.ts - COMPLETE FILE WITH POINTS USERNAME
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ISocialLink {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok';
  username: string;
  url: string;
  connected: boolean;
  connectedAt?: Date;
  profileId?: string;
  accessToken?: string;
  refreshToken?: string;
  profilePhoto?: string;
}

export interface IUserDocument extends Document {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  phoneNumber?: string;
  profilePhoto?: string;
  photos: string[];
  bio?: string;
  occupation?: string;
  zodiacSign?: 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';
  personalityType?: 'intj' | 'intp' | 'entj' | 'entp' | 'infj' | 'infp' | 'enfj' | 'enfp' | 'istj' | 'isfj' | 'estj' | 'esfj' | 'istp' | 'isfp' | 'estp' | 'esfp';
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;

  // Points username - NEW FIELD
  pointsUsername?: string;
  
  location: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  preferences: {
    budget: {
      min: number;
      max: number;
      currency: string;
    };
    moveInDate?: Date;
    leaseDuration?: number;
    roomType: 'private' | 'shared' | 'any';
    gender?: 'male' | 'female' | 'any';
    ageRange?: {
      min: number;
      max: number;
    };
    petFriendly?: boolean;
    smoking?: boolean;
  };
  lifestyle: {
    sleepSchedule?: 'early-bird' | 'night-owl' | 'flexible';
    cleanliness?: 1 | 2 | 3 | 4 | 5;
    socialLevel?: 1 | 2 | 3 | 4 | 5;
    guestFrequency?: 'never' | 'rarely' | 'sometimes' | 'often';
    workFromHome?: boolean;
  };
  interests: string[];
  languages: string[];
  socialLinks: ISocialLink[];
  verified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  provider: 'email' | 'google' | 'apple';
  providerId?: string;
  fcmToken?: string;
  refreshToken?: string;
  emailVerificationCode?: string;
  emailVerificationExpires?: Date;
  passwordResetCode?: string;
  passwordResetExpires?: Date;
  subscription: {
    plan: 'free' | 'premium' | 'pro';
    startDate?: Date;
    endDate?: Date;
    autoRenew: boolean;
  };
  gamification: {
    points: number;
    level: number;
    badges: string[];
    achievements: string[];
    streak: number;
    lastActiveDate?: Date;
  };
  likes: string[];
  passes: string[];
  blockedUsers: string[];
  reportedBy: string[];
  lastRewind?: mongoose.Types.ObjectId;
  metadata?: {
    dailySwipeCount?: number;
    lastSwipeDate?: string;
    lastBoostAt?: Date;
    profileVisitors?: Array<{ userId: mongoose.Types.ObjectId; visitedAt: Date }>;
    monthlyInquiryCount?: number;
    lastInquiryMonth?: string;
    lastSwipeAction?: 'like' | 'pass' | null;
    lastSwipedUserId?: string | null;
    verificationRequested?: boolean;
    verificationRequestedAt?: Date;
    verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
    verificationRejectionReason?: string;
    kycDocuments?: {
      documentType?: string;
      idFrontPhoto?: string;
      idBackPhoto?: string;
      selfiePhoto?: string;
      submittedAt?: Date;
    };
  };
  isActive: boolean;
  lastSeen?: Date;
  notificationSettings: {
    pushEnabled: boolean;
    messages: boolean;
    matches: boolean;
    gameInvitations: boolean;
    dailyBonus: boolean;
    roommateActivity: boolean;
    inAppNotifications: boolean;
    inAppSound: boolean;
    inAppVibration: boolean;
  };
  privacySettings: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    profileVisibility: 'everyone' | 'matches_only';
    readReceipts: boolean;
    shareLocationWithRoommates: boolean;
  };

  // Virtual fields
  isProfileComplete: boolean;
  profileCompletionPercentage: number;
  missingProfileFields: string[];
  age?: number;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getProfileCompletion(): { isComplete: boolean; percentage: number; missingFields: string[]; completedFields: string[] };
}

// Update the SocialLinkSchema
const SocialLinkSchema = new Schema({
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok'],
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  connected: {
    type: Boolean,
    default: true,
  },
  connectedAt: {
    type: Date,
    default: Date.now,
  },
  profileId: String,
  accessToken: {
    type: String,
    select: false,
  },
  refreshToken: {
    type: String,
    select: false,
  },
  profilePhoto: String,
}, { _id: false });

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: false,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    phoneNumber: String,
    profilePhoto: String,
    photos: {
      type: [String],
      default: [],
    },
    bio: String,
    occupation: String,
    zodiacSign: {
      type: String,
      enum: ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'],
    },
    personalityType: {
      type: String,
      enum: ['intj', 'intp', 'entj', 'entp', 'infj', 'infp', 'enfj', 'enfp', 'istj', 'isfj', 'estj', 'esfj', 'istp', 'isfp', 'estp', 'esfp'],
    },
    emergencyContacts: [{
      name: { type: String, required: true },
      phone: { type: String, required: true },
      relationship: { type: String, required: true },
    }],

    // Points username - NEW FIELD
    pointsUsername: {
      type: String,
      unique: true,
      sparse: true, // Allow null but enforce uniqueness when set
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/, // Only lowercase, numbers, underscores
      index: true,
    },
    
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: String,
      city: String,
      state: String,
      country: String,
    },
    preferences: {
      budget: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 100000 },
        currency: { type: String, default: 'NGN' },
      },
      moveInDate: Date,
      leaseDuration: Number,
      roomType: {
        type: String,
        enum: ['private', 'shared', 'any'],
        default: 'any',
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'any'],
      },
      ageRange: {
        min: Number,
        max: Number,
      },
      petFriendly: Boolean,
      smoking: Boolean,
    },
    lifestyle: {
      sleepSchedule: {
        type: String,
        enum: ['early-bird', 'night-owl', 'flexible'],
      },
      cleanliness: {
        type: Number,
        min: 1,
        max: 5,
      },
      socialLevel: {
        type: Number,
        min: 1,
        max: 5,
      },
      guestFrequency: {
        type: String,
        enum: ['never', 'rarely', 'sometimes', 'often'],
      },
      workFromHome: Boolean,
    },
    interests: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    socialLinks: {
      type: [SocialLinkSchema],
      default: [],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    idVerified: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      enum: ['email', 'google', 'apple'],
      default: 'email',
    },
    providerId: String,
    fcmToken: String,
    refreshToken: {
      type: String,
      select: false,
    },
    emailVerificationCode: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetCode: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'premium', 'pro'],
        default: 'free',
      },
      startDate: Date,
      endDate: Date,
      autoRenew: {
        type: Boolean,
        default: false,
      },
    },
    gamification: {
      points: {
        type: Number,
        default: 0,
      },
      level: {
        type: Number,
        default: 1,
      },
      badges: {
        type: [String],
        default: [],
      },
      achievements: {
        type: [String],
        default: [],
      },
      streak: {
        type: Number,
        default: 0,
      },
      lastActiveDate: Date,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    passes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    blockedUsers: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    reportedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    lastRewind: { type: Schema.Types.ObjectId, ref: 'User' },
    metadata: {
      dailySwipeCount: { type: Number, default: 0 },
      lastSwipeDate: String,
      lastBoostAt: Date,
      profileVisitors: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        visitedAt: { type: Date, default: Date.now },
      }],
      monthlyInquiryCount: { type: Number, default: 0 },
      lastInquiryMonth: String,
      lastSwipeAction: { type: String, enum: ['like', 'pass', null], default: null },
      lastSwipedUserId: { type: String, default: null },
      verificationRequested: { type: Boolean, default: false },
      verificationRequestedAt: Date,
      verificationStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
      verificationRejectionReason: String,
      kycDocuments: {
        documentType: String,
        idFrontPhoto: String,
        idBackPhoto: String,
        selfiePhoto: String,
        submittedAt: Date,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: Date,
    notificationSettings: {
      pushEnabled: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      matches: { type: Boolean, default: true },
      gameInvitations: { type: Boolean, default: true },
      dailyBonus: { type: Boolean, default: true },
      roommateActivity: { type: Boolean, default: true },
      inAppNotifications: { type: Boolean, default: true },
      inAppSound: { type: Boolean, default: true },
      inAppVibration: { type: Boolean, default: true },
    },
    privacySettings: {
      showOnlineStatus: { type: Boolean, default: true },
      showLastSeen: { type: Boolean, default: true },
      profileVisibility: { type: String, enum: ['everyone', 'matches_only'], default: 'everyone' },
      readReceipts: { type: Boolean, default: true },
      shareLocationWithRoommates: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        if (ret.password) delete ret.password;
        if (ret.refreshToken) delete ret.refreshToken;
        if (ret.__v) delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// =====================
// HELPER FUNCTION - Use 'any' to avoid TypeScript issues with Mongoose 'this' context
// =====================

interface ProfileField {
  name: string;
  label: string;
  weight: number;
  check: (user: any) => boolean;
  required: boolean;
}

interface ProfileCompletionResult {
  isComplete: boolean;
  percentage: number;
  missingFields: string[];
  completedFields: string[];
}

function calculateProfileCompletion(user: any): ProfileCompletionResult {
  const fields: ProfileField[] = [
    // Required fields
    {
      name: 'firstName',
      label: 'First Name',
      weight: 10,
      check: (u) => !!u.firstName && u.firstName.trim().length > 0,
      required: true,
    },
    {
      name: 'lastName',
      label: 'Last Name',
      weight: 10,
      check: (u) => !!u.lastName && u.lastName.trim().length > 0,
      required: true,
    },
    {
      name: 'profilePhoto',
      label: 'Profile Photo',
      weight: 15,
      check: (u) => !!u.profilePhoto && u.profilePhoto.length > 0,
      required: true,
    },
    {
      name: 'dateOfBirth',
      label: 'Date of Birth',
      weight: 10,
      check: (u) => !!u.dateOfBirth,
      required: true,
    },
    {
      name: 'gender',
      label: 'Gender',
      weight: 5,
      check: (u) => !!u.gender,
      required: true,
    },
    {
      name: 'location',
      label: 'Location',
      weight: 10,
      check: (u) => !!(u.location?.city && u.location?.state),
      required: true,
    },
    {
      name: 'budget',
      label: 'Budget',
      weight: 10,
      check: (u) => !!(u.preferences?.budget?.min !== undefined && u.preferences?.budget?.max > 0),
      required: true,
    },
    // Optional fields
    {
      name: 'bio',
      label: 'Bio',
      weight: 5,
      check: (u) => !!u.bio && u.bio.trim().length >= 10,
      required: false,
    },
    {
      name: 'occupation',
      label: 'Occupation',
      weight: 5,
      check: (u) => !!u.occupation && u.occupation.trim().length > 0,
      required: false,
    },
    {
      name: 'interests',
      label: 'Interests',
      weight: 5,
      check: (u) => u.interests && u.interests.length >= 3,
      required: false,
    },
    {
      name: 'lifestyle',
      label: 'Lifestyle Preferences',
      weight: 5,
      check: (u) => !!(u.lifestyle?.sleepSchedule && u.lifestyle?.cleanliness && u.lifestyle?.guestFrequency),
      required: false,
    },
    {
      name: 'photos',
      label: 'Additional Photos',
      weight: 5,
      check: (u) => u.photos && u.photos.length >= 2,
      required: false,
    },
    {
      name: 'phoneNumber',
      label: 'Phone Number',
      weight: 5,
      check: (u) => !!u.phoneNumber && u.phoneNumber.length >= 10,
      required: false,
    },
  ];

  let totalWeight = 0;
  let completedWeight = 0;
  const missingFields: string[] = [];
  const completedFields: string[] = [];
  let allRequiredComplete = true;

  for (const field of fields) {
    totalWeight += field.weight;
    
    if (field.check(user)) {
      completedWeight += field.weight;
      completedFields.push(field.name);
    } else {
      missingFields.push(field.label);
      if (field.required) {
        allRequiredComplete = false;
      }
    }
  }

  const percentage = Math.round((completedWeight / totalWeight) * 100);
  const isComplete = allRequiredComplete && percentage >= 70;

  return {
    isComplete,
    percentage,
    missingFields,
    completedFields,
  };
}

// =====================
// VIRTUAL FIELDS
// =====================

// Calculate age from dateOfBirth
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return undefined;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Profile completion check
userSchema.virtual('isProfileComplete').get(function() {
  const completion = calculateProfileCompletion(this);
  return completion.isComplete;
});

// Profile completion percentage
userSchema.virtual('profileCompletionPercentage').get(function() {
  const completion = calculateProfileCompletion(this);
  return completion.percentage;
});

// Missing profile fields
userSchema.virtual('missingProfileFields').get(function() {
  const completion = calculateProfileCompletion(this);
  return completion.missingFields;
});

// =====================
// METHODS
// =====================

// Get profile completion details (callable method)
userSchema.methods.getProfileCompletion = function(): ProfileCompletionResult {
  return calculateProfileCompletion(this);
};

// Compare password method
userSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// =====================
// INDEXES
// =====================

userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ pointsUsername: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ createdAt: -1 });

// Discovery query indexes
userSchema.index({ isActive: 1, gender: 1, verified: 1 });
userSchema.index({ isActive: 1, 'location.city': 1, createdAt: -1 });
userSchema.index({ gender: 1 });
userSchema.index({ dateOfBirth: 1 });
userSchema.index({ 'location.city': 1 });
userSchema.index({ 'location.state': 1 });
userSchema.index({ verified: 1 });
userSchema.index({ interests: 1 });
userSchema.index({ 'preferences.roomType': 1 });
userSchema.index({ 'lifestyle.sleepSchedule': 1 });
userSchema.index({ 'lifestyle.cleanliness': 1 });
userSchema.index({ blockedUsers: 1 });

// =====================
// MIDDLEWARE
// =====================

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

export const User = mongoose.model<IUserDocument>('User', userSchema);