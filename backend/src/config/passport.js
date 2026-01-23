import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "./db.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const googleId = profile.id;

        // 1. Check if user already exists
        const [existingUsers] = await pool.query(
          "SELECT * FROM users WHERE email = ?",
          [email]
        );

        let user;

        if (existingUsers.length > 0) {
          user = existingUsers[0];
        } else {
          // 2. Get STUDENT role id
          const [[role]] = await pool.query(
            "SELECT id FROM roles WHERE name = 'STUDENT'"
          );

          // 3. Create new user
          const [result] = await pool.query(
            `INSERT INTO users 
             (full_name, email, auth_provider, role_id)
             VALUES (?, ?, 'GOOGLE', ?)`,
            [name, email, role.id]
          );

          const userId = result.insertId;

          // 4. Save OAuth account
          await pool.query(
            `INSERT INTO oauth_accounts 
             (user_id, provider, provider_user_id)
             VALUES (?, 'GOOGLE', ?)`,
            [userId, googleId]
          );

          user = {
            id: userId,
            full_name: name,
            email,
            role_id: role.id,
          };
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;
