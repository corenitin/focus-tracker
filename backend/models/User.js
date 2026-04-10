const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
      // Not required for OAuth users
    },
    googleId: { type: String, default: null },
    githubId: { type: String, default: null },
    avatar:   { type: String, default: null },
  },
  { timestamps: true }
);

// Hash password before saving (only if modified and exists)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  // Skip hashing if it looks already hashed (hex string from OAuth)
  if (this.password.length === 64 && /^[a-f0-9]+$/.test(this.password)) {
    this.password = await bcrypt.hash(this.password, 12);
  } else if (!this.password.startsWith('$2')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
