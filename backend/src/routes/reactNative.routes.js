import express from 'express';
import { executeReactNative, getExample, validateCode } from '../controllers/reactNativeController.js';

const router = express.Router();

/**
 * React Native code execution routes
 */

// Execute React Native code and get preview URL
router.post('/react-native', executeReactNative);

// Get example code
router.get('/react-native/example/:type', getExample);

// Validate code without executing
router.post('/react-native/validate', validateCode);

export default router;
