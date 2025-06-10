// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    getDoctors,
    getAllUsers,
    updateUserById,
    deleteUserById,
} = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/doctors', protect, authorizeRoles('admin', 'doctor'), getDoctors); // Crucial for fetching doctors for task assignment

// --- ADMIN-SPECIFIC USER MANAGEMENT ROUTES (KEPT FOR FUTURE ADMIN FEATURES) ---
router.get('/all', protect, authorizeRoles('admin'), getAllUsers);
router.put('/:id', protect, authorizeRoles('admin'), updateUserById);
router.delete('/:id', protect, authorizeRoles('admin'), deleteUserById);

module.exports = router;