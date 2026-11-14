export type PlanId = 'free' | '15d' | '1m' | '1y';

export interface SubscriptionPlan {
  id: Exclude<PlanId, 'free'>;
  name: string;
  audienceLabel: string;
  priceUsd: number;
  billingCycleLabel: string;
  durationDays: number;
  maxResolution: string;
  savingsNote?: string;
  badgeLabel?: string;
  features: string[];
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  planId: PlanId;
  planActivatedAt: number | null;
  planExpiresAt: number | null;
  createdAt: number;
}

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface SavedStudioItem {
  id: string;
  tool: 'text-to-video' | 'voice-to-video' | 'photo-editing' | 'video-editing';
  title: string;
  format: 'webm' | 'png';
  createdAt: number;
  durationSec?: number;
  previewDataUrl?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: '15d',
    name: '15 Days Pass',
    audienceLabel: 'For short-term sprints',
    priceUsd: 3,
    billingCycleLabel: '15 days',
    durationDays: 15,
    maxResolution: '1080p HD',
    features: [
      'Full Text to Video & Voice to Video tools',
      'Full Photo & Video Editor access',
      '1080p WebM & PNG local browser export',
      'Zero external API keys required',
    ],
  },
  {
    id: '1m',
    name: '1 Month Plan',
    audienceLabel: 'For active creators',
    priceUsd: 5,
    billingCycleLabel: 'month',
    durationDays: 30,
    maxResolution: '1080p HD',
    badgeLabel: 'Most Popular',
    features: [
      'All 4 zero-API creative studio modules',
      '1080p WebM video & lossless PNG exports',
      'Built-in ambient audio & voice synthesizer',
      'Unlimited local project library saves',
    ],
  },
  {
    id: '1y',
    name: '1 Year Plan',
    audienceLabel: 'For studio teams & power users',
    priceUsd: 50,
    billingCycleLabel: 'year',
    durationDays: 365,
    maxResolution: '4K Ultra HD',
    savingsNote: 'Save $10/yr vs monthly',
    badgeLabel: 'Best Value',
    features: [
      'Everything in 1 Month Plan for 365 days',
      '4K canvas rendering & color grading presets',
      'Multi-scene kinetic typography exports',
      'Full commercial local export rights',
    ],
  },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function hashPasswordLocal(password: string): string {
  // Deterministic non-reversible lightweight digest for local-only storage
  let h1 = 0xdeadbeef ^ password.length;
  let h2 = 0x41c6ce57 ^ password.length;
  for (let i = 0; i < password.length; i++) {
    const ch = password.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `loc_${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`;
}

export function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters.' };
  }
  return { valid: true };
}

export function validateRegistration(input: RegistrationInput): ValidationResult {
  if (!input.name.trim() || input.name.trim().length < 2) {
    return { valid: false, error: 'Please enter your full name (at least 2 characters).' };
  }
  if (!validateEmail(input.email)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  const pwCheck = validatePassword(input.password);
  if (!pwCheck.valid) {
    return pwCheck;
  }
  if (input.password !== input.confirmPassword) {
    return { valid: false, error: 'Passwords do not match.' };
  }
  return { valid: true };
}

export function getPlanById(planId: PlanId): SubscriptionPlan | null {
  if (planId === 'free') return null;
  return SUBSCRIPTION_PLANS.find((p) => p.id === planId) ?? null;
}

export function calculatePlanExpiry(planId: Exclude<PlanId, 'free'>, startTimestamp: number): number {
  const plan = getPlanById(planId);
  if (!plan) {
    throw new Error(`Unknown plan ID: ${planId}`);
  }
  return startTimestamp + plan.durationDays * MS_PER_DAY;
}

export function getRemainingDays(expiresAt: number | null, now = Date.now()): number {
  if (!expiresAt || expiresAt <= now) return 0;
  return Math.ceil((expiresAt - now) / MS_PER_DAY);
}

export function isSubscriptionActive(user: UserAccount | null, now = Date.now()): boolean {
  if (!user || user.planId === 'free' || !user.planExpiresAt) return false;
  return user.planExpiresAt > now;
}

export function registerUser(
  users: UserAccount[],
  input: RegistrationInput,
  now = Date.now()
): { ok: true; user: UserAccount; users: UserAccount[] } | { ok: false; error: string } {
  const validation = validateRegistration(input);
  if (!validation.valid) {
    return { ok: false, error: validation.error ?? 'Invalid registration details.' };
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
  if (exists) {
    return { ok: false, error: 'An account with this email already exists. Please sign in.' };
  }

  const newUser: UserAccount = {
    id: `usr_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: hashPasswordLocal(input.password),
    planId: 'free',
    planActivatedAt: null,
    planExpiresAt: null,
    createdAt: now,
  };

  return {
    ok: true,
    user: newUser,
    users: [...users, newUser],
  };
}

export function authenticateUser(
  users: UserAccount[],
  email: string,
  password: string
): { ok: true; user: UserAccount } | { ok: false; error: string } {
  const normalizedEmail = email.trim().toLowerCase();
  if (!validateEmail(normalizedEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (!password) {
    return { ok: false, error: 'Please enter your password.' };
  }
  const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!found || found.passwordHash !== hashPasswordLocal(password)) {
    return { ok: false, error: 'Invalid email or password.' };
  }
  return { ok: true, user: found };
}

export function applySubscription(
  users: UserAccount[],
  userId: string,
  planId: Exclude<PlanId, 'free'>,
  now = Date.now()
): { ok: true; user: UserAccount; users: UserAccount[] } | { ok: false; error: string } {
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    return { ok: false, error: 'Account not found.' };
  }
  const expiresAt = calculatePlanExpiry(planId, now);
  const updatedUser: UserAccount = {
    ...users[index],
    planId,
    planActivatedAt: now,
    planExpiresAt: expiresAt,
  };
  const updatedUsers = [...users];
  updatedUsers[index] = updatedUser;
  return { ok: true, user: updatedUser, users: updatedUsers };
}

export function createSeedUsers(now = Date.now()): UserAccount[] {
  return [
    {
      id: 'usr_demo_creator',
      name: 'Demo Creator',
      email: 'demo@akool.studio',
      passwordHash: hashPasswordLocal('demo1234'),
      planId: 'free',
      planActivatedAt: null,
      planExpiresAt: null,
      createdAt: now,
    },
  ];
}

export type PaymentMethod = 'upi' | 'netbanking' | 'card';

export type PaymentInput =
  | { method: 'upi'; upiId: string }
  | { method: 'netbanking'; bankName: string; accountHolder: string }
  | { method: 'card'; cardName: string; cardNumber: string; expiry: string; cvc: string };

export function validateUpiId(upiId: string): boolean {
  return /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim());
}

export function validatePaymentInput(input: PaymentInput): ValidationResult {
  if (input.method === 'upi') {
    if (!validateUpiId(input.upiId)) {
      return { valid: false, error: 'Enter a valid UPI ID (e.g. yourname@okaxis).' };
    }
    return { valid: true };
  }

  if (input.method === 'netbanking') {
    if (!input.bankName.trim()) {
      return { valid: false, error: 'Select your bank for Net Banking.' };
    }
    if (input.accountHolder.trim().length < 2) {
      return { valid: false, error: 'Enter the bank account holder name.' };
    }
    return { valid: true };
  }

  const digitsOnly = input.cardNumber.replace(/\s+/g, '');
  if (input.cardName.trim().length < 2) {
    return { valid: false, error: 'Enter the cardholder name.' };
  }
  if (digitsOnly.length < 12) {
    return { valid: false, error: 'Enter a valid card number (at least 12 digits).' };
  }
  if (!/^\d{2}\/\d{2}$/.test(input.expiry.trim())) {
    return { valid: false, error: 'Enter expiry in MM/YY format.' };
  }
  if (input.cvc.trim().length < 3) {
    return { valid: false, error: 'Enter a 3-digit CVC.' };
  }
  return { valid: true };
}

