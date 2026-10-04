const { visionChatCompletion } = require('./groq.service');

const IMAGE_READER_SYSTEM_PROMPT = `You are the image-reading stage of JEE Nexus, a JEE Main preparation assistant.

Your job: Carefully inspect the uploaded image and reconstruct the complete JEE question.

READING INSTRUCTIONS:
- Read ALL visible text, numbers, mathematical expressions, symbols, units
- Read chemical equations, formulas, answer choices (A, B, C, D)
- Read diagram labels, axes, coordinates, vectors, forces, angles
- Preserve mathematical meaning - do not simplify or change expressions
- If something is genuinely unreadable, explicitly identify the unclear portion
- Do NOT solve the question, do NOT give the final answer
- Do NOT provide hints, explanations, or solution steps
- Your ONLY job is to accurately read and reconstruct the question

OUTPUT FORMAT:
Return a clear, well-structured question text that a student could copy and use.
If the image contains multiple choice options, include them clearly labeled.
If there are diagrams, describe the relevant visual information in words.
If something is unreadable, mark it clearly: [UNREADABLE: description of what's unclear]`;

async function readImageQuestion(base64Image, mimeType) {
  if (!base64Image) {
    throw new Error('No image data provided');
  }

  const messages = [
    { role: 'system', content: IMAGE_READER_SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Please read this JEE question image and extract the complete question text.'
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`
          }
        }
      ]
    }
  ];

  try {
    const extractedQuestion = await visionChatCompletion(messages, {
      temperature: 0.1,
      maxTokens: 2048
    });
    return extractedQuestion;
  } catch (error) {
    console.error('Image reading error:', error);
    
    // Check if it's a vision model availability error
    const errorMsg = error.message || '';
    if (errorMsg.includes('model_not_found') || errorMsg.includes('model_decommissioned') || errorMsg.includes('does not exist') || errorMsg.includes('not supported')) {
      throw new Error('Image reading is currently unavailable. Vision models are not configured on the AI backend. Please type your question instead, or contact support to enable vision capabilities.');
    }
    
    throw new Error(`Failed to read image: ${error.message}`);
  }
}

module.exports = {
  readImageQuestion,
  IMAGE_READER_SYSTEM_PROMPT
};