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
 * Strips all HTML tags from text, preserving content
 * @param {string} text - Text containing HTML tags
 * @returns {string} Clean text without HTML
 */
export const stripHtmlTags = (text) => {
  if (!text) return text;
  let cleanText = text.replace(/<[^>]*>/g, ' '); // Replace tags with space first
  cleanText = cleanText.replace(/\s+/g, ' '); // Normalize whitespace
  cleanText = cleanText.trim(); // Trim leading/trailing
  return decodeHtmlEntities(cleanText);
};

export default {
  stripHtmlTags,
  decodeHtmlEntities
};
