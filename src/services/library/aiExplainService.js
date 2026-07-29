// aiExplainService.js
// AI Explanation service that uses existing Lex Bot/Deep Research Service for sections,
// and Gemini directly for Indian Kanoon judgments!
import { api } from '../api';

const SAVED_EXPLANATIONS_KEY = 'draftmate_saved_explanations';
const JUDGMENT_SUMMARY_CACHE_KEY = 'draftmate_judgment_summary_cache';

// Session cache for judgment summaries (to avoid regenerating in same session)
const summaryCache = new Map();

// Mock explanations database for backward compatibility
const mockExplanations = {
  // IPC Section 420
  'ipc-420': {
    simpleMeaning: 'Cheating and dishonestly inducing delivery of property.',
    legalApplicability: 'Used in fraud, deception and dishonest inducement cases.',
    punishment: 'Imprisonment and/or fine.',
    judicialInterpretation: 'Courts have held that Section 420 requires both cheating and dishonest inducement. The offence is complete when the victim parts with property based on the fraudulent representation. Reference: Ram Jethmalani v. Union of India (2011).',
    practicalExample: 'Investment scam promising fake returns.',
    keyTakeaways: [
      'Requires both cheating and dishonest inducement.',
      'Property must be delivered as a result of the deception.',
      'Cognizable and non-bailable offence.',
      'Maximum punishment is 7 years imprisonment.',
    ],
  },
};

// Default/fallback explanation for sections
const generateGenericExplanation = (act, section) => ({
  simpleMeaning: `Section ${section.number} of the ${act.name} (${act.shortName}) titled "${section.title}" deals with foundational provisions of the Act. The section establishes legal norms and obligations that are binding on persons within the jurisdiction of this legislation.`,
  legalApplicability: `This section applies to all persons and entities governed by the ${act.name}. Courts are required to interpret this section in light of the broader objectives of the Act, as well as settled judicial precedents in this area of law.`,
  punishment: `The provision under this section may attract civil or criminal liability depending on the nature of the violation. Specific penalties are prescribed either within this section or cross-referenced to other provisions of the Act.`,
  judicialInterpretation: `Courts have consistently upheld the legislative intent behind such provisions. The Supreme Court and various High Courts have interpreted similar provisions broadly to advance the purpose of the legislation, while strictly construing penal aspects in favour of the accused.`,
  practicalExample: `Consider a scenario where a party fails to comply with the requirements set out in Section ${section.number}. In such cases, the aggrieved party may approach the relevant authority or court for appropriate relief — including damages, injunctions, or criminal prosecution — depending on the category of breach.`,
  keyTakeaways: [
    `Section ${section.number} is a key provision of the ${act.shortName}.`,
    'Both procedural and substantive compliance is required.',
    'Non-compliance may attract civil and/or criminal consequences.',
    'Always read this section in conjunction with adjacent provisions for full context.',
    'Seek qualified legal advice before taking any action based on this section.',
  ],
});

/**
 * Helper function to parse structured judgment summary from AI response
 */
