export type SocialProvider = "LinkedIn" | "Facebook";

export type AuthProvider = "email" | SocialProvider;

export type MockUser = {
  id: string;
  name: string;
  email: string;
  provider: AuthProvider;
  connectedProviders: SocialProvider[];
};

export type AuthResult =
  | { ok: true; user: MockUser }
  | { ok: false; error: string };

export const demoCredentials = {
  email: "demo@friendroot.local",
  password: "friend-root"
};

const baseUser = {
  id: "user:demo",
  name: "Demo User",
  email: demoCredentials.email
};

export function authenticateMockUser(input: {
  email: string;
  password: string;
}): AuthResult {
  if (
    input.email.trim().toLowerCase() !== demoCredentials.email ||
    input.password !== demoCredentials.password
  ) {
    return { ok: false, error: "デモアカウントが見つかりません。" };
  }

  return {
    ok: true,
    user: {
      ...baseUser,
      provider: "email",
      connectedProviders: ["LinkedIn", "Facebook"]
    }
  };
}

export function signInWithMockProvider(provider: SocialProvider): MockUser {
  return {
    ...baseUser,
    provider,
    connectedProviders: [provider]
  };
}

export function connectSocialProvider(
  user: MockUser,
  provider: SocialProvider
): MockUser {
  if (user.connectedProviders.includes(provider)) {
    return user;
  }

  return {
    ...user,
    connectedProviders: [...user.connectedProviders, provider]
  };
}
