import type { NextAuthConfig } from 'next-auth';
 
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
