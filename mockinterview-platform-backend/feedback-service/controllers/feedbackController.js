// controllers/feedbackController.js

const openAIService = require('../services/openaiService');
const AIFeedbackProcessor = require('../processors/AIfeedbackProcessor');
const { query } = require('../config/database');
const logger = require('../../shared-lib/logger');

exports.getInterviewFeedback = async (req, res) => {
    const { questionId, userAnswer } = req.body;
     const userId = req.user ? req.user.uid : null;

    logger.info('Backend: Received request for feedback.', { questionId, userAnswer: userAnswer.substring(0, 50) });

    if (!questionId || !userAnswer) {
        logger.error('Backend: Missing questionId or userAnswer.');
        return res.status(400).json({ error: 'Question ID and user answer are required for feedback.' });
    }

    if (!userId) {
        logger.error('Backend: User ID is missing from token. Cannot process feedback request.');
        return res.status(401).json({ error: 'Authentication required: User ID missing.' });
    }

    try {

       // Check user's admin status and feedback count
        logger.info('Backend: Checking user eligibility for AI feedback...');
        
        // Check if user is admin
        const userResult = await query(
            'SELECT isadmin FROM users WHERE uid = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            logger.error('Backend: User not found for ID:', userId);
            return res.status(404).json({ error: 'User not found.' });
        }

        const { isadmin } = userResult.rows[0];

          // Only check feedback limits for non-admin users
        if (isadmin === false) {
            // Check feedback count for regular users only
            const feedbackCountResult = await query(
                'SELECT COUNT(*) as feedback_count FROM ai_feedback WHERE user_id = $1',
                [userId]
            );

            const feedbackCount = parseInt(feedbackCountResult.rows[0].feedback_count);
            
            if (feedbackCount >= 2) {
                logger.warn(`Backend: User ${userId} has already received ${feedbackCount} AI feedbacks. Limit exceeded.`);
                return res.status(403).json({ 
                    error: 'You have reached the maximum limit of 2 AI feedback sessions.' 
                });
            }

         

        logger.info(`Backend: User eligibility confirmed. Current feedback count: ${feedbackCount}/2`);
        } else {
            logger.info(`Backend: Admin user ${userId} detected. No feedback limits applied.`);
        }
         // ⭐ END: User eligibility check

       logger.info('Backend: Attempting to fetch original question and its category from DB...');
const questionResult = await query(
    `SELECT
        content,
        category_id,
        (SELECT name FROM categories WHERE category_id = q.category_id) AS category_name -- <--- CORRECTED LINE HERE
    FROM
        questions q
    WHERE
        question_id = $1`,
    [questionId]
);

        if (questionResult.rows.length === 0) {
            logger.error('Backend: Original question not found for ID:', questionId);
            return res.status(404).json({ error: 'Original question not found to provide feedback context.' });
        }
        const { content: originalQuestionContent, category_id, category_name } = questionResult.rows[0];
        logger.info(`Backend: Question content fetched for category ${category_name}.`);

        logger.info('Backend: Attempting to fetch feedback criteria for category...');
        const categoryCriteriaResult = await query(
            'SELECT feedback_criteria FROM categories WHERE category_id = $1',
            [category_id]
        );
        const fullCategoryCriteria = categoryCriteriaResult.rows[0]?.feedback_criteria || {};
        logger.debug('Backend: Full category criteria (JSONB):', JSON.stringify(fullCategoryCriteria).substring(0, 200) + '...');

        let overallGuidelines = "";
        let specificCriteriaPointers = "";
        let redFlagsToAvoid = "";

        // This section extracts the criteria from the JSONB
        const defaultCriteria = fullCategoryCriteria.default_category_criteria; // Assuming this structure
        if (defaultCriteria) {
            overallGuidelines = defaultCriteria.overall_guidelines || "";
            specificCriteriaPointers = defaultCriteria.key_elements?.join(', ') || "";
            redFlagsToAvoid = defaultCriteria.red_flags?.join(', ') || "";
        }

        // ⭐ CRITICAL: Pass individual prompt components to openAIService.generateFeedback
        logger.info('Backend: Calling OpenAI Service with individual prompt components...');
        const rawAiResponse = await openAIService.generateFeedback(
            originalQuestionContent,
            userAnswer,
            overallGuidelines,
            specificCriteriaPointers,
            redFlagsToAvoid
        );
        logger.debug('Backend: Raw feedback from OpenAI (partial):', rawAiResponse.substring(0, 500) + '...');

        logger.info('Backend: Processing raw feedback...');
        const processedFeedback = AIFeedbackProcessor.processFeedback(rawAiResponse);
        logger.debug('Backend: Processed feedback:', JSON.stringify(processedFeedback).substring(0, 200) + '...');

        // This response structure must remain EXACTLY as the frontend expects.
        // It relies on AIFeedbackProcessor returning { overallFeedback: { rawContent: string }, detailedFeedback: string }
        res.json({
            overallFeedback: processedFeedback.overallFeedback.rawContent,
            detailedFeedback: processedFeedback.detailedFeedback
        });
        logger.info('Backend: Sent processed feedback details to frontend.');

    } catch (error) {
        logger.error('Backend: Caught error during feedback processing:', error);
        if (error.message.includes('Failed to generate feedback')) {
            return res.status(502).json({ error: error.message });
        }
        res.status(500).json({ error: 'Internal server error while generating feedback.' });
    }
};

// The saveUserResponse function remains exactly as it was designed to handle the frontend's string input
// and re-parse it for database storage, fulfilling the "no frontend changes" constraint.
exports.saveUserResponse = async (req, res) => {
    const userId = req.user ? req.user.uid : null;

    const { questionId, userAnswer, overallAiFeedback, detailedAiFeedback } = req.body;

    logger.info('Backend: Received request to save user response and detailed AI feedback.');
    logger.debug({ userId, questionId, userAnswer: userAnswer.substring(0, 50), overallAiFeedback: overallAiFeedback.substring(0, 50), detailedAiFeedback: detailedAiFeedback.substring(0, 50) });

    if (!userId) {
        logger.error('Backend: User ID is missing from token. Cannot save response.');
        return res.status(401).json({ error: 'Authentication required: User ID missing.' });
    }

     const reParsedDetailedFeedback = {
        feedback_content: overallAiFeedback,
        // Call the methods directly on the imported AIFeedbackProcessor instance
        strength_points: AIFeedbackProcessor.extractStrengthPoints(detailedAiFeedback),
        improvement_areas: AIFeedbackProcessor.extractImprovementAreas(detailedAiFeedback),
        score: AIFeedbackProcessor.extractScore(detailedAiFeedback),
        full_detailed_text: detailedAiFeedback
    };

    // Re-instantiate AIFeedbackProcessor to use its parsing methods for DB save
   

    if (!questionId || !userAnswer || !overallAiFeedback || !detailedAiFeedback) {
        logger.error('Backend: Missing required data for saving to ai_feedback. Expected: questionId, userAnswer, overallAiFeedback, detailedAiFeedback (string).');
        return res.status(400).json({ error: 'Missing required data to save response and detailed feedback.' });
    }

    try {
        const { feedback_content, strength_points, improvement_areas, score, full_detailed_text } = reParsedDetailedFeedback;

       const extractedScore = AIFeedbackProcessor.extractScore(detailedAiFeedback);
    const extractedStrengthPoints = AIFeedbackProcessor.extractStrengthPoints(detailedAiFeedback);
    const extractedImprovementAreas = AIFeedbackProcessor.extractImprovementAreas(detailedAiFeedback);

        const insertAiFeedbackQuery = `
            INSERT INTO ai_feedback (
                user_id,
                question_id,
                user_answer,
                feedback_content,
                strength_points,
                improvement_areas,
                score,
                full_detailed_text,
                generated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING feedback_id;
        `;

        const aiFeedbackValues = [
            userId,
            questionId,
            userAnswer,
            feedback_content,
            //strengthsString,
            //improvementsString,
           // JSON.stringify(strength_points),
           // JSON.stringify(improvement_areas),
             extractedStrengthPoints,   // <--- This should be a JS Array, directly
        extractedImprovementAreas, 
        extractedScore,
            //score,
            full_detailed_text
        ];

        logger.info('Backend: Attempting to save data to ai_feedback table...');
        const result = await query(insertAiFeedbackQuery, aiFeedbackValues);
        const newFeedbackId = result.rows[0].feedback_id;
        logger.info('Backend: Data saved to ai_feedback. New feedback_id:', newFeedbackId);

        res.status(201).json({
            message: 'Feedback and user response saved successfully to ai_feedback table',
            feedbackId: newFeedbackId
        });

    } catch (error) {
        console.log('Backend: Error saving to ai_feedback table:', error);
        console.log('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        res.status(500).json({ error: 'Internal server error while saving feedback.' });
    }
};