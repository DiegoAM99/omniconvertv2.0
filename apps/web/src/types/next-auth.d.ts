import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
    accessToken?: string;
    refreshToken?: string;
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}
