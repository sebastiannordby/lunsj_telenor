import { getUser, openDb } from '@/lib/database/database';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

type CredentialType = {
  username: string;
  password: string;
};

const testProvider2 = Credentials({
  name: "Credentials",
  credentials: {
    username: { label: "Brukernavn", type: "text", placeholder: "jsmith" },
    password: { label: "Passord", type: "password" }
  },
  async authorize(credentials: Partial<Record<"username" | "password", unknown>>, req) {
    const username = credentials?.username as string;
    const password = credentials?.password as string;
    const user = await getUser(username, password);

    return {...user, name: user?.username} ?? null;
  }
});

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    testProvider2
  ]
});