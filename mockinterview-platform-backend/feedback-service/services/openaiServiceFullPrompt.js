// openaiService.js

const { OpenAI } = require('openai');
const logger = require('../../shared-lib/logger');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Generates interview feedback using OpenAI API.
   * @param {string} questionContent - The original interview question text.
   * @param {string} userAnswer - The user's answer to the question.
   * @returns {Object} - Generated feedback.
   */
  async generateFeedback(questionContent, userAnswer) { // <--- Modified to accept questionContent and userAnswer
    try {
      let retries = 0;
      let result = null;

      // Construct a more comprehensive prompt using both the question and the user's answer
      const userPrompt = `Interview Question: "${questionContent}"\n\nUser's Answer: "${userAnswer}"\n\nPlease provide concise and constructive feedback on the user's answer in relation to the given question. Focus on correctness, completeness, and clarity.`;

      while (retries <= this.maxRetries) {
        try {
          result = await this.client.chat.completions.create({
            model: 'gpt-3.5-turbo', // You can consider 'gpt-4o' or 'gpt-4-turbo' for better quality feedback
            messages: [
              { role: 'system', content: 'You are an expert interviewer and feedback provider. Your goal is to help users improve their interview answers.' },
              { role: 'user', content: userPrompt }, // <--- Use the new comprehensive prompt
            ],
            temperature: 0.5, // Slightly adjust temperature for more varied but still focused feedback
            max_tokens: 500, // Limit the length of the AI's response
          });

          break;
        } catch (error) {
          if (error.status === 429 || (error.status >= 500 && error.status < 600)) {
            retries++;
            if (retries > this.maxRetries) {
              throw error;
            }
            const delay = this.retryDelay * Math.pow(2, retries - 1);
            logger.warn(`OpenAI API call failed, retrying in ${delay}ms... (${retries}/${this.maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        }
      }

      if (!result || !result.choices || !result.choices[0]) {
        throw new Error('Invalid response from OpenAI API');
      }

      const feedbackText = result.choices[0].message.content;

      const feedbackData = {
        overallFeedback: {
          content: feedbackText,
        },
      };
      return feedbackData;
    } catch (error) {
      logger.error(`OpenAI API error: ${error.message}`);
      throw new Error(`Failed to generate feedback: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();