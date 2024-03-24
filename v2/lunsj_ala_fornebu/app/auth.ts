import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
// import { z } from 'zod';
// import { sql } from '@vercel/postgres';
// import bcrypt from 'bcrypt';
// import { User } from '../lib/definitions';
 
// async function getUser(email: string): Promise<User | undefined> {
//   try {
//     const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
//     return user.rows[0];
//   } catch (error) {
//     console.error('Failed to fetch user:', error);
//     throw new Error('Failed to fetch user.');
//   }
// }

// const test: any = {
//     authorize: async(credentials: any): Promise<User | null> => {
//         const parsedCredentials = z
//             .object({ email: z.string().email(), password: z.string().min(6) })
//             .safeParse(credentials);

//         if (parsedCredentials.success) {
//             const { email, password } = parsedCredentials.data;
//             const user = await getUser(email);
//             if (!user) return null;
//             const passwordsMatch = await bcrypt.compare(password, user.password);

//             if (passwordsMatch) {
//               return user
//             }
//         }

//         console.log('Invalid credentials');
//         return null;
//     }
// };

const testProvider2 = Credentials({
  name: "Credentials",
  credentials: {
    username: { label: "Brukernavn", type: "text", placeholder: "jsmith" },
    password: { label: "Passord", type: "password" }
  },
  async authorize(credentials, req) {
    // Add logic here to look up the user from the credentials supplied
    const user = {
       id: "1", 
       name: "Sebastian Nordby", 
       email: "jsmith@example.com" 
    };

    if (user) {
      // Any object returned will be saved in `user` property of the JWT
      return user
    } else {
      // If you return null then an error will be displayed advising the user to check their details.
      return null
    }
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