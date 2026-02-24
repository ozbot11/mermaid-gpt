import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

/** If true, any signed-in user is allowed (public mode). */
function isAllowAllMode(): boolean {
  const raw = (process.env.ALLOWED_EMAILS ?? "").trim();
  return raw === "" || raw === "*";
}

function getAllowedEmails(): Set<string> {
  const raw = process.env.ALLOWED_EMAILS ?? "";
  if (!raw.trim() || raw.trim() === "*") return new Set();
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  if (isAllowAllMode()) return true;
  return getAllowedEmails().has(email.trim().toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.picture = user.image;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
        session.user.name = token.name as string;
        session.user.allowed = isEmailAllowed(session.user.email);
      }
      return session;
    },
  },
};
