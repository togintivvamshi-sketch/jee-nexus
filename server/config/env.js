require('dotenv').config();

module.exports = {
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
  port: process.env.PORT || 3000
};