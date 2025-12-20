import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import transporter from '../config/mailer.js';

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).send('Invalid email format');
        }

        // Check if user already exists
        const emailExist = await User.findOne({ email });
        if (emailExist) return res.status(400).send('Email already exists');

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        const savedUser = await user.save();
        res.send({ user: user._id });
    } catch (err) {
        res.status(400).send(err);
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('Email is not found');

        // Check if password is correct
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).send('Invalid password');

        // Create and assign a token
        const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET || 'devsecret');
        res.header('auth-token', token).send(token);
    } catch (err) {
        res.status(400).send(err.message);
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('Email not found');

        // Generate 6 digit random code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Expires in 1 hour
        user.resetCode = code;
        user.resetCodeExpires = Date.now() + 3600000;
        await user.save();

        // Send email
        const mailOptions = {
            from: '"Book Manager" <noreply@bookmanager.com>',
            to: user.email,
            subject: 'Password Reset Code',
            text: `Your password reset code is: ${code}\nThis code expires in 1 hour.`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);

        res.send('Reset code sent to email');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error sending email');
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        const user = await User.findOne({
            email,
            resetCode: code,
            resetCodeExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).send('Invalid or expired code');

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.resetCode = null;
        user.resetCodeExpires = null;
        await user.save();

        res.send('Password updated successfully');
    } catch (err) {
        res.status(500).send(err.message);
    }
};
