const axios = require('axios');

const NVIDIA_API_KEY = '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';
const MODEL_ID = 'meta/llama-4-maverick-17b-128e-instruct';
const INVOKE_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

async function callNvidiaAPI(message) {
  try {
    const payload = {
      model: MODEL_ID,
      messages: [
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 512,
      temperature: 1.00,
      top_p: 1.00,
      stream: false
    };

    const response = await axios.post(INVOKE_URL, payload, {
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    // The response format should be in the chat completions format
    if (response.data.choices && response.data.choices[0]) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Unexpected response format from NVIDIA API');
    }
  } catch (error) {
    console.error('NVIDIA API Error:', error.response?.data || error.message);
    throw new Error('Failed to get response from NVIDIA API');
  }
}

module.exports = callNvidiaAPI; 