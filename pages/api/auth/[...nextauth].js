// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Attach a "premium" flag to the session.
      // For demonstration, we assume a default of false.
      session.user.premium = token.premium || false;
      return session;
    },
    async jwt({ token, user }) {
      // Propagate any premium flag if set (you can customize your logic here).
      if (user) {
        token.premium = user.premium || false;
      }
      return token;
    },
  },
});
