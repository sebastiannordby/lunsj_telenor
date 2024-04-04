import NextAuth from 'next-auth';
import { authConfig } from './auth-config';

const nextAuthInstance = NextAuth(authConfig);

export default nextAuthInstance;

export const { auth } = nextAuthInstance;
