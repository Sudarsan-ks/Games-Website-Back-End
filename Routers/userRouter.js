const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../Models/userSchema");
const router = express.Router();
const transporter = require("../Routers/email");
const crypto = require("crypto");
const Otp = require("../Models/otpSchema");
const { auth, adminAuth } = require("./auth");

router.post("/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    const userAlreadyExist = await User.findOne({ phone });
    if (userAlreadyExist) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      phone,
      email,
      password: hashedPassword,
      isAdmin: false,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Error in Registering a User", error });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const passCompare = await bcrypt.compare(password, user.password);
    if (!passCompare) {
      res.status(400).json({ message: "Invalid credentials" });
    }
    const secretKey = user.isAdmin
      ? process.env.SECRET_KEY_ADMIN
      : process.env.SECRET_KEY_USER;

    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, secretKey, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Logged In Successfully",
      token,
      user,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    res.status(500).json({ message: "Error in Login", error });
  }
});

const sendEmail = async (email, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password - Online Games",
      html: `<p> Your OTP for resetting you password is <b>${otp}</b> , Valid only for 4 minutes </p>`,
    });
  } catch (error) {
    res.status(500).json({ message: "Error sending Email", error });
  }
};

router.post("/forgotPass", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 4 * 60 * 1000);
    await Otp.deleteOne({ email });
    const newOtp = new Otp({ email, otp, expiresAt });
    await newOtp.save();

    await sendEmail(email, otp);

    res.status(200).json({ message: "OTP sent to your email Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error in sending OTP", error });
  }
});

router.post("/resetPass", async (req, res) => {
  try {
    const { email, otp, newPass } = req.body;

    const checkOtp = await Otp.findOne({ email, otp });

    if (!checkOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    const hashedPassword = await bcrypt.hash(newPass, 10);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    await Otp.deleteOne({ email });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error in resetting the password", error });
  }
});

router.post("/resendOtp", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 4 * 60 * 1000);
    await Otp.deleteOne({ email });
    const newOtp = new Otp({ email, otp, expiresAt });
    await newOtp.save();

    await sendEmail(email, otp);

    res.status(200).json({ message: "OTP Re-sent to your email Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error in Re-sending the OTP", error });
  }
});

router.get("/adminDashboard", auth, adminAuth, async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true });
    const notAnAdmin = await User.find({ isAdmin: false });

    if (!admins || admins.length === 0) {
      return res.status(404).json({ message: "No admin users found" });
    }
    res.status(200).json({ message: "Admin Details", admins, notAnAdmin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching admin data", error });
  }
});

router.put("/makeAnAdmin/:userID", auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated to admin", user });
  } catch (error) {
    res.status(500).json({ message: "Error in Making a user an ADMIN", error });
  }
});

router.get("/userDetails", auth, adminAuth, async (req, res) => {
  try {
    const user = await User.find();
    res.status(200).json({ message: "User Details", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching User data", error });
  }
});

module.exports = router;
