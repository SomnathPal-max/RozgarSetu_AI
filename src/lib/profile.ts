import { type QualificationLevel } from '@/engine';

export interface UserProfile {
  name?: string;
  mobile?: string;
  dob?: string; // YYYY-MM-DD
  qualificationLevel?: QualificationLevel;
  qualificationStream?: string;
  category?: string; // SC | ST | OBC | GEN
  disability?: string;
  isAccount?: boolean;
}

const STORAGE_KEY = 'rozgarsetu_user_profile';

// Default mock-up demo profile (Age 24, Higher Secondary, category blank per Screen 4)
export const DEFAULT_DEMO_PROFILE: UserProfile = {
  name: 'Illustrative Candidate',
  dob: '2002-05-15',
  qualificationLevel: 'higher_secondary',
  qualificationStream: 'Arts',
  category: undefined,
  isAccount: false,
};

export function getSessionProfile(): UserProfile {
  if (typeof window === 'undefined') {
    return DEFAULT_DEMO_PROFILE;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DEMO_PROFILE;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_DEMO_PROFILE;
  }
}

export function saveSessionProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save session profile:', err);
  }
}

export function clearSessionProfile(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear session profile:', err);
  }
}
