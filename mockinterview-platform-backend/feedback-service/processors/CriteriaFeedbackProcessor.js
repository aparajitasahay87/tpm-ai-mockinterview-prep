// processors/CriteriaFeedbackProcessor.js

// const logger = require('../../shared-lib/logger'); // Removed: No logger module available

class CriteriaFeedbackProcessor {
  /**
   * Processes the raw feedback data from OpenAI, which includes criteria-specific scoring.
   *
   * @param {string} rawAiResponse - The raw feedback string from OpenAIService (expected to be a JSON string).
   * @returns {Object} - The processed feedback object for frontend display AND for database saving.
   * - For Frontend display: { overallFeedback: { rawContent: string, summary: string, detailedPoints: string[], suggestions: string[], sentiment: string }, detailedFeedback: string }
   * - For Database saving: { feedback_content: string, strength_points: string[], improvement_areas: string[], score: number|null, full_detailed_text: string, criteria_scores: object, weighted_score: number|null }
   */
  processFeedback(rawAiResponse) {
    let parsedJson;

    try {
      parsedJson = JSON.parse(rawAiResponse);
    } catch (e) {
      console.error(`CriteriaFeedbackProcessor: Failed to parse AI response: ${e.message}. Raw: ${rawAiResponse}`); // Changed to console.error
      return this.getDefaultErrorFeedback('Invalid AI response format.');
    }

    // Enhanced validation for criteria-based responses
    if (!this.isValidCriteriaResponse(parsedJson)) {
      console.error(`CriteriaFeedbackProcessor: Invalid criteria response structure: ${JSON.stringify(parsedJson)}`); // Changed to console.error
      return this.getDefaultErrorFeedback('AI response missing required criteria fields or invalid types.');
    }

    // ⭐ Extract data directly from the parsed JSON, which now contains structured fields
    const overallFeedbackText = parsedJson.overallFeedback;
    const score = parsedJson.score; // Now a number
    const strengthPoints = parsedJson.strengthPoints || []; // Now an array
    const improvementAreas = parsedJson.improvementAreas || []; // Now an array
    const detailedFeedbackRawText = parsedJson.detailedFeedback; // This is the combined string
    const criteriaScores = parsedJson.criteriaScores || {}; // Now an object

    const weightedScore = this.calculateWeightedScore(criteriaScores); // Assuming no external weights needed for now

    // Prepare the structure for frontend display
    const processedStructureForFrontend = {
      overallFeedback: {
        rawContent: overallFeedbackText,
        summary: overallFeedbackText, // Or extract first couple of sentences if 'summary' is meant to be shorter
        detailedPoints: [...strengthPoints, ...improvementAreas], // Combine for a general "detailed points" list
        suggestions: improvementAreas, // Treating improvement areas as suggestions for now
        sentiment: this.getSentimentFromScore(score)
      },
      detailedFeedback: detailedFeedbackRawText // Use the AI's pre-formatted string for display
    };

    // Prepare the structured object for database saving
    processedStructureForFrontend.detailedFeedbackForDb = {
      feedback_content: overallFeedbackText,
      strength_points: strengthPoints,
      improvement_areas: improvementAreas,
      score: score, // Store the numeric score
      full_detailed_text: detailedFeedbackRawText, // Store the AI's full formatted string for display
      criteria_scores: criteriaScores, // Store the object of criteria scores
      weighted_score: weightedScore // Store the calculated weighted score
    };

    console.log('CriteriaFeedbackProcessor: Successfully processed criteria-based AI feedback.'); // Changed to console.log
    return processedStructureForFrontend;
  }

  /**
   * Enhanced validation for criteria-based responses.
   * Checks for essential top-level keys and their expected types.
   */
  isValidCriteriaResponse(response) {
    const basicValid = response &&
                       typeof response.overallFeedback === 'string' &&
                       typeof response.score === 'number' && // Expecting a number
                       Array.isArray(response.strengthPoints) &&
                       Array.isArray(response.improvementAreas) &&
                       typeof response.detailedFeedback === 'string'; // Still expecting a string for display

    // Additional validation for criteria scores
    const criteriaValid = typeof response.criteriaScores === 'object' && response.criteriaScores !== null;

    // Check if score is within expected range (0-100)
    const scoreRangeValid = response.score >= 0 && response.score <= 100;

    return basicValid && criteriaValid && scoreRangeValid;
  }

  /**
   * Calculate weighted score based on criteria importance.
   * Assumes criteriaWeights are passed if specific weights are needed.
   * For now, assumes all criteria have a weight of 1 if no external weights are provided.
   */
  calculateWeightedScore(criteriaScores, criteriaWeights = {}) {
    if (!criteriaScores || Object.keys(criteriaScores).length === 0) {
      return null;
    }
    let totalScore = 0;
    let totalWeight = 0;
    Object.entries(criteriaScores).forEach(([criterion, score]) => {
      // Ensure score is a valid number before using it
      if (typeof score === 'number' && !isNaN(score)) {
        const weight = criteriaWeights[criterion] || 1; // Default weight of 1
        totalScore += score * weight;
        totalWeight += weight;
      }
    });
    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : null;
  }

  /**
   * Determine sentiment based on score thresholds.
   */
  getSentimentFromScore(score) {
    if (score === null) return "N/A"; // Handle case where score isn't available
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 60) return "Satisfactory";
    if (score >= 50) return "Needs Improvement";
    return "Poor";
  }

  /**
   * Enhanced error feedback with criteria structure.
   */
  getDefaultErrorFeedback(message) {
    const defaultText = `Error: ${message}`;
    return {
      overallFeedback: {
        rawContent: defaultText,
        summary: defaultText,
        detailedPoints: [],
        suggestions: [],
        sentiment: "Error"
      },
      detailedFeedback: defaultText,
      detailedFeedbackForDb: {
        feedback_content: defaultText,
        strength_points: [],
        improvement_areas: [],
        score: null,
        full_detailed_text: defaultText,
        criteria_scores: {},
        weighted_score: null
      }
    };
  }
  // The generateCriteriaReport function from your input is a great helper,
  // but it's not directly part of the `processFeedback` return structure.
  // It would be called separately if you need to generate a specific report.
  // For now, I'm keeping the core `processFeedback` focused on transforming AI output.
}

module.exports = new CriteriaFeedbackProcessor();
