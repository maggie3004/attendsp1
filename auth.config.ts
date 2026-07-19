import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.employeeId = (user as { employeeId?: string }).employeeId;
        token.employeeCode = (user as { employeeCode?: string }).employeeCode;
        token.designation = (user as { designation?: string }).designation;
        token.department = (user as { department?: string }).department;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.employeeId = token.employeeId as string;
        session.user.employeeCode = token.employeeCode as string;
        session.user.designation = token.designation as string;
        session.user.department = token.department as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.AUTH_SECRET,
  providers: [], // Empty array for Edge compatibility
} satisfies NextAuthConfig;
