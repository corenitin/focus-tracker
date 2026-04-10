const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// ─── Google Strategy ──────────────────────────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);

    // Check if email already registered manually — link accounts
    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = profile.id;
        if (!user.avatar && profile.photos?.[0]?.value) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
        return done(null, user);
      }
    }

    // Create new user from Google profile
    user = await User.create({
      name:     profile.displayName || 'Google User',
      email:    email || `google_${profile.id}@noemail.com`,
      googleId: profile.id,
      avatar:   profile.photos?.[0]?.value || null,
      password: require('crypto').randomBytes(32).toString('hex'),
    });

    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

// ─── GitHub Strategy ──────────────────────────────────────────────────────────
passport.use(new GitHubStrategy({
  clientID:     process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL:  '/api/auth/github/callback',
  scope: ['user:email'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ githubId: profile.id });
    if (user) return done(null, user);

    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        user.githubId = profile.id;
        if (!user.avatar && profile.photos?.[0]?.value) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
        return done(null, user);
      }
    }

    user = await User.create({
      name:     profile.displayName || profile.username || 'GitHub User',
      email:    email || `github_${profile.id}@noemail.com`,
      githubId: profile.id,
      avatar:   profile.photos?.[0]?.value || null,
      password: require('crypto').randomBytes(32).toString('hex'),
    });

    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

module.exports = passport;
