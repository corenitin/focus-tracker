const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const User   = require('../models/User');
const { sendOTPEmail } = require('../utils/emailService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ─── Register ─────────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered.' });
    }
    const user  = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide email and password.' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }
    if (!user.password) {
      const provider = user.googleId ? 'Google' : user.githubId ? 'GitHub' : 'OAuth';
      return res.status(401).json({ success: false, error: `This account uses ${provider} sign-in. Please use that option.` });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }
    const token = generateToken(user._id);
    res.json({
      success: true, token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Get Current User ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({
    success: true,
    user: { id: req.user._id, name: req.user.name, email: req.user.email, avatar: req.user.avatar },
  });
};

// ─── Forgot Password — Send OTP ───────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Please provide your email address.' });
    }

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email is registered, you will receive a reset code.' });
    }

    // OAuth-only users can't reset password
    if (!user.password && (user.googleId || user.githubId)) {
      const provider = user.googleId ? 'Google' : 'GitHub';
      return res.status(400).json({ success: false, error: `This account uses ${provider} sign-in and doesn't have a password.` });
    }

    // Generate OTP
    const otp = user.generateResetOTP();
    await user.save({ validateBeforeSave: false });

    // Send email
    try {
      await sendOTPEmail({ to: user.email, name: user.name, otp });
      res.json({ success: true, message: 'A 6-digit reset code has been sent to your email.' });
    } catch (emailErr) {
      // Rollback OTP if email fails
      user.resetOTP         = null;
      user.resetOTPExpires  = null;
      user.resetOTPVerified = false;
      await user.save({ validateBeforeSave: false });
      console.error('Email send error:', emailErr.message);
      res.status(500).json({ success: false, error: 'Failed to send email. Please try again later.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required.' });
    }

    const hashedOTP = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    const user = await User.findOne({
      email,
      resetOTP:        hashedOTP,
      resetOTPExpires: { $gt: Date.now() },
    }).select('+resetOTP +resetOTPExpires +resetOTPVerified');

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Mark OTP as verified — allow password reset
    user.resetOTPVerified = true;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'OTP verified. You can now set a new password.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and new password are required.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const user = await User.findOne({ email })
      .select('+resetOTP +resetOTPExpires +resetOTPVerified');

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid request.' });
    }
    if (!user.resetOTPVerified) {
      return res.status(400).json({ success: false, error: 'OTP not verified. Please verify your OTP first.' });
    }
    if (!user.resetOTPExpires || user.resetOTPExpires < Date.now()) {
      return res.status(400).json({ success: false, error: 'Session expired. Please request a new reset code.' });
    }

    // Set new password and clear OTP fields
    user.password         = password;
    user.resetOTP         = null;
    user.resetOTPExpires  = null;
    user.resetOTPVerified = false;
    await user.save();

    // Auto-login after reset
    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Password reset successfully!',
      token,
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
