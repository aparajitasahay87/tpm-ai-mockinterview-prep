const openAIService = require('../services/openaiService');
const AIFeedbackProcessor = require('../processors/AIfeedbackProcessor');
const { query } = require('../config/database');

exports.getInterviewFeedback = async (req, res) => {
    const { questionId, userAnswer } = req.body;
    const userId = req.user ? req.user.uid : null;

    console.log('Backend: Received request for feedback.', { questionId, userAnswer: userAnswer.substring(0, 50) });

    if (!questionId || !userAnswer) {
        console.log('Backend: Missing questionId or userAnswer.');
        return res.status(400).json({ error: 'Question ID and user answer are required for feedback.' });
    }

    if (!userId) {
        console.log('Backend: User ID is missing from token. Cannot process feedback request.');
        return res.status(401).json({ error: 'Authentication required: User ID missing.' });
    }

    try {
        // Check user's admin status and feedback count
        console.log('Backend: Checking user eligibility for AI feedback...');

        // Check if user is admin
        const userResult = await query(
            'SELECT isadmin FROM users WHERE uid = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            console.log('Backend: User not found for ID:', userId);
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
                console.log(`Backend: User ${userId} has already received ${feedbackCount} AI feedbacks. Limit exceeded.`);
                return res.status(403).json({
                    error: 'You have reached the maximum limit of 2 AI feedback sessions.'
                });
            }

            console.log(`Backend: User eligibility confirmed. Current feedback count: ${feedbackCount}/2`);
        } else {
            console.log(`Backend: Admin user ${userId} detected. No feedback limits applied.`);
        }
        // ⭐ END: User eligibility check

        console.log('Backend: Attempting to fetch original question and its category from DB...');
        const questionResult = await query(
            `SELECT
                content,
                category_id,
                (SELECT name FROM categories WHERE category_id = q.category_id) AS category_name
            FROM
                questions q
            WHERE
                question_id = $1`,
            [questionId]
        );

        if (questionResult.rows.length === 0) {
            console.log('Backend: Original question not found for ID:', questionId);
            return res.status(404).json({ error: 'Original question not found to provide feedback context.' });
        }
        const { content: originalQuestionContent, category_id, category_name } = questionResult.rows[0];
        console.log(`Backend: Question content fetched for category ${category_name}.`);

        console.log('Backend: Attempting to fetch feedback criteria for category...');
        const categoryCriteriaResult = await query(
            'SELECT feedback_criteria FROM categories WHERE category_id = $1',
            [category_id]
        );
        const fullCategoryCriteria = categoryCriteriaResult.rows[0]?.feedback_criteria || {};
        console.log('Backend: Full category criteria (JSONB):', JSON.stringify(fullCategoryCriteria).substring(0, 200) + '...');

        let overallGuidelines = "";
        let specificCriteriaPointers = "";
        let redFlagsToAvoid = "";

        // This section extracts the criteria from the JSONB
        const defaultCriteria = fullCategoryCriteria.default_category_criteria;
        if (defaultCriteria) {
            overallGuidelines = defaultCriteria.overall_guidelines || "";
            specificCriteriaPointers = defaultCriteria.key_elements?.join(', ') || "";
            redFlagsToAvoid = defaultCriteria.red_flags?.join(', ') || "";
        }

        // ⭐ CRITICAL: Pass individual prompt components to openAIService.generateFeedback
        console.log('Backend: Calling OpenAI Service with individual prompt components...');
        const rawAiResponse = await openAIService.generateFeedback(
            originalQuestionContent,
            userAnswer,
            overallGuidelines,
            specificCriteriaPointers,
            redFlagsToAvoid
        );
        console.log('Backend: Raw feedback from OpenAI (partial):', rawAiResponse.substring(0, 500) + '...');

        console.log('Backend: Processing raw feedback...');
        const processedFeedback = AIFeedbackProcessor.processFeedback(rawAiResponse);
        console.log('Backend: Processed feedback:', JSON.stringify(processedFeedback).substring(0, 200) + '...');

        // This response structure must remain EXACTLY as the frontend expects.
        // It relies on AIFeedbackProcessor returning { overallFeedback: { rawContent: string }, detailedFeedback: string }
        res.json({
            overallFeedback: processedFeedback.overallFeedback.rawContent,
            detailedFeedback: processedFeedback.detailedFeedback
        });
        console.log('Backend: Sent processed feedback details to frontend.');

    } catch (error) {
        console.log('Backend: Caught error during feedback processing:', error);
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

    console.log('Backend: Received request to save user response and detailed AI feedback.');
    console.log({ userId, questionId, userAnswer: userAnswer.substring(0, 50), overallAiFeedback: overallAiFeedback.substring(0, 50), detailedAiFeedback: detailedAiFeedback.substring(0, 50) });

    if (!userId) {
        console.log('Backend: User ID is missing from token. Cannot save response.');
        return res.status(401).json({ error: 'Authentication required: User ID missing.' });
    }

    if (!questionId || !userAnswer || !overallAiFeedback || !detailedAiFeedback) {
        console.log('Backend: Missing required data for saving to ai_feedback. Expected: questionId, userAnswer, overallAiFeedback, detailedAiFeedback (string).');
        return res.status(400).json({ error: 'Missing required data to save response and detailed feedback.' });
    }

    try {
        // These extractions are performed correctly before the database insert
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
            overallAiFeedback,
            extractedStrengthPoints,
            extractedImprovementAreas,
            extractedScore,
            detailedAiFeedback
        ];

        console.log('Backend: Attempting to save data to ai_feedback table...');
        const result = await query(insertAiFeedbackQuery, aiFeedbackValues);
        const newFeedbackId = result.rows[0].feedback_id;
        console.log('Backend: Data saved to ai_feedback. New feedback_id:', newFeedbackId);

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