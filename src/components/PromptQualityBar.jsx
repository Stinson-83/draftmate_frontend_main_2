import React, { useMemo } from 'react';
import commonWords from '../utils/dictionary';

const PromptQualityBar = ({ prompt }) => {
    const { score, status, message, color } = useMemo(() => {
        if (!prompt || prompt.trim().length === 0) {
            return { score: 0, status: '', message: '', color: '#e2e8f0' };
        }

        const words = prompt.trim().toLowerCase().split(/\s+/);
        const wordCount = words.length;

        // 1. Length Score (0-60 points)
        // < 5 words: very low
        // 15+ words: max points
        let lengthScore = 0;
        if (wordCount < 5) lengthScore = 10;
        else if (wordCount < 50) lengthScore = 30;
        else if (wordCount < 70) lengthScore = 45;
        else lengthScore = 50;

        // 2. Vocabulary/Spelling Score (0-40 points)
        // Check how many words are in our dictionary or look like valid words
        let validWordCount = 0;
        let unknownWords = [];

        words.forEach(word => {
            // Clean punctuation
            const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "");

            // Skip numbers
            if (!isNaN(cleanWord)) {
                validWordCount++;
                return;
            }

            if (cleanWord.length < 2) {
                validWordCount++; // 'a', 'I' etc
                return;
            }

            // Check dictionary
            if (commonWords.has(cleanWord)) {
                validWordCount++;
            } else {
                // Heuristic: words with no vowels might be typos (unless acronyms, but we'll penalize slightly)
                // Words with 3+ repeated chars (gooood) are definitely typos
                if (/(.)\1\1/.test(cleanWord)) {
                    unknownWords.push(cleanWord);
                } else if (!/[aeiouy]/i.test(cleanWord)) {
                    // likely typo or acronym, treat as unknown for now
                    unknownWords.push(cleanWord);
                } else {
                    // For words not in our small dictionary, we give benefit of doubt 
                    // BUT for the sake of "quality", using known common words is better.
                    // We'll count them as half-valid to encourage simpler/clearer language or verified terms?
                    // actually, let's lower this to 0.2 to penalize unknown words (typos) more heavily
                    validWordCount += 0.2;
                }
            }
        });

        const vocabRatio = validWordCount / wordCount;
        let vocabScore = vocabRatio * 40;

        // Penalty for unknown words (potential typos)
        // If word is not in dict and doesn't look valid, we catch it in unknownWords
        // But we also want to penalize words that "look valid" but aren't in dict (the 0.2 case)
        // The ratio handles the 0.2 case. 
        // Let's also add explicit penalty for "definitely invalid" words
        vocabScore -= (unknownWords.length * 2);

        // Cap vocab score
        if (vocabScore > 40) vocabScore = 40;
        if (vocabScore < 0) vocabScore = 0;

        const totalScore = lengthScore + vocabScore;

        // Determine Status
        let status = 'Weak';
        let color = '#ef4444'; // Red
        let message = 'Too short. Please add more details.';

        if (totalScore >= 80) {
            status = 'Great';
            color = '#22c55e'; // Green
            message = 'Great Prompt: Preliminary draft will be made based on this. You can edit the draft later.';
        } else if (totalScore >= 50) {
            status = 'Good';
            color = '#f59e0b'; // Amber/Yellow
            message = 'Good start. Add specific facts like dates or amounts for better results.';
        }

        return { score: totalScore, status, message, color };

    }, [prompt]);

    if (!prompt) return null;

    return (
        <div style={{ marginTop: '12px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111318' }}>
                    Prompt Quality: <span style={{ color: color }}>{status}</span>
                </span>
            </div>

            {/* Progress Bar Background */}
            <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                {/* Progress Bar Fill */}
                <div
                    style={{
                        width: `${score}%`,
                        height: '100%',
                        backgroundColor: color,
                        transition: 'width 0.3s ease, background-color 0.3s ease'
                    }}
                />
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                {message}
            </p>
        </div>
    );
};

export default PromptQualityBar;
