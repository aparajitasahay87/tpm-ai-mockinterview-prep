// Backend (Node.js) - enhancedTextPreprocessor.js
const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify'); // For XSS sanitization

/**
 * @class EnhancedTextPreprocessor
 * @description Provides robust text preprocessing functionalities
 * for user input, focusing on security, context preservation,
 * and OpenAI API token optimization.
 */
class EnhancedTextPreprocessor {
    constructor() {
        // Patterns for OpenAI token optimization (based on common inefficiencies)
        this.openAITokenPatterns = {
            // Redundant filler words that waste tokens
            redundantWords: [
                'um', 'uh', 'hmm', 'err', 'ah', 'oh', 'well',
                'like', 'you know', 'i mean', 'basically', 'actually', 'literally',
                'sort of', 'kind of', 'more or less', 'pretty much', 'so to speak',
                'let me see', 'let me think', 'how do i put this', 'what i mean is'
            ],

            // Verbose phrases that can be simplified
            verbosePhrases: [
                { pattern: /\bin order to\b/gi, replacement: 'to' },
                { pattern: /\bdue to the fact that\b/gi, replacement: 'because' },
                { pattern: /\bat this point in time\b/gi, replacement: 'now' },
                { pattern: /\bin the event that\b/gi, replacement: 'if' },
                { pattern: /\bfor the purpose of\b/gi, replacement: 'to' },
                { pattern: /\bwith regard to\b/gi, replacement: 'about' },
                { pattern: /\bin spite of the fact that\b/gi, replacement: 'although' },
                { pattern: /\bby means of\b/gi, replacement: 'by' },
                { pattern: /\bin the process of\b/gi, replacement: 'while' },
                { pattern: /\bas a matter of fact\b/gi, replacement: 'actually' },
                { pattern: /\bit goes without saying\b/gi, replacement: '' }, // Often truly redundant
                { pattern: /\bneedless to say\b/gi, replacement: '' },
                { pattern: /\bthe thing is that\b/gi, replacement: '' },
                { pattern: /\bwhat i want to say is\b/gi, replacement: '' },
                { pattern: /\bat the end of the day\b/gi, replacement: 'ultimately' },
                { pattern: /\bfirst and foremost\b/gi, replacement: 'first' },
                { pattern: /\beach and every\b/gi, replacement: 'every' },
                { pattern: /\bone and only\b/gi, replacement: 'only' },
                { pattern: /\bup until\b/gi, replacement: 'until' },
                { pattern: /\bover and over\b/gi, replacement: 'repeatedly' }
            ],

            // Redundant intensifiers that can be simplified or removed
            intensifiers: [
                { pattern: /\b(really|very|quite|pretty|fairly|rather|somewhat)\s+(really|very|quite|pretty|fairly|rather|somewhat)\b/gi, replacement: '$2' },
                { pattern: /\b(extremely|incredibly|absolutely|totally|completely)\s+(extremely|incredibly|absolutely|totally|completely)\b/gi, replacement: '$2' },
                { pattern: /\btotally completely\b/gi, replacement: 'completely' },
                { pattern: /\babsolutely definitely\b/gi, replacement: 'definitely' }
            ]
        };

        // Patterns to help preserve conversational and narrative context
        this.contextPatterns = {
            narrativeMarkers: [
                'first', 'second', 'third', 'then', 'next', 'finally', 'meanwhile',
                'however', 'therefore', 'consequently', 'moreover', 'furthermore',
                'in contrast', 'on the other hand', 'as a result', 'in conclusion'
            ],

            emotionalMarkers: [
                'suddenly', 'surprisingly', 'unfortunately', 'fortunately', 'clearly',
                'obviously', 'apparently', 'evidently', 'certainly', 'definitely'
            ],

            // Question patterns to ensure questions aren't over-optimized
            questionPatterns: [
                /\b(who|what|when|where|why|how)\b/gi,
                /\b(can|could|would|should|will|shall)\s+\w+/gi
            ]
        };

        // Security patterns for detecting malicious input
        this.securityPatterns = {
            sql: [
                // Common SQL injection keywords
                /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|TRUNCATE|GRANT|REVOKE)\b)/gi, // Added more SQL DDL/DCL
                /(--|\/\*|\*\/)/g, // SQL comments
                // ⭐ MODIFIED: Removed the overly broad /\s*(OR|AND)/ pattern.
                // We're now focusing on combinations that are highly suspicious,
                // relying on parameterized queries for the primary defense.
                /(\s*(OR|AND)\s*\d+\s*=\s*\d+)/gi, // "OR 1=1"
                /(\s*(OR|AND)\s*[a-zA-Z0-9_]+\s*=\s*[a-zA-Z0-9_]+)/gi, // "OR username=username"
                /(\bWAITFOR\s+DELAY\b|\bSLEEP\b)/gi, // Time-based blind SQLi
                /(\bXP_CMDSHELL\b|\bSP_EXECUTESQL\b|\bEXECUTE\s+AS\b|\bRECONFIGURE\b)/gi, // Stored procedures and dangerous commands
                /(\bINTO\s+OUTFILE\b|\bLOAD_FILE\b)/gi, // File operations
                /(\bCAST\b|\bCONVERT\b)\s*\(.*?\s*AS\s*(N)?VARCHAR\b/gi, // Type conversion in context
                /(\b(char|nchar|varchar|nvarchar|string|text|binary|varbinary|blob|image)\b\s*\(?\s*\d*\s*\)?\s*(FROM|FOR)\s+(CHAR|ASCII|HEX)\b)/gi, // Obfuscated strings
                /(\bFROM\s+INFORMATION_SCHEMA\b|\bSYSOBJECTS\b|\bPG_CATALOG\b)/gi, // Schema discovery
                /(\bORDER\s+BY\s+\d+#|\bORDER\s+BY\s+\d+--)/gi // Order by injection
            ],
            xss: [
                // Basic XSS vectors (more comprehensive sanitization happens with DOMPurify)
                /<script[^>]*>.*?<\/script>/gis, // Script tags
                /javascript:/gi, // Javascript URIs
                /on\w+\s*=/gi, // Event handlers (e.g., onerror=, onload=)
                /<iframe[^>]*>.*?<\/iframe>/gis, // Iframes for content injection
                /<img[^>]*src\s*=\s*['"]?javascript:/gi, // Image XSS
                /expression\(/gi, // CSS expressions
                /data:[^;]*;base64,/gi // Base64 encoded data URIs (can be XSS vector)
            ],
            command: [
                // Command injection attempts
                /(\||&|\$\(|\`|;)/g, // Shell metacharacters (pipe, ampersand, dollar-parentheses, backtick, semicolon)
                /(rm\s+-rf|del\s+\/f|format\s+)/gi, // Destructive commands
                /(wget|curl)\s+http/gi, // External command execution
                /(cat|ls|dir)\s+/gi, // Information disclosure commands
                /(\bSH\b|\bBASH\b|\bCMD\b|\bPOWERSHELL\b)/gi // Explicit shell calls
            ]
        };

        // Advanced token optimization patterns for more aggressive reduction
        this.tokenOptimization = {
            compressionRules: [
                // Convert passive to active voice indicators (simplified for common patterns)
                { pattern: /\bwas\s+(\w+ed)\s+by\b/gi, replacement: (match, verb) => `${verb.slice(0, -2)}` },

                // Simplify existential constructions (e.g., "there is a problem" -> "a problem")
                { pattern: /\bthere\s+(is|are|was|were)\s+(a|an|the)?\s*(\w+)\s+(that|who|which|where)\b/gi, replacement: '$3' },

                // Remove redundant "that" clauses (e.g., "I believe that he..." -> "I believe he...")
                { pattern: /\b(believe|think|feel|know|realize|understand)\s+that\b/gi, replacement: '$1' },

                // Simplify temporal expressions
                { pattern: /\bat the same time\b/gi, replacement: 'simultaneously' },
                { pattern: /\bduring the time that\b/gi, replacement: 'while' },
                { pattern: /\bin the course of\b/gi, replacement: 'during' },

                // Remove redundant articles in lists (simple case)
                { pattern: /\b(a|an|the)\s+(\w+),\s*(a|an|the)\s+(\w+),\s*and\s*(a|an|the)\s+(\w+)\b/gi, replacement: '$2, $4, and $6' }
            ],

            // Word-level optimizations (replacing long words with shorter equivalents)
            wordOptimizations: [
                { pattern: /\butilize\b/gi, replacement: 'use' },
                { pattern: /\bdemonstrate\b/gi, replacement: 'show' },
                { pattern: /\bfacilitate\b/gi, replacement: 'help' },
                { pattern: /\baccommodate\b/gi, replacement: 'fit' },
                { pattern: /\binitiate\b/gi, replacement: 'start' },
                { pattern: /\bterminate\b/gi, replacement: 'end' },
                { pattern: /\bsubsequent\b/gi, replacement: 'next' },
                { pattern: /\bprevious\b/gi, replacement: 'last' },
                { pattern: /\badditional\b/gi, replacement: 'more' },
                { pattern: /\bnumerous\b/gi, replacement: 'many' },
                { pattern: /\bsubstantial\b/gi, replacement: 'large' },
                { pattern: /\bsignificant\b/gi, replacement: 'major' },
                { pattern: /\bapproximate\b/gi, replacement: 'about' },
                { pattern: /\bequivalent\b/gi, replacement: 'equal' }
            ]
        };
    }

    /**
     * Estimates OpenAI tokens based on a heuristic.
     * Note: For precise token counting, use OpenAI's `tiktoken` library.
     * @param {string} text The input text.
     * @returns {object} Character count, word count, estimated tokens, and token density.
     */
    calculateOpenAITokens(text) {
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        let tokenCount = 0;

        for (const word of words) {
            // Heuristic: common words are often 1 token, longer words might be more.
            // Punctuation often adds partial or full tokens.
            if (word.length <= 4 && /^[a-zA-Z]+$/.test(word)) {
                tokenCount += 1;
            } else if (word.length <= 8) {
                tokenCount += 1.2; // Slightly more for longer words
            } else {
                tokenCount += Math.ceil(word.length / 4); // More aggressive for very long words
            }

            const punctuationCount = (word.match(/[.,!?;:()[\]{}'"]/g) || []).length;
            tokenCount += punctuationCount * 0.7; // Estimate punctuation cost
        }

        return {
            characters: text.length,
            words: words.length,
            estimatedTokens: Math.round(tokenCount),
            tokenDensity: text.length > 0 ? (tokenCount / text.length * 100).toFixed(2) : 0
        };
    }

    /**
     * Detects potential security threats (SQLi, XSS, Command Injection) in the text.
     * @param {string} text The input text to check.
     * @returns {object} An object containing arrays of detected threats by type.
     */
    detectSecurityThreats(text) {
        const threats = { sql: [], xss: [], command: [] };

        Object.entries(this.securityPatterns).forEach(([type, patterns]) => {
            patterns.forEach(pattern => {
                const matches = text.match(pattern);
                if (matches) threats[type].push(...matches);
            });
        });

        return threats;
    }

    /**
     * Sanitizes the text to mitigate security vulnerabilities.
     * Primarily focuses on HTML escaping and removal of common injection patterns.
     * Note: SQL injection is primarily prevented by parameterized queries at the DB level.
     * @param {string} text The text to sanitize.
     * @returns {string} The sanitized text.
     */
    sanitizeForSecurity(text) {
        // Use validator.escape for HTML entity escaping (prevents basic XSS)
        let sanitizedText = validator.escape(text);

        // Use DOMPurify for more robust HTML sanitization, stripping all tags
        // This is crucial if there's any chance the input will be rendered in HTML
        sanitizedText = DOMPurify.sanitize(sanitizedText, {
            ALLOWED_TAGS: [], // No HTML tags allowed
            ALLOWED_ATTR: []  // No HTML attributes allowed
        });

        // Remove more explicit injection patterns that might bypass initial escaping
        sanitizedText = sanitizedText.replace(/\b(UNION\s+SELECT|DROP\s+TABLE|DELETE\s+FROM)\b/gi, '');
        sanitizedText = sanitizedText.replace(/<script[^>]*>.*?<\/script>/gis, '');
        sanitizedText = sanitizedText.replace(/javascript:/gi, '');
        // Remove common shell metacharacters if the text is ever used in a shell context
        sanitizedText = sanitizedText.replace(/[\|&;`\$]\s*\w+/g, ' ');

        return sanitizedText;
    }

    /**
     * Removes filler words, verbose phrases, and redundant intensifiers
     * while attempting to preserve the original context and meaning.
     * @param {string} text The input text.
     * @returns {string} The text with noise removed.
     */
    removeNoisePreserveContext(text) {
        // Step 1: Normalize unicode for consistent processing
        let processedText = text.normalize('NFKD');

        // Step 2: Remove filler words but preserve narrative flow where possible
        this.openAITokenPatterns.redundantWords.forEach(filler => {
            // Use regex for whole word matching to avoid partial replacements
            const regex = new RegExp(`\\b${filler.replace(/\s+/g, '\\s+')}\\b`, 'gi');
            processedText = processedText.replace(regex, ' ');
        });

        // Step 3: Apply verbose phrase simplifications
        this.openAITokenPatterns.verbosePhrases.forEach(({ pattern, replacement }) => {
            processedText = processedText.replace(pattern, replacement);
        });

        // Step 4: Remove redundant intensifiers
        this.openAITokenPatterns.intensifiers.forEach(({ pattern, replacement }) => {
            processedText = processedText.replace(pattern, replacement);
        });

        // Step 5: Clean up spacing. Replace multiple spaces with single space.
        // Also remove spaces before punctuation and combine multiple punctuation.
        processedText = processedText.replace(/\s+/g, ' ');
        processedText = processedText.replace(/\s+([.!?])/g, '$1');
        processedText = processedText.replace(/([.!?])\s*([.!?])/g, '$1$2');

        return processedText.trim();
    }

    /**
     * Optimizes sentence structure and meaning by applying compression rules
     * and word-level optimizations. This is more aggressive than `removeNoisePreserveContext`.
     * @param {string} text The input text.
     * @returns {string} The optimized text.
     */
    preserveStructureAndMeaning(text) {
        // Split text into sentences for more granular processing
        // This regex splits by sentence-ending punctuation while keeping the punctuation
        const sentences = text.split(/([.!?]+|\n+)/).filter(s => s.trim());
        const processedSentences = [];

        for (let i = 0; i < sentences.length; i += 2) {
            let sentence = sentences[i]?.trim();
            const punctuation = sentences[i + 1] || ''; // Capture the punctuation/newline

            if (sentence) {
                // Determine if sentence is "important" (question, narrative, emotional)
                const isImportant =
                    this.contextPatterns.questionPatterns.some(pattern => pattern.test(sentence)) ||
                    this.contextPatterns.narrativeMarkers.some(marker => sentence.toLowerCase().includes(marker.toLowerCase())) ||
                    this.contextPatterns.emotionalMarkers.some(marker => sentence.toLowerCase().includes(marker.toLowerCase()));

                if (isImportant) {
                    // For important sentences, just normalize spacing
                    sentence = sentence.replace(/\s+/g, ' ').trim();
                } else {
                    // For less critical sentences, apply more aggressive optimization
                    sentence = this.optimizeSentenceTokens(sentence);
                }

                processedSentences.push(sentence + punctuation);
            }
        }
        return processedSentences.join(' ').replace(/\s*\n\s*/g, '\n').replace(/\n{3,}/g, '\n\n'); // Normalize line breaks
    }

    /**
     * Applies aggressive token optimization for non-critical sentences.
     * This function is called by `preserveStructureAndMeaning` for specific cases.
     * @param {string} sentence The sentence to optimize.
     * @returns {string} The aggressively optimized sentence.
     */
    optimizeSentenceTokens(sentence) {
        let optimizedSentence = sentence;

        // Apply compression rules
        this.tokenOptimization.compressionRules.forEach(({ pattern, replacement }) => {
            optimizedSentence = optimizedSentence.replace(pattern, replacement);
        });

        // Apply word-level optimizations
        this.tokenOptimization.wordOptimizations.forEach(({ pattern, replacement }) => {
            optimizedSentence = optimizedSentence.replace(pattern, replacement);
        });

        // Remove truly redundant words/phrases after other optimizations
        optimizedSentence = optimizedSentence.replace(/\b(that|which|who)\s+(is|are|was|were)\b/gi, '');
        optimizedSentence = optimizedSentence.replace(/\b(to be)\b/gi, '');

        // Remove excessive adjectives/adverbs (simplified logic)
        optimizedSentence = optimizedSentence.replace(/\b(very|really|quite|pretty)\s+(\w+)\b/gi, '$2'); // Remove common intensifiers
        optimizedSentence = optimizedSentence.replace(/\b(totally|completely|absolutely)\s+(\w+)\b/gi, '$2');

        // Clean up double spaces from replacements
        return optimizedSentence.replace(/\s+/g, ' ').trim();
    }

    /**
     * Performs content length validation and smart truncation to avoid cutting mid-word or mid-sentence.
     * @param {string} text The text to validate and truncate.
     * @param {number} maxLength The maximum allowed length.
     * @returns {string} The truncated text with an ellipsis if truncated.
     */
    validateAndTruncate(text, maxLength = 4000) { // Default maxLength here
        if (text.length <= maxLength) return text;

        // Smart truncation at sentence boundaries
        let truncated = text.substring(0, maxLength);
        const lastSentenceEnd = Math.max(
            truncated.lastIndexOf('.'),
            truncated.lastIndexOf('!'),
            truncated.lastIndexOf('?')
        );

        // If we can truncate at a sentence boundary reasonably close to the limit (e.g., within 20% of maxLength)
        if (lastSentenceEnd > maxLength * 0.8 && lastSentenceEnd < maxLength) {
            return truncated.substring(0, lastSentenceEnd + 1);
        }

        // Otherwise, truncate at the last word boundary
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > -1 && lastSpace < maxLength) { // Ensure lastSpace is valid and within bounds
            return truncated.substring(0, lastSpace) + '...';
        }

        // Fallback: simple truncation with ellipsis
        return truncated + '...';
    }

    /**
     * Applies an aggressive optimization strategy for maximum token reduction.
     * Used when `aggressiveOptimization` is true or `targetTokenReduction` isn't met.
     * @param {string} text The input text.
     * @returns {string} The aggressively optimized text.
     */
    applyAggressiveOptimization(text) {
        // Remove all non-essential words and simplify phrases
        let optimizedText = text;

        // Remove excessive adjectives (keep only the most impactful - simple heuristic)
        optimizedText = optimizedText.replace(/\b(good|nice|great|awesome|amazing|incredible|fantastic)\s+(good|nice|great|awesome|amazing|incredible|fantastic)\b/gi, '$2');
        optimizedText = optimizedText.replace(/\b(very|really|quite|pretty)\s+(\w+)\b/gi, '$2'); // Remove common intensifiers

        // Convert complex sentences to simpler forms
        optimizedText = optimizedText.replace(/\b(in addition to this|furthermore|moreover)\b/gi, 'also');
        optimizedText = optimizedText.replace(/\b(as a consequence|as a result|therefore)\b/gi, 'so');
        optimizedText = optimizedText.replace(/\b(in conclusion|to summarize|in summary)\b/gi, 'finally');

        // Simplify comparative structures
        optimizedText = optimizedText.replace(/\b(more and more)\b/gi, 'increasingly');
        optimizedText = optimizedText.replace(/\b(less and less)\b/gi, 'decreasingly');
        optimizedText = optimizedText.replace(/\b(again and again)\b/gi, 'repeatedly');

        // Remove redundant prepositions and conjunctions
        optimizedText = optimizedText.replace(/\b(and then)\b/gi, 'then');
        optimizedText = optimizedText.replace(/\b(but however)\b/gi, 'but');
        optimizedText = optimizedText.replace(/\b(so therefore)\b/gi, 'so');

        // Remove common conjunctions if they appear too frequently (simple heuristic)
        optimizedText = optimizedText.replace(/\b(that)\s+\b/gi, ' '); // Remove isolated 'that' often
        optimizedText = optimizedText.replace(/\b(which)\s+\b/gi, ' '); // Remove isolated 'which' often

        // Remove excessive empty lines
        optimizedText = optimizedText.replace(/\n\s*\n\s*\n/g, '\n\n');

        return optimizedText.replace(/\s+/g, ' ').trim(); // Normalize spacing
    }

    /**
     * Main preprocessing method optimized for OpenAI API.
     * Applies security, noise reduction, and token optimization.
     * @param {string} text The raw user input text.
     * @param {object} options Configuration options for preprocessing.
     * @returns {object} An object containing processed text, stats, and warnings.
     */
    preprocessForOpenAI(text, options = {}) {
        const {
            maxLength = 4000, // Default for this method, can be overridden by options
            targetTokenReduction = 0.4,
            aggressiveOptimization = false,
            // openAIModel = 'gpt-3.5-turbo' // Future: for model-specific optimizations
        } = options;

        if (!text || !text.trim()) {
            return {
                processedText: '',
                securityIssues: { sql: [], xss: [], command: [] }, // Ensure these are always arrays
                originalStats: { characters: 0, words: 0, estimatedTokens: 0 },
                processedStats: { characters: 0, words: 0, estimatedTokens: 0 },
                tokenReduction: 0,
                compressionRatio: 0,
                warnings: ['Empty input'],
                optimizations: []
            };
        }

        const originalStats = this.calculateOpenAITokens(text);
        const warnings = [];
        const optimizations = [];
        let processedText = text;

        // Step 1: Security check and sanitization (FIRST and always)
        const securityIssues = this.detectSecurityThreats(processedText);
        if (Object.values(securityIssues).some(arr => arr.length > 0)) {
            // Apply sanitization even if blocking later, to clean the log/potential remnants
            processedText = this.sanitizeForSecurity(processedText);
            warnings.push("Security threats detected and sanitized.");
            optimizations.push("Security sanitization applied.");
        }

        // Step 2: Advanced noise removal with context preservation (initial pass)
        const beforeNoiseRemoval = processedText.length;
        processedText = this.removeNoisePreserveContext(processedText);
        if (processedText.length < beforeNoiseRemoval * 0.95) { // If noticeable reduction
            optimizations.push("Filler words and verbose phrases removed.");
        }

        // Step 3: Structure and meaning preservation (second pass for clarity)
        const beforeStructureOptimization = processedText.length;
        processedText = this.preserveStructureAndMeaning(processedText);
        if (processedText.length < beforeStructureOptimization * 0.98) { // If noticeable reduction
            optimizations.push("Sentence structure and redundancy optimized.");
        }

        // Step 4: Aggressive optimization if requested or target reduction not met
        const currentStats = this.calculateOpenAITokens(processedText);
        const currentReduction = originalStats.estimatedTokens > 0
            ? (originalStats.estimatedTokens - currentStats.estimatedTokens) / originalStats.estimatedTokens
            : 0;

        if (aggressiveOptimization || currentReduction < targetTokenReduction) {
            const beforeAggressiveOptimization = processedText.length;
            processedText = this.applyAggressiveOptimization(processedText);
            if (processedText.length < beforeAggressiveOptimization) {
                optimizations.push("Aggressive token optimization applied.");
            }
        }

        // Step 5: Final length validation and truncation
        const beforeTruncation = processedText.length;
        processedText = this.validateAndTruncate(processedText, maxLength); // Use the passed maxLength
        if (processedText.length < beforeTruncation) {
            warnings.push(`Content truncated to ${maxLength} characters.`);
        }

        const finalStats = this.calculateOpenAITokens(processedText);
        const tokenReductionPercentage = originalStats.estimatedTokens > 0
            ? ((originalStats.estimatedTokens - finalStats.estimatedTokens) / originalStats.estimatedTokens * 100)
            : 0;

        const compressionRatioPercentage = originalStats.characters > 0
            ? (finalStats.characters / originalStats.characters * 100)
            : 100;

        // Add performance warnings based on final reduction
        if (tokenReductionPercentage < 10 && originalStats.estimatedTokens > 50) {
            warnings.push("Low token reduction achieved - consider more aggressive optimization settings.");
        } else if (tokenReductionPercentage > 60 && originalStats.estimatedTokens > 50) {
            warnings.push("High token reduction - please verify content integrity (may be overly optimized).");
        }

        return {
            processedText: processedText.trim(),
            securityIssues,
            originalStats,
            processedStats: finalStats,
            tokenReduction: Math.round(tokenReductionPercentage),
            compressionRatio: Math.round(compressionRatioPercentage),
            tokensSaved: originalStats.estimatedTokens - finalStats.estimatedTokens,
            warnings,
            optimizations
        };
    }
}

module.exports = EnhancedTextPreprocessor;
