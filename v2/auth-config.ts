import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isInManagement = nextUrl.pathname.startsWith('/management');

      if (isInManagement && !isLoggedIn) {
        // Return the URL to redirect to if the user is not logged in
        return '/';
      }

      // Return true to allow access
      return true;
    },
  },
  providers: [], 
};

export default authConfig;
