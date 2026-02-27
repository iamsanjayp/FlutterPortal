import { executeReactNativeDocker } from '../execution/react-native/runReactNativeDocker.js';
import { validateReactNativeCode, createExampleSnack } from '../execution/react-native/runReactNative.js';

/**
 * Controller for React Native code execution
 */

/**
 * Execute React Native code via Docker
 * POST /api/execute/react-native
 */
export async function executeReactNative(req, res) {
  try {
    const { code, files, name } = req.body;

    if (!code && !files) {
      return res.status(400).json({
        success: false,
        message: 'Code or files input is required'
      });
    }

    // Extend timeout for long-running Docker operations
    req.setTimeout(180000); // 3 minutes
    res.setTimeout(180000);

    console.log('[ReactNative] Starting execution...');

    // Execute in Docker (Pass files if available, otherwise code)
    const result = await executeReactNativeDocker(files || code, { name });

    console.log('[ReactNative] Execution completed:', result.success);

    if (!result.success) {
      return res.json({
        success: false,
        message: result.message,
        output: result.output,
        duration: result.duration
      });
    }

    return res.json({
      success: true,
      message: result.message,
      output: result.output,
      html: result.html, // Pass HTML for visualization
      duration: result.duration
    });

  } catch (error) {
    console.error('Error in executeReactNative:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Get an example React Native snack
 * GET /api/execute/react-native/example/:type
 */
export async function getExample(req, res) {
  try {
    const { type } = req.params;
    const allowedTypes = ['basic', 'interactive'];
    
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid example type. Must be one of: ${allowedTypes.join(', ')}`
      });
    }

    const result = await createExampleSnack(type);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create example',
        error: result.error
      });
    }

    return res.json({
      success: true,
      ...result,
      type
    });

  } catch (error) {
    console.error('Error in getExample:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

/**
 * Validate React Native code without executing
 * POST /api/execute/react-native/validate
 */
export async function validateCode(req, res) {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Code is required and must be a string'
      });
    }

    const validation = await validateReactNativeCode(code);

    return res.json({
      success: true,
      ...validation
    });

  } catch (error) {
    console.error('Error in validateCode:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}
