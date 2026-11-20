const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const dbUser = require("../modules/dbUser");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email || profile.emails?.[0]?.verified !== true) {
          return done(null, false);
        }

        let user = await dbUser.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        user = await dbUser.findOne({ mail: email });
        if (user) {
          user = await dbUser.findByIdAndUpdate(
            user._id,
            { $set: { googleId: profile.id } },
            { new: true },
          );
          return done(null, user);
        }

        user = await dbUser.create({
          fname: profile.name?.givenName || "Google",
          lname: profile.name?.familyName || "User",
          username: profile.displayName,
          mail: email,
          image: profile.photos?.[0]?.value || "",
          googleId: profile.id,
          authProvider: "google",
        });
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

module.exports = passport;