function parseJudgmentSummary(text) {
  // Try to extract sections using common patterns
  const sections = {
    caseFacts: '',
    legalIssues: '',
    courtReasoning: '',
    finalDecision: '',
    legalPrinciples: '',
    practicalImpact: '',
    keyTakeaways: [],
  };
  
  const sectionPatterns = {
    caseFacts: /(?:\d+\.\s*)?(?:case\s*facts|facts\s*of\s*the\s*case)[\s:：\-]*([\s\S]*?)(?=(?:\d+\.\s*)?(?:legal\s*issues|legal\s*questions|court\s*reasoning|ratio\s*decidendi|final\s*decision|judgment|legal\s*principles|practical\s*impact|key\s*takeaways|$))/i,
    legalIssues: /(?:\d+\.\s*)?(?:legal\s*issues|legal\s*questions|questions\s*of\s*law)[\s:：\-]*([\s\S]*?)(?=(?:\d+\.\s*)?(?:case\s*facts|court\s*reasoning|ratio\s*decidendi|final\s*decision|judgment|legal\s*principles|practical\s*impact|key\s*takeaways|$))/i,
    courtReasoning: /(?:\d+\.\s*)?(?:court\s*reasoning|ratio\s*decidendi|the\s*court\s*held)[\s:：\-]*([\s\S]*?)(?=(?:\d+\.\s*)?(?:case\s*facts|legal\s*issues|final\s*decision|judgment|legal\s*principles|practical\s*impact|key\s*takeaways|$))/i,
    finalDecision: /(?:\d+\.\s*)?(?:final\s*decision|judgment|order|conclusion)[\s:：\-]*([\s\S]*?)(?=(?:\d+\.\s*)?(?:case\s*facts|legal\s*issues|court\s*reasoning|ratio\s*decidendi|legal\s*principles|key\s*takeaways|$))/i,
    legalPrinciples: /(?:\d+\.\s*)?(?:legal\s*principles|legal\s*standards|principles\s*of\s*law)[\s:：\-]*([\s\S]*?)(?=(?:\d+\.\s*)?(?:case\s*facts|legal\s*issues|court\s*reasoning|ratio\s*decidendi|final\s*decision|legal\s*principles|key\s*takeaways|$))/i,
    practicalImpact: /(?:\d+\.\s*)?(?:practical\s*impact|significance|implications)[\s:：\-]*([\s\S]*?)(?=(?:\d+\.\s*)?(?:case\s*facts|legal\s*issues|court\s*reasoning|ratio\s*decidendi|final\s*decision|legal\s*principles|key\s*takeaways|$))/i,
  };

  // Apply patterns
  for (const [key, pattern] of Object.entries(sectionPatterns)) {
    const match = text.match(pattern);
    if (match && match[1].trim()) {
      sections[key] = match[1].trim();
    }
  }

  // If no sections parsed, use whole text as case facts
  if (!sections.caseFacts.trim()) {
    sections.caseFacts = text.trim();
  }

  // Extract key takeaways (bullet points or numbered lists)
  const takeawayPatterns = [
    /\*\s+(.*)/g,
    /-\s+(.*)/g,
    /\d+\.\s+(.*)/g,
  ];

  for (const pattern of takeawayPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      sections.keyTakeaways = matches.map(m => m[1].trim()).filter(Boolean);
      break;
    }
  }

  return sections;
}

/**
 * Helper function to parse structured section explanation from AI response
 */
function parseSectionExplanation(text) {
  const sections = {
    simpleMeaning: '',
    legalApplicability: '',
    punishment: '',
    judicialInterpretation: '',
    practicalExample: '',
    keyTakeaways: [],
  };

  const sectionPatterns = {
    simpleMeaning: /(?:\d+\.\s*)?(?:simple\s*meaning|plain\s*language|explanation)[\s:：\-]*([\s\S]*?)(?=(?:\d+\.\s*)?(?:legal\s*applicability|applicability|punishment|consequences|judicial\s*interpretation|practical\s*example|key\s*takeaways|$))/i,
    legalApplicability: /(?:\d+\.\s*)?(?:legal\s*applicability|applicability|scope)[\s:：\-]*([\s\S]*?)(?=(?:\d+\.\s*)?(?:simple\s*meaning|punishment|consequences|judicial\s*interpretation|practical\s*example|key\s*takeaways|$))/i,
    punishment: /(?:\d+\.\s*)?(?:punishment|consequences|penalties)[\s:：\-]*([\s\S]*?)(?=(?:\d+\.\s*)?(?:simple\s*meaning|legal\s*applicability|judicial\s*interpretation|practical\s*example|key\s*takeaways|$))/i,
    judicialInterpretation: /(?:\d+\.\s*)?(?:judicial\s*interpretation|court\s*interpretation|case\s*law)[\s:：\-]*([\s\S]*?)(?=(?:\d+\.\s*)?(?:simple\s*meaning|legal\s*applicability|punishment|practical\s*example|key\s*takeaways|$))/i,
    practicalExample: /(?:\d+\.\s*)?(?:practical\s*example|example|scenario)[\s:：\-]*([\s\S]*?)(?=(?:\d+\.\s*)?(?:simple\s*meaning|legal\s*applicability|punishment|judicial\s*interpretation|key\s*takeaways|$))/i,
  };

  // Apply patterns
  for (const [key, pattern] of Object.entries(sectionPatterns)) {
    const match = text.match(pattern);
    if (match && match[1].trim()) {
      sections[key] = match[1].trim();
    }
  }

  // Extract key takeaways (bullet points or numbered lists)
  const takeawayPatterns = [
    /\*\s+(.*)/g,
    /-\s+(.*)/g,
    /\d+\.\s+(.*)/g,
  ];

  for (const pattern of takeawayPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      sections.keyTakeaways = matches.map(m => m[1].trim()).filter(Boolean);
      break;
    }
  }

  // If any sections are empty, fill them with generic text
  if (!sections.simpleMeaning) sections.simpleMeaning = text;
  if (!sections.legalApplicability) sections.legalApplicability = 'This section applies as per the provisions of the Act.';
  if (!sections.punishment) sections.punishment = 'Please refer to the specific provisions of the Act for penalties.';
  if (!sections.judicialInterpretation) sections.judicialInterpretation = 'Courts have interpreted this section in various cases; consult a qualified lawyer for details.';
  if (!sections.practicalExample) sections.practicalExample = 'For specific examples, please refer to judicial precedents.';
  if (sections.keyTakeaways.length === 0) {
    sections.keyTakeaways = [
      'This is an important provision of the Act.',
      'Consult a qualified legal professional for advice.',
    ];
  }

  return sections;
}

