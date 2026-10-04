const PRACTICE_SYSTEM_PROMPT = `You are JEE Nexus Practice Engine.

Generate practice questions for JEE Main preparation.

RULES:
1. Clearly label ALL questions as "AI-Generated Practice Question"
2. NEVER claim a generated question is an actual JEE Main PYQ
3. Match the requested subject, difficulty, and topic
4. Provide ONE question at a time for interactive practice
5. Include: question, options (for MCQ), correct answer, detailed explanation
6. Difficulty levels:
   - Basic: Fundamental concept application, single step
   - JEE Main: Typical exam level, multi-step reasoning
   - Challenging: Multi-concept, tricky, time-consuming
7. Question types: MCQ (single correct), MSQ (multiple correct), Numerical, Integer

FORMAT for each question:
{
  "question": "Question text",
  "type": "MCQ|MSQ|Numerical|Integer",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."] (for MCQ/MSQ),
  "correctAnswer": "A" or "5.2" or ["A", "C"],
  "explanation": "Detailed step-by-step explanation",
  "subject": "Physics|Chemistry|Mathematics",
  "chapter": "Chapter name",
  "topic": "Specific topic",
  "difficulty": "Basic|JEE Main|Challenging",
  "source": "AI-Generated Practice Question"
}`;

function buildPracticeMessages(userRequest, history = []) {
  const messages = [{ role: 'system', content: PRACTICE_SYSTEM_PROMPT }];
  
  if (history.length > 0) {
    messages.push(...history.slice(-6));
  }
  
  messages.push({ role: 'user', content: userRequest });
  
  return messages;
}

function parsePracticeRequest(params) {
  const {
    subject = 'Mixed',
    difficulty = 'JEE Main',
    count = 5,
    topic = '',
    chapter = ''
  } = params;

  let request = `Generate ${count} practice question(s) for JEE Main.\n`;
  request += `Subject: ${subject}\n`;
  request += `Difficulty: ${difficulty}\n`;
  if (chapter) request += `Chapter: ${chapter}\n`;
  if (topic) request += `Topic: ${topic}\n`;
  request += `\nProvide ONE question at a time in the specified JSON format.`;

  return request;
}

module.exports = {
  PRACTICE_SYSTEM_PROMPT,
  buildPracticeMessages,
  parsePracticeRequest
};