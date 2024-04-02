import type { NextAuthConfig } from 'next-auth';

authConfig = {
  trustHost: true,
  trustHostedDomain: true,
  pages: {
    signIn: `/login`,
  },
  callbacks: {}
  ...

export const { auth, signIn, signOut } = NextAuth(authConfig);
 
export const authConfig = {
    pages: {
      signIn: '/login',
    },
    callbacks: {
      authorized({ auth, request: { nextUrl } }) {
        // const isLoggedIn = !!auth?.user;
        // const isInManagement = nextUrl.pathname.startsWith('/management');

        // if (isInManagement) {
        //   if (!isLoggedIn){
        //     return Response.redirect(new URL('/', nextUrl));
        //   }
        // }

        return true;
      },
    },
    providers: [], 
  } satisfies NextAuthConfig;
