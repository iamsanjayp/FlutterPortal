const API_BASE_URL = 'http://localhost:5000/api/execute';

export async function executeReactNative(code, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/react-native`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        ...options
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to execute code');
    }

    return data;
  } catch (error) {
    console.error('Error executing React Native code:', error);
    throw error;
  }
}

export async function getExample(type = 'basic') {
  try {
    const response = await fetch(`${API_BASE_URL}/react-native/example/${type}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to load example');
    }

    return data;
  } catch (error) {
    console.error('Error loading example:', error);
    throw error;
  }
}

export async function validateCode(code) {
  try {
    const response = await fetch(`${API_BASE_URL}/react-native/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to validate code');
    }

    return data;
  } catch (error) {
    console.error('Error validating code:', error);
    throw error;
  }
}
