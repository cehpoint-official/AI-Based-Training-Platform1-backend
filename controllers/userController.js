const User = require('../models/User'); // Assuming you have a User model
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure your nodemailer transporter here
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

exports.signin = async (req, res) => {
  const { email, password, firebaseUid } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    if (password === user.password) {
      // Update the uid if it's missing or different
      if (!user.uid || user.uid !== firebaseUid) {
        user.uid = firebaseUid;
        await user.save();
      }

      return res.json({
        success: true,
        message: "SignIn successful",
        userData: {
          ...user.toObject(),
          uid: user.uid // Ensure the updated uid is sent back
        },
      });
    }

    res.json({ success: false, message: "Invalid email or password" });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.signup = async (req, res) => {
  const { email, mName, password, type, uid } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({
        success: false,
        message: "User with this email already exists",
      });
    }
    const newUser = new User({
      email,
      mName,
      password,
      type,
      uid,
      profile: 'https://firebasestorage.googleapis.com/v0/b/ai-based-training-platfo-ca895.appspot.com/o/user.png?alt=media&[REDACTED:Generic API Key]' // Default profile image
    });
    await newUser.save();
    res.json({
      success: true,
      message: "Account created successfully",
      userId: newUser._id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.googleAuth = async (req, res) => {
  const { name, email, token, googleProfileImage } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.uid) {
        existingUser.uid = uid;
        await existingUser.save();
      }
      if (!existingUser.password) {
        return res.json({
          success: true,
          message: "Google authentication successful",
          userData: existingUser,
          passwordSetRequired: true,
        });
      }
      return res.json({
        success: true,
        message: "SignIn successful",
        userData: existingUser,
      });
    }
    const newUser = new User({
      email,
      mName: name,
      resetPasswordToken: token,
      profile: googleProfileImage 
    });
    await newUser.save();
    res.json({
      success: true,
      message: "Account created successfully. Please set Password",
      userData: newUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email, name, company, logo } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetLink = `${process.env.WEBSITE_URL}/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: `${name} Password Reset`,
      html: `<!-- Your email template here -->`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { password, token } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({ success: true, message: "Invalid or expired token" });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getProfile = async (req, res) => {
  const { uid } = req.query; // Assuming the UID is passed as a query parameter

  try {
    // Fetch the user by their unique identifier (UID)
    const user = await User.findOne({ uid }, 'email mName profile type uid role');

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      userProfile: user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateProfile = async (req, res) => {
  const { email, mName, password, uid, apiKey } = req.body;
  try {
    const updateData = { email, mName };
    if (password !== "") {
      updateData.password = password;
    }
    if (apiKey) {
      updateData.apiKey = apiKey;
    }
    await User.findOneAndUpdate(
      { _id: uid },
      { $set: updateData }
    );
    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.error("Error in profile update:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'email mName type _id');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getUserById = async (req, res) => {
  const { id } = req.query; // Change this to req.query

  try {
    // Fetch the user by _id
    const user = await User.findOne({ _id: id });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      userData: user,
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }, 'email mName');
    const regularUsers = await User.find({ role: { $ne: "admin" } }, 'email mName');
    res.json({ admins, regularUsers });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.addAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "User is already an admin" });
    }

    user.role = "admin";
    await user.save();

    res.json({ success: true, message: "User  added as admin" });
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User  not found" });
    }

    if (user.role !== "admin") {
      return res.status(400).json({ success: false, message: "User  is not an admin" });
    }

    user.role = "";
    await user.save();

    res.json({ success: true, message: "User  removed as admin" });
  } catch (error) {
    console.error('Error removing admin:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};