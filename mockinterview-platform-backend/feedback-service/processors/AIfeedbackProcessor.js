const logger = require('../../shared-lib/logger'); // Assuming your logger path is correct

class AIFeedbackProcessor {
  /**
   * Processes the raw feedback data from OpenAI (which is a JSON string).
   *
   * @param {string} rawAiResponse - The raw feedback string from OpenAIService (expected to be a JSON string).
   * @returns {Object} - The processed feedback object for frontend display AND for database saving.
   * - For Frontend display: { overallFeedback: { rawContent: string }, detailedFeedback: string }
   * - For Database saving: (accessible via processedStructure.detailedFeedbackForDb)
   * { feedback_content: string, strength_points: string[], improvement_areas: string[], score: number|null, full_detailed_text: string }
   */
  processFeedback(rawAiResponse) {
    let parsedJson;

    try {
      // ⭐ CRITICAL CHANGE: Parse the raw string response from OpenAI
      parsedJson = JSON.parse(rawAiResponse);
    } catch (e) {
      logger.error(`AIFeedbackProcessor: Failed to parse raw AI response as JSON: ${e.message}. Raw response: ${rawAiResponse}`);
      // Return a default structure consistent with what's expected, even on error
      return this.getDefaultErrorFeedback('Invalid AI response format.');
    }

    // Validate the expected structure from the AI's JSON output
    if (!parsedJson || typeof parsedJson.overallFeedback !== 'string' || typeof parsedJson.detailedFeedback !== 'string') {
      logger.error(`AIFeedbackProcessor: Parsed JSON is missing expected string keys 'overallFeedback' or 'detailedFeedback'. Parsed: ${JSON.stringify(parsedJson)}`);
      return this.getDefaultErrorFeedback('AI response missing expected feedback keys.');
    }

    // ⭐ CORRECT SOURCE: overallFeedbackText comes from parsedJson.overallFeedback
    const overallFeedbackText = parsedJson.overallFeedback;
    // ⭐ CORRECT SOURCE: detailedFeedbackRawText comes from parsedJson.detailedFeedback
    const detailedFeedbackRawText = parsedJson.detailedFeedback; // This is the comprehensive text from the AI

    // Extract specific data points for your database fields from detailedFeedbackRawText
    const score = this.extractScore(detailedFeedbackRawText);
    const strengthPoints = this.extractStrengthPoints(detailedFeedbackRawText);
    const improvementAreas = this.extractImprovementAreas(detailedFeedbackRawText);

    // ⭐ STEP 1: Create the structured object for database saving (and internal use)
    const detailedFeedbackForDb = {
      feedback_content: overallFeedbackText, // Typically the overall summary for the main content field
      strength_points: strengthPoints,
      improvement_areas: improvementAreas,
      score: score,
      full_detailed_text: detailedFeedbackRawText // Store the AI's full detailed output here for flexibility
    };

    // ⭐ STEP 2: Create a SINGLE STRING for the frontend's 'detailedFeedback' field
    // This synthesizes the detailed points into a human-readable string for display.
    let detailedFeedbackForFrontend = '';
    if (strengthPoints.length > 0) {
      detailedFeedbackForFrontend += 'Strengths:\n' + strengthPoints.map(p => `- ${p}`).join('\n') + '\n\n';
    }
    if (improvementAreas.length > 0) {
      detailedFeedbackForFrontend += 'Areas for Improvement:\n' + improvementAreas.map(p => `- ${p}`).join('\n') + '\n\n';
    }
    if (score !== null) {
      detailedFeedbackForFrontend += `Score: ${score}\n`;
    }
    // Fallback if no specific points were extracted
    if (!detailedFeedbackForFrontend.trim() && detailedFeedbackRawText.trim()) {
        detailedFeedbackForFrontend = detailedFeedbackRawText.trim();
    } else if (!detailedFeedbackForFrontend.trim()) {
        detailedFeedbackForFrontend = "Detailed feedback was not available.";
    }


    // This is the final object returned by processFeedback.
    // It is shaped to match what your `feedbackController.js` sends to the frontend.
    const processedStructure = {
      // This matches `overallFeedback: processedFeedback.overallFeedback.rawContent` in controller
      overallFeedback: {
        rawContent: overallFeedbackText,
        // These fields are derived from `overallFeedbackText` for the frontend's use.
        summary: this.extractSummary(overallFeedbackText),
        detailedPoints: this.extractDetailedPoints(overallFeedbackText),
        suggestions: this.extractSuggestions(overallFeedbackText),
        sentiment: this.analyzeSentiment(overallFeedbackText),
      },
      // This matches `detailedFeedback: processedFeedback.detailedFeedback` in controller
      // Frontend now receives a string here.
      detailedFeedback: detailedFeedbackForFrontend
    };

    // Attach the structured data for DB saving as a *new property* to the returned object.
    // This allows `feedbackController.js` to access it separately for the `saveUserResponse` call.
    processedStructure.detailedFeedbackForDb = detailedFeedbackForDb;

    logger.info('AIFeedbackProcessor: Successfully processed AI feedback.');
    return processedStructure;
  }

  // --- Helper for consistent error handling ---
  getDefaultErrorFeedback(message) {
    const defaultText = `Error: ${message || 'No feedback generated.'}`;
    return {
      overallFeedback: { rawContent: defaultText }, // Matches frontend expected object
      detailedFeedback: defaultText, // Matches frontend expected string
      detailedFeedbackForDb: { // Provides fallback for DB saving
        feedback_content: defaultText,
        strength_points: [],
        improvement_areas: [],
        score: null,
        full_detailed_text: defaultText
      }
    };
  }

  // --- Helper Methods for overallFeedback (these parse overallFeedbackText) ---
  extractSummary(feedbackText) {
    const sentences = feedbackText.split(/[\.\?\!]\s+/);
    return sentences.length > 1 ? sentences.slice(0, 2).join('. ') + '.' : feedbackText;
  }

  extractDetailedPoints(feedbackText) {
    // This is for the overallFeedback.detailedPoints, not the core detailed feedback
    const points = feedbackText.split('\n').filter(line => line.trim() !== '' && !line.toLowerCase().startsWith('overall'));
    return points.map(point => point.trim());
  }

  extractSuggestions(feedbackText) {
    const suggestions = [];
    const lowerCaseText = feedbackText.toLowerCase();
    const suggestionKeywords = ["suggest", "recommend", "consider", "try", "perhaps"];
    feedbackText.split(/[\.\?\!]\s+/).forEach(sentence => {
      if (suggestionKeywords.some(keyword => lowerCaseText.includes(keyword))) {
        suggestions.push(sentence.trim());
      }
    });
    return suggestions;
  }

  analyzeSentiment(feedbackText) {
    if (feedbackText.toLowerCase().includes("good") || feedbackText.toLowerCase().includes("strong")) {
      return "Positive";
    } else if (feedbackText.toLowerCase().includes("weak") || feedbackText.toLowerCase().includes("could improve")) {
      return "Needs Improvement";
    } else {
      return "Neutral";
    }
  }

  // --- Helper Methods for Database Fields (these parse detailedFeedbackRawText) ---
  // ⭐ IMPORTANT: These now correctly parse the `detailedFeedbackRawText` received from OpenAI.
  extractScore(feedbackText) {
    const scoreMatch = feedbackText.match(/Score:\s*(\d+)(?:\/\d+)?/i); // Matches "Score: 85" or "Score: 85/100"
    return scoreMatch ? parseInt(scoreMatch[1], 10) : null;
  }

  extractStrengthPoints(feedbackText) {
    const match = feedbackText.match(/Strengths:\s*\n([\s\S]*?)(?=\n\nImprovement Areas:|\nScore:|$)/i);
    if (match && match[1]) {
      return match[1].split('\n')
                     .map(s => s.trim().replace(/^[\*\-\d\.\s]*\s*/, '')) // Remove common bullet points
                     .filter(s => s.length > 0);
    }
    return [];
  }

  extractImprovementAreas(feedbackText) {
    const match = feedbackText.match(/Improvement Areas:\s*\n([\s\S]*?)(?=\nScore:|$)/i);
    if (match && match[1]) {
      return match[1].split('\n')
                     .map(s => s.trim().replace(/^[\*\-\d\.\s]*\s*/, '')) // Remove common bullet points
                     .filter(s => s.length > 0);
    }
    return [];
  }
}

module.exports = new AIFeedbackProcessor();