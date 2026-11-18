export interface User {
  id: string;
  googleSub: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface GoogleUserProfile {
  googleSub: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export function toUserProfile(user: User): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
  };
}