/**
 * Helper function to call Gemini API directly for judgment summarization
 */
async function callGeminiAPI(prompt) {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const requestBody = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096
    }
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(`Gemini API error: ${response.status} ${errorData?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  // Extract text from response
  if (data.candidates && data.candidates.length > 0) {
    const candidate = data.candidates[0];
    if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
      return candidate.content.parts[0].text || '';
    }
  }
  
  throw new Error('No valid response from Gemini API');
}

// ─── Service Functions ─────────────────────────────────────────────────────

export const aiExplainService = {
  /**
   * Fetches an AI explanation for a given section.
   *
   * @param {object} act - The Act object
   * @param {object} section - The Section object
   * @param {boolean} forceRegenerate - Whether to force a fresh generation
   * @returns {Promise<object>} - The explanation object
   */
  explainSection: async (act, section, forceRegenerate = false) => {
    const key = `${act.id}-${section.number}`;
    
    // Check cache first unless forced to regenerate
    if (!forceRegenerate && summaryCache.has(key)) {
      return summaryCache.get(key);
    }

    try {
      // Use Gemini directly to generate explanation
      const prompt = `
        Explain Section ${section.number} of the ${act.name} (${act.shortName}).
        
        Section Title: ${section.title}
        Section Text: ${section.content}
        
        Please provide a detailed explanation in the following structure:
        
        1. Simple Meaning - Explain the section in plain, simple language
        2. Legal Applicability - Where and how this section applies legally
        3. Punishment/Consequences - Any penalties or legal consequences
        4. Judicial Interpretation - How courts have interpreted this section (if known)
        5. Practical Example - A real-world scenario where this section would apply
        6. Key Takeaways - 3-5 bullet points summarizing the most important things
        
        Please make sure each section is clearly labeled and easy to read.
      `.trim();
      
      const explanationText = await callGeminiAPI(prompt);
      
      // Parse into structured object
      const structuredExplanation = parseSectionExplanation(explanationText);
      
      const explanation = {
        ...structuredExplanation,
        generatedAt: new Date().toISOString(),
        model: 'Gemini 1.5 Flash',
        actId: act.id,
        actName: act.name,
        sectionNumber: section.number,
        sectionTitle: section.title,
      };
      
      // Cache the result
      summaryCache.set(key, explanation);
      
      return explanation;
    } catch (error) {
      console.warn('Gemini unavailable, falling back to generic explanation:', error);
      
      // Fallback to generic explanation
      const explanation = generateGenericExplanation(act, section);
      const result = {
        ...explanation,
        generatedAt: new Date().toISOString(),
        model: 'DraftMate AI (Fallback)',
        actId: act.id,
        actName: act.name,
        sectionNumber: section.number,
        sectionTitle: section.title,
      };
      summaryCache.set(key, result);
      return result;
    }
  },

  /**
   * Generates AI summary for an Indian Kanoon judgment using Gemini directly.
   *
   * @param {object} judgment - The judgment object (from search results)
   * @param {string} fullText - Full text of the judgment
   * @param {boolean} forceRegenerate - Whether to force a fresh generation
   * @returns {Promise<object>} - The summary object
   */
  summarizeJudgment: async (judgment, fullText, forceRegenerate = false) => {
    const key = `judgment-${judgment.id}`;

    // Check cache first unless forced to regenerate
    if (!forceRegenerate && summaryCache.has(key)) {
      return summaryCache.get(key);
    }

    try {
      // Prepare the query for Gemini
      const context = fullText || judgment.summary || '';
      
      const prompt = `
        Please summarize the following judgment in detail, structured in these sections:
        
        1. Case Facts - Brief facts of the case
        2. Legal Issues - Key legal questions before the court
        3. Court Reasoning/Ratio Decidendi - The court's legal reasoning
        4. Final Decision - What the court ultimately decided
        5. Legal Principles - Key legal principles established
        6. Practical Impact - Significance of this judgment
        7. Key Takeaways - 3-5 main takeaways as bullet points
        
        Judgment Title: ${judgment.title}
        Citation: ${judgment.citation}
        Court: ${judgment.court}
        Date/Year: ${judgment.date || judgment.year || 'N/A'}
        
        Judgment Text:
        ${context}
      `.trim();

      const summaryText = await callGeminiAPI(prompt);
      
      // Parse into structured summary
      const structuredSummary = parseJudgmentSummary(summaryText);
      
      const result = {
        ...structuredSummary,
        generatedAt: new Date().toISOString(),
        model: 'Gemini 1.5 Flash',
        judgmentId: judgment.id,
        judgmentTitle: judgment.title,
      };
      
      // Cache the result
      summaryCache.set(key, result);
      
      return result;
    } catch (error) {
      console.error('Failed to generate judgment summary with Gemini:', error);
      
      // Fallback: create a basic summary from available data
      const fallback = {
        caseFacts: judgment.summary || 'No detailed facts available',
        legalIssues: 'Legal issues not summarized',
        courtReasoning: judgment.ratiodecidendi || judgment.summary || 'No detailed reasoning available',
        finalDecision: `Delivered by ${judgment.court} ${judgment.year ? `in ${judgment.year}` : ''}.`,
        legalPrinciples: 'Legal principles not summarized',
        practicalImpact: 'Practical impact not summarized',
        keyTakeaways: [
          'This is an important judgment from the Indian legal system',
          'Consult a legal professional for detailed analysis',
        ],
        generatedAt: new Date().toISOString(),
        model: 'DraftMate AI (Fallback)',
        judgmentId: judgment.id,
        judgmentTitle: judgment.title,
      };
      
      summaryCache.set(key, fallback);
      return fallback;
    }
  },

  /**
   * Regenerates explanation (triggers a fresh generation).
   */
  regenerateExplanation: async (act, section) => {
    return aiExplainService.explainSection(act, section, true);
  },

  /**
   * Regenerates judgment summary (triggers a fresh generation).
   */
  regenerateJudgmentSummary: async (judgment, fullText) => {
    return aiExplainService.summarizeJudgment(judgment, fullText, true);
  },

  /**
   * Saves an explanation locally for offline access.
   */
  saveExplanation: async (explanation) => {
    await new Promise(r => setTimeout(r, 100));
    const saved = JSON.parse(localStorage.getItem(SAVED_EXPLANATIONS_KEY) || '[]');
    const key = explanation.sectionNumber ? `${explanation.actId}-${explanation.sectionNumber}` : explanation.judgmentId;
    // Remove old version if exists
    const updated = saved.filter(e => {
      const existingKey = e.sectionNumber ? `${e.actId}-${e.sectionNumber}` : e.judgmentId;
      return existingKey !== key;
    });
    updated.unshift({ ...explanation, savedAt: new Date().toISOString() });
    localStorage.setItem(SAVED_EXPLANATIONS_KEY, JSON.stringify(updated));
    return true;
  },
};
