/**
 * HTML Sanitizer Utility
 * 
 * Functions to strip HTML tags and decode common HTML entities,
 * returning clean plain text while preserving spacing and punctuation.
 */

/**
 * Decodes common HTML entities to their plain text equivalents
 * @param {string} text - Text with HTML entities
 * @returns {string} Text with decoded entities
 */
export const decodeHtmlEntities = (text) => {
  if (!text) return text;

  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™'
  };

  return text.replace(/&[#a-zA-Z0-9]+;/g, (match) => entityMap[match] || match);
};

/**
 * Strips all HTML tags, embedded CSS/JS code blocks, and site header boilerplate
 * @param {string} text - Text containing HTML or scraped markup
 * @returns {string} Clean plain text without CSS/JS code or navigation noise
 */
export const stripHtmlTags = (text) => {
  if (!text) return text;
  let cleanText = text;

  // 1. Remove script, style, header, nav, footer tags and their inner content
  cleanText = cleanText.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  cleanText = cleanText.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  cleanText = cleanText.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');
  cleanText = cleanText.replace(/<header[\s\S]*?<\/header>/gi, ' ');
  cleanText = cleanText.replace(/<nav[\s\S]*?<\/nav>/gi, ' ');

  // 2. Remove all remaining HTML tags
  cleanText = cleanText.replace(/<[^>]*>/g, ' ');

  // 3. Remove leftover CSS rules, variables, or @keyframes code blocks
  cleanText = cleanText.replace(/:\s*root\s*\{[^}]*\}/gi, ' ');
  cleanText = cleanText.replace(/@[a-z-]+\s+[^{]+\{[^}]*\}/gi, ' ');
  cleanText = cleanText.replace(/(\.[a-zA-Z0-9_-]+|\#[a-zA-Z0-9_-]+)\s*\{[^}]*\}/gi, ' ');
  cleanText = cleanText.replace(/--[a-zA-Z0-9_-]+:\s*[^;\}]+;?/gi, ' ');

  // 4. Remove Indian Kanoon site header / navigation boilerplate lines
  const boilerplatePatterns = [
    /Skip to main content/gi,
    /Indian Kanoon\s*-\s*Search engine for Indian Law/gi,
    /Search laws,\s*court judgments and everything/gi,
    /Unlock Advanced Research with PRISM/gi,
    /Free features\s+Premium\s+Prism AI\s+IKademy\s+Pricing\s+Login/gi,
    /Mobile Navigation/gi,
    /Know your Kanoon/gi,
    /Doc Gen Hub/gi,
    /Counter Argument/gi,
    /Case Predict AI/gi,
    /Talk with IK Doc/gi,
    /Tools for analyzing structure and cite text of judgments/gi,
    /Get in PDF/gi,
    /Print it!/gi,
    /Download Court Copy/gi
  ];

  for (const pattern of boilerplatePatterns) {
    cleanText = cleanText.replace(pattern, ' ');
  }

  // 5. Clean whitespace & decode entities
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  return decodeHtmlEntities(cleanText);
};

export default {
  stripHtmlTags,
  decodeHtmlEntities
};
