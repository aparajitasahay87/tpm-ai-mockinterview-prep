    // services/OptimizedPromptBuilder.js

   

    class OptimizedPromptBuilder {
     

      /**
       * Constructs the custom prompt for OpenAI's chat completion API,
       * now including instructions for criteria-specific scoring.
       *
       * @param {string} questionContent - The original interview question text.
       * @param {string} userAnswer - The user's answer to the question.
       * @param {string} overallGuidelines - Overall feedback guidelines from JSONB.
       * @param {string} specificCriteriaPointers - Specific key elements/criteria from JSONB.
       * @param {string} redFlagsToAvoid - Red flags to avoid from JSONB.
       * @returns {string} The complete custom prompt string.
       */
      buildFeedbackPrompt(
        questionContent,
        userAnswer,
        overallGuidelines,
        specificCriteriaPointers,
        redFlagsToAvoid
      ) {
        // Define default criteria if your database doesn't provide weights,
        // or ensure these are passed in from a DB query if you want weighted criteria.
        // For now, assuming specificCriteriaPointers are just names.
        const criteriaList = specificCriteriaPointers.split(',').map(item => item.trim()).filter(item => item !== '');

        const prompt = `
    You are an expert technical interviewer and feedback provider. Your goal is to help users improve their interview answers by providing structured, actionable, and constructive feedback based ONLY on the provided context and criteria.

    **Interview Question:** "${questionContent}"
    **Candidate's Answer:** "${userAnswer}"

    **Overall Interview Guidelines:** ${overallGuidelines || 'No general guidelines provided.'}
    **Key Elements to Evaluate:** ${specificCriteriaPointers || 'No specific key elements defined.'}
    ${redFlagsToAvoid ? `**Common Red Flags to Avoid:** ${redFlagsToAvoid}` : ''}

    Your response must be a JSON object with the following keys:
    1.  \`overallFeedback\`: A concise string summarizing the candidate's overall performance.
    2.  \`score\`: A number (0-100) representing the overall numerical score for the answer. Provide 0 if the answer is too short or irrelevant.
    3.  \`strengthPoints\`: An array of strings, each representing a distinct strength point from the candidate's answer, directly relating to the Key Elements or Overall Guidelines.
    4.  \`improvementAreas\`: An array of strings, each representing a distinct area for improvement, directly relating to the Key Elements, Overall Guidelines, or Red Flags. Focus on actionable advice.
    5.  \`detailedFeedback\`: A string that can be used for display, combining strengths, improvement areas, and the overall score into a readable text format. (e.g., "Strengths:\\n- Point 1\\n\\nImprovement Areas:\\n- Point 1\\n\\nOverall Score: 85")
    6.  \`criteriaScores\`: An object where keys are the names of the criteria (e.g., "Technical Depth", "Communication Clarity") and values are numbers (0-100) indicating the score for that specific criterion. Only include scores for the criteria relevant to the question.

    If the candidate's answer is too short, irrelevant, or cannot be meaningfully evaluated against the criteria:
    -   \`overallFeedback\` should state this clearly.
    -   \`score\` should be 0.
    -   \`strengthPoints\` and \`improvementAreas\` should be empty arrays \`[]\`.
    -   \`detailedFeedback\` should provide a polite message indicating insufficient content.
    -   \`criteriaScores\` should be an empty object \`{}\`.

    Example JSON output:
    {
      "overallFeedback": "The candidate provided a structured answer, demonstrating good grasp of foundational concepts, though lacked depth in specific areas.",
      "score": 75,
      "strengthPoints": [
        "Clearly explained the basic components of X.",
        "Demonstrated a logical thought process for Y."
      ],
      "improvementAreas": [
        "Needs to elaborate on edge cases for Z.",
        "Could provide more concrete examples from practical experience.",
        "Considered the impact of [Red Flag] based on the guidelines."
      ],
      "detailedFeedback": "Strengths:\\n- Clearly explained the basic components of X.\\n- Demonstrated a logical thought process for Y.\\n\\nImprovement Areas:\\n- Needs to elaborate on edge cases for Z.\\n- Could provide more concrete examples from practical experience.\\n- Considered the impact of [Red Flag] based on the guidelines.\\n\\nOverall Score: 75/100",
      "criteriaScores": {
        "Technical Depth": 70,
        "Communication Clarity": 80,
        "Problem Solving": 75,
        "Scalability Considerations": 65
      }
    }
           `;
        // logger.debug('OptimizedPromptBuilder: Constructed prompt:', prompt.substring(0, 500) + '...');
        return prompt;
      }
    }

    module.exports = new OptimizedPromptBuilder();
    