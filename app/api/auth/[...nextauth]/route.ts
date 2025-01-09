import { supabase } from "@/lib/supabaseClient";
import { NextAuthOptions } from "next-auth";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const Google_Client_ID = process.env.GOOGLE_CLIENT_ID!;
const Google_Client_Secret = process.env.GOOGLE_CLIENT_SECRET!;
const NextAuth_Secret = process.env.NEXTAUTH_SECRET!;

const authOption: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/sign-in',
  },
  secret: NextAuth_Secret,
  providers: [
    GoogleProvider({
      clientId: Google_Client_ID,
      clientSecret: Google_Client_Secret,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (!profile?.email) {
        console.error('No profile or email provided');
        return false; // Prevent sign-in
      }

      // Check if user already exists
      const { data, error: fetchError } = await supabase
        .from('user')
        .select('*')
        .eq('email', profile.email)
        .single(); // Use single() if expecting a single row
      if (data) {
        console.log('Profile already exists, logging in...');
      } else {
        const { error: insertError } = await supabase
          .from('user')
          .insert([{ email: profile.email, name: profile.name }]);

        if (insertError) {
          console.error('Error inserting data:', insertError);
          return false; // Prevent sign-in
        } else {
          console.log('Data written successfully');
        }
      }

      return true; // Allow sign-in
    },
  },
};

const handler = NextAuth(authOption);
export { handler as GET, handler as POST };
