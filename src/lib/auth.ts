export type LoginProvider = "demo" | "linkedin" | "facebook";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  title: string;
};

export type SocialConnections = {
  linkedin: boolean;
  facebook: boolean;
};

export type MockSession = {
  user: MockUser;
  connectedPlatforms: SocialConnections;
};

export const demoCredentials = {
  email: "demo@friend-root.local",
  password: "friendroot"
};

export function loginWithMockCredentials(
  email: string,
  password: string
): MockSession | null {
  if (
    email.trim().toLowerCase() !== demoCredentials.email ||
    password !== demoCredentials.password
  ) {
    return null;
  }

  return createMockSession("demo");
}

export function createMockSession(provider: LoginProvider): MockSession {
  return {
    user: {
      id: "rena_asakura",
      name: "朝倉 玲奈",
      email: demoCredentials.email,
      title: "Product Manager / Northstar Labs"
    },
    connectedPlatforms: {
      linkedin: provider === "demo" || provider === "linkedin",
      facebook: provider === "demo" || provider === "facebook"
    }
  };
}
