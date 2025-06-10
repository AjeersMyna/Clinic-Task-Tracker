// backend/controllers/userController.js

const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || 'doctor', // Default role if not provided
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid credentials');
    }
});

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(req.user);
});

// @desc    Get all doctors
// @route   GET /api/users/doctors
// @access  Private (Admin & Doctor can view doctor list)
const getDoctors = asyncHandler(async (req, res) => {
    // Find users with the role 'doctor'
    const doctors = await User.find({ role: 'doctor' }).select('-password'); // Exclude passwords

    if (doctors) {
        res.status(200).json(doctors);
    } else {
        res.status(404);
        throw new Error('No doctors found');
    }
});

// --- ADMIN-SPECIFIC USER MANAGEMENT FUNCTIONS (KEPT FOR FUTURE ADMIN FEATURES) ---

// @desc    Get all users (Admin Only)
// @route   GET /api/users/all
// @access  Private (Admin Only)
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password'); // Exclude passwords
    res.status(200).json(users);
});

// @desc    Update any user by ID (Admin Only)
// @route   PUT /api/users/:id
// @access  Private (Admin Only)
const updateUserById = asyncHandler(async (req, res) => {
    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
        res.status(404);
        throw new new Error('User not found');
    }

    // Prevent admin from changing their own role to something other than admin
    if (userToUpdate._id.toString() === req.user._id.toString() && req.body.role && req.body.role !== 'admin') {
        res.status(403);
        throw new Error('Admin cannot change their own role to non-admin via this route.');
    }

    const { name, email, role, password } = req.body;

    userToUpdate.name = name || userToUpdate.name;

    if (email && email !== userToUpdate.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser._id.toString() !== userToUpdate._id.toString()) {
            res.status(400);
            throw new Error('Email already in use by another user.');
        }
        userToUpdate.email = email;
    }

    if (role && ['admin', 'doctor', 'patient'].includes(role)) {
        userToUpdate.role = role;
    }

    if (password) {
        const salt = await bcrypt.genSalt(10);
        userToUpdate.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await userToUpdate.save();

    res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
    });
});

// @desc    Delete any user by ID (Admin Only)
// @route   DELETE /api/users/:id
// @access  Private (Admin Only)
const deleteUserById = asyncHandler(async (req, res) => {
    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent admin from deleting themselves
    if (userToDelete._id.toString() === req.user._id.toString()) {
        res.status(403);
        throw new Error('Admin cannot delete their own account.');
    }

    await User.deleteOne({ _id: req.params.id });

    res.status(200).json({ id: req.params.id, message: 'User deleted successfully' });
});


// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
    });
};


module.exports = {
    registerUser,
    loginUser,
    getMe,
    getDoctors,
    getAllUsers,      // Kept for admin user management
    updateUserById,   // Kept for admin user management
    deleteUserById,   // Kept for admin user management
};