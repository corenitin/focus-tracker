const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

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
    },
    googleId: { type: String, default: null },
    githubId: { type: String, default: null },
    avatar:   { type: String, default: null },

    // ── Password Reset OTP ────────────────────────────────────────────────────
    resetOTP:        { type: String,  default: null, select: false },
    resetOTPExpires: { type: Date,    default: null, select: false },
    resetOTPVerified:{ type: Boolean, default: false, select: false },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  if (this.password.startsWith('$2')) return next(); // already hashed
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate a 6-digit OTP and set expiry (10 minutes)
userSchema.methods.generateResetOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetOTP        = crypto.createHash('sha256').update(otp).digest('hex');
  this.resetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  this.resetOTPVerified = false;
  return otp; // return plain OTP to send by email
};

module.exports = mongoose.model('User', userSchema);
