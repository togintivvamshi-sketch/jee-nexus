const Groq = require('groq-sdk');
const { groqApiKey, groqModel } = require('../config/env');

let groq = null;

function initializeGroq() {
  if (groqApiKey && groqApiKey !== 'your-groq-api-key-here') {
    groq = new Groq({ apiKey: groqApiKey });
    return true;
  }
  return false;
}

function isGroqConfigured() {
  return groq !== null;
}

async function chatCompletion(messages, options = {}) {
  if (!groq) {
    throw new Error('Groq API not configured. Please set GROQ_API_KEY in .env file.');
  }

  try {
    const completion = await groq.chat.completions.create({
      model: groqModel,
      messages: messages,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 2048,
      top_p: options.topP || 0.9,
      stream: false
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Groq API Error:', error.message);
    throw new Error(`AI service error: ${error.message}`);
  }
}

async function chatCompletionStream(messages, options = {}) {
  if (!groq) {
    throw new Error('Groq API not configured. Please set GROQ_API_KEY in .env file.');
  }

  try {
    const stream = await groq.chat.completions.create({
      model: groqModel,
      messages: messages,
      temperature: options.temperature || 0.3,
      max_tokens: options.maxTokens || 2048,
      top_p: options.topP || 0.9,
      stream: true
    });
    return stream;
  } catch (error) {
    console.error('Groq API Stream Error:', error.message);
    throw new Error(`AI service error: ${error.message}`);
  }
}

// Vision-capable chat completion for image reading
async function visionChatCompletion(messages, options = {}) {
  if (!groq) {
    throw new Error('Groq API not configured. Please set GROQ_API_KEY in .env file.');
  }

  // Use a vision-capable model (Llama 4 models with vision support)
  // Try different model name formats
  const visionModels = [
    'llama-4-scout-17b-16e-instruct',
    'llama-4-maverick-17b-128e-instruct',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'meta-llama/llama-4-maverick-17b-128e-instruct'
  ];

  const visionModel = options.visionModel || visionModels[0];

  try {
    const completion = await groq.chat.completions.create({
      model: visionModel,
      messages: messages,
      temperature: options.temperature || 0.1,
      max_tokens: options.maxTokens || 2048,
      top_p: options.topP || 0.9,
      stream: false
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Groq Vision API Error:', error.message);
    // Try fallback models
    for (const fallbackModel of visionModels.slice(1)) {
      if (fallbackModel === visionModel) continue;
      try {
        console.log(`Trying fallback vision model: ${fallbackModel}`);
        const completion = await groq.chat.completions.create({
          model: fallbackModel,
          messages: messages,
          temperature: options.temperature || 0.1,
          max_tokens: options.maxTokens || 2048,
          top_p: options.topP || 0.9,
          stream: false
        });
        return completion.choices[0].message.content;
      } catch (fallbackError) {
        console.error(`Fallback ${fallbackModel} failed:`, fallbackError.message);
      }
    }
    throw new Error(`AI vision service error: ${error.message}`);
  }
}

initializeGroq();

module.exports = {
  chatCompletion,
  chatCompletionStream,
  visionChatCompletion,
  isGroqConfigured,
  initializeGroq
};