import { SavedStudioItem, UserAccount, createSeedUsers } from './authSubscription';

const USERS_KEY = 'akool_local_users_v1';
const SESSION_USER_ID_KEY = 'akool_local_session_uid_v1';
const PROJECTS_KEY = 'akool_local_projects_v1';

export function loadStoredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      const seed = createSeedUsers();
      localStorage.setItem(USERS_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as UserAccount[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seed = createSeedUsers();
      localStorage.setItem(USERS_KEY, JSON.stringify(seed));
      return seed;
    }
    return parsed;
  } catch {
    return createSeedUsers();
  }
}

export function saveStoredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore quota errors
  }
}

export function loadSessionUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_USER_ID_KEY);
  } catch {
    return null;
  }
}

export function saveSessionUserId(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(SESSION_USER_ID_KEY, userId);
    } else {
      localStorage.removeItem(SESSION_USER_ID_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function loadSavedProjects(): SavedStudioItem[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedStudioItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveProjects(items: SavedStudioItem[]): void {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(items.slice(0, 18)));
  } catch {
    // ignore quota errors
  }
}
