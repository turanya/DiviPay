const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getProfile, 
  updateProfile,
  changePassword  // Add this import
} = require('../controllers/authController');
const { 
  validateRegister, 
  validateLogin, 
  validateChangePassword 
} = require('../middleware/validation');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.put('/change-password', validateChangePassword, auth, changePassword);

module.exports = router;
