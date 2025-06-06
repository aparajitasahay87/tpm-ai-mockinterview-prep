// services/openaiService.js

const { OpenAI } = require('openai');
//const logger = require('../../shared-lib/logger');

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
   * This function now accepts individual components and constructs the prompt internally.
   * It also requests JSON output from the AI.
   *
   * @param {string} questionContent - The original interview question text.
   * @param {string} userAnswer - The user's answer to the question.
   * @param {string} overallGuidelines - Overall feedback guidelines from JSONB.
   * @param {string} specificCriteriaPointers - Specific key elements/criteria from JSONB.
   * @param {string} redFlagsToAvoid - Red flags to avoid from JSONB.
   * @returns {Promise<string>} - The raw string content of the AI's response (expected to be a JSON string).
   */
  async generateFeedback(
    questionContent,
    userAnswer,
    overallGuidelines,
    specificCriteriaPointers,
    redFlagsToAvoid
  ) {
    try {
      let retries = 0;
      let result = null;

      // ⭐ CRITICAL: Construct the prompt here internally using the individual components
      const customPrompt = `
          You are an expert technical interviewer providing detailed, actionable, and constructive feedback.
          Your evaluation must strictly adhere to the specific criteria provided below.

          **Interview Question:** "${questionContent}"
          **Candidate's Answer:** "${userAnswer}"

          **Overall Interview Guidelines for this Context:** ${overallGuidelines || 'No general guidelines provided.'}
          **Key Elements to Evaluate:** ${specificCriteriaPointers || 'No specific key elements defined.'}
          ${redFlagsToAvoid ? `**Common Red Flags to Avoid:** ${redFlagsToAvoid}` : ''}

          Please provide your response as a JSON object with two keys: "overallFeedback" (string) and "detailedFeedback" (string).
          The "overallFeedback" should be a concise summary.
          The "detailedFeedback" should be a more comprehensive text including sections for "Strengths:", "Improvement Areas:", and optionally "Score:".
          Example of detailedFeedback structure:
          "Strengths:\\n- Point 1\\n- Point 2\\n\\nImprovement Areas:\\n- Point 1\\n- Point 2\\n\\nScore: 85/100"
        `;

      //logger.debug('OpenAIService: Constructed internal prompt (partial):', customPrompt.substring(0, 500) + '...');

      // ⭐ Change this line to log the FULL prompt ⭐
      console.log('OpenAIService: Constructed internal prompt:', customPrompt);
      while (retries <= this.maxRetries) {
        try {
          result = await this.client.chat.completions.create({
            model: 'gpt-3.5-turbo-1106', // Ensure this model supports response_format
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert interviewer and feedback provider. Your goal is to help users improve their interview answers by providing structured, actionable, and constructive feedback. Always respond in valid JSON as specified.',
              },
              { role: 'user', content: customPrompt }, // ⭐ Use the internally constructed prompt
            ],
            temperature: 0.5,
            max_tokens: 700,
            response_format: { type: 'json_object' }, // Critical for reliable JSON output
          });

          break;
        } catch (error) {
          if (error.status === 429 || (error.status >= 500 && error.status < 600)) {
            retries++;
            if (retries > this.maxRetries) {
              console.log(
                `OpenAI API call failed after ${this.maxRetries} retries: ${error.message}`
              );
              throw error;
            }
            const delay = this.retryDelay * Math.pow(2, retries - 1);
        console.log(`OpenAI API call failed, retrying in ${delay}ms... (${retries}/${this.maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            console.log(
              `OpenAI API client error: ${error.message} (Status: ${error.status})`
            );
            throw error;
          }
        }
      }

      if (
        !result ||
        !result.choices ||
        !result.choices[0] ||
        !result.choices[0].message ||
        typeof result.choices[0].message.content !== 'string'
      ) {
        console.log('Invalid or unexpected response structure from OpenAI API.');
        throw new Error('Invalid response structure from OpenAI API');
      }

      const feedbackJsonString = result.choices[0].message.content;
      console.log('OpenAI API returned raw JSON string feedback.' , feedbackJsonString);

      return feedbackJsonString;
    } catch (error) {
      console.log(`OpenAI Service error: ${error.message}`);
      throw new Error(`Failed to generate feedback from OpenAI: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();