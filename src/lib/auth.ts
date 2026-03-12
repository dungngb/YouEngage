import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import authConfig from "./auth.config";

const devProviders =
  process.env.DEV_AUTH === "true"
    ? [
        CredentialsProvider({
          id: "dev-credentials",
          name: "Dev Login",
          credentials: {
            email: { label: "Email", type: "email" },
          },
          async authorize(credentials) {
            const email = credentials?.email as string | undefined;
            if (!email) return null;
            const user = await prisma.user.findUnique({
              where: { email },
            });
            if (!user) return null;
            return { id: user.id, email: user.email, name: user.name };
          },
        }),
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [...authConfig.providers, ...devProviders],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On initial sign-in or when session is updated, fetch role from DB
      if (user || trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          include: { role: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.role = dbUser.role?.name ?? "auditor";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Assign default role "auditor" to new users
      const auditorRole = await prisma.role.findUnique({
        where: { name: "auditor" },
      });
      if (auditorRole && user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: auditorRole.id },
        });
      }
    },
  },
});
