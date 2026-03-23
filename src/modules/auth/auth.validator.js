const { body } = require('express-validator');

const registerRules = [
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^\+?[1-9]\d{6,14}$/).withMessage('Invalid mobile number'),

  body('pin')
    .notEmpty().withMessage('PIN is required')
    .isLength({ min: 4, max: 4 }).withMessage('PIN must be exactly 4 digits')
    .isNumeric().withMessage('PIN must contain only digits'),

  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 2, max: 50 }).withMessage('Username must be 2–50 characters'),
];

const loginRules = [
  body('mobile')
    .trim()
    .notEmpty().withMessage('Mobile number is required'),

  body('pin')
    .notEmpty().withMessage('PIN is required')
    .isLength({ min: 4, max: 4 }).withMessage('PIN must be exactly 4 digits')
    .isNumeric().withMessage('PIN must contain only digits'),
];

module.exports = { registerRules, loginRules };
