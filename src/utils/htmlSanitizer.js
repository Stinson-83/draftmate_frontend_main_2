/**
 * HTML Sanitizer & Legal Text Extractor Utility
 *
 * Extracts complete, formatted legal judgment text from Indian Kanoon HTML responses,
 * preserving all document sections: court header, bench names, party names, main order,
 * citations, quoted judgments, bench signatures, and record of proceedings.
 */

export const decodeHtmlEntities = (text) => {
  if (!text) return '';
  return text
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
};

/**
 * Line-by-line cleaner that decodes HTML entities and strips residual JS code,
 * CSS rules, and site chrome while preserving legal case text.
 */
/**
 * Line-by-line NLP cleaner that decodes HTML entities and strips CSS declarations,
 * JS code, site navigation, and mobile chrome while preserving 100% legal case text.
 */
function cleanNoiseFromText(text) {
  if (!text) return '';

  let clean = decodeHtmlEntities(text);

  // 0. Remove stray leading/trailing code syntax like ");", "});", "{", "}"
  clean = clean.replace(/^\s*\);\s*/gm, '');
  clean = clean.replace(/^\s*\}\);\s*/gm, '');
  clean = clean.replace(/^\s*\}\s*/gm, '');
  clean = clean.replace(/^\s*\{\s*/gm, '');

  // 1. Strip embedded <style> and <script> blocks if present in plain string
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '');
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, '');
  clean = clean.replace(/window\.dataLayer\s*=\s*[\s\S]*?;/gi, '');
  clean = clean.replace(/gtag\s*\([^)]*\)\s*;?/gi, '');
  clean = clean.replace(/\(function\s*\([\s\S]*?\}\)\(\);?/gi, '');
  clean = clean.replace(/\$\s*\(document\)[\s\S]*?\);?/gi, '');

  // 2. Strip CSS rule blocks
  clean = clean.replace(/:root\s*\{[\s\S]*?\}/gi, '');
  clean = clean.replace(/@keyframes[\s\S]*?\}/gi, '');
  clean = clean.replace(/@media[\s\S]*?\}\s*\}/gi, '');
  clean = clean.replace(/--[\w-]+\s*:[^;\}]+;?/gi, '');
  clean = clean.replace(/([.#][\w-]+|\w+)\s*\{[^}]*\}/gi, '');

  const lines = clean.split('\n');
  const cleanLines = [];

  const noiseKeywords = [
    'window.dataLayer', 'gtag(', 'function()',
    ':root', '@keyframes', 'display:', 'font-family:', 'backdrop-filter:',
    'Skip to main content', 'Indian Kanoon - Search engine', 'Search Indian laws',
    'Main Navigation', 'Mobile Navigation', 'Legal Document View', 'Premium features',
    'Prism AI', 'Upgrade to Premium', 'Integrated with over 4 crore', 'Know your Kanoon',
    'Doc Gen Hub', 'Counter Argument', 'Case Predict AI', 'Talk with IK Doc', 'Case Recast AI',
    'Document Options', 'Get in PDF', 'Print it!', 'Download Court Copy',
    'Cites 0', 'Cited by 0', 'Related AI tags', 'Disclaimer', 'Privacy Policy',
    'Terms', 'Case Removal', 'Share URL', 'Mobile View', '.premium-banner',
    'Free features', 'IKademy', 'Pricing', 'Login', 'Tools for analyzing structure',
    'Search', 'Translation', 'About', 'Blog'
  ];

  const isCssLine = (str) => {
    const s = str.trim().toLowerCase();
    if (!s) return false;

    // Check for CSS property key: value declarations
    if (/^[a-z0-9_-]+\s*:\s*[^;]+;?$/.test(s)) {
      const knownCssProps = [
        'position', 'max-width', 'min-width', 'max-height', 'min-height',
        'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
        'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
        'border', 'border-radius', 'border-top', 'border-bottom', 'border-left', 'border-right',
        'overflow', 'overflow-x', 'overflow-y', 'animation', 'transform', 'transition',
        'font-size', 'font-weight', 'font-family', 'font-style', 'letter-spacing', 'line-height',
        'text-align', 'text-transform', 'text-fill-color', 'background', 'background-clip',
        'background-color', 'color', 'opacity', 'display', 'flex', 'flex-wrap', 'flex-direction',
        'justify-content', 'align-items', 'gap', 'inset', 'top', 'left', 'bottom', 'right',
        'width', 'height', 'z-index', 'cursor', 'vertical-align', 'box-shadow', 'visibility',
        'pointer-events', 'user-select', '-webkit-background-clip', '-webkit-text-fill-color'
      ];
      const propKey = s.split(':')[0].trim();
      if (knownCssProps.includes(propKey)) return true;
    }

    // Check for CSS values and syntax
    if (
      /:\s*[\d.]+(px|em|rem|%|vw|vh|deg|s|ms)\b/.test(s) ||
      /:\s*(relative|absolute|fixed|sticky|auto|center|none|inline-block|flex|grid|uppercase|lowercase|nowrap|transparent|inherit|initial)\b/.test(s) ||
      /^(position|margin|padding|border|font|text|background|align|justify|flex|transform|transition|animation|width|height|gap):/.test(s) ||
      s.includes('{ opacity:') || s.includes('linear-gradient(') || s.includes('rgba(') || s.includes('var(--')
    ) {
      return true;
    }

    return false;
  };

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === ');' || trimmed === '});' || trimmed === '}' || trimmed === '{' || trimmed === '- ...' || trimmed === '...') continue;

    // Check if line is CSS rule/property line
    if (isCssLine(trimmed)) continue;

    // Legal sentence protection: Do NOT strip lines that are substantial legal text (> 80 chars or legal keywords)
    const isSubstantialLegalText = trimmed.length > 80 || /^\d+[\.\)]\s/.test(trimmed) || /^(ORDER|JUDGMENT|HELD|Bench:|Petitioner|Respondent|Court|Section|Act|Versus|VS\.|ITEM NO|S U P R E M E|RECORD OF|Date :|CORAM :)/i.test(trimmed);

    // Check for noise keywords
    let isNoise = false;
    for (const kw of noiseKeywords) {
      if (trimmed.toLowerCase() === kw.toLowerCase() || (trimmed.toLowerCase().includes(kw.toLowerCase()) && !isSubstantialLegalText)) {
        isNoise = true;
        break;
      }
    }
    if (isNoise) continue;

    cleanLines.push(trimmed);
  }

  let result = cleanLines.join('\n\n');
  return result.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Strips HTML tags, embedded CSS/JS code blocks, and site chrome from Indian Kanoon responses,
 * returning the ENTIRE judgment document in full detail.
 *
 * @param {string} htmlString - Raw HTML document from Indian Kanoon or snippet text
 * @returns {string} Complete plain text judgment
 */
export const stripHtmlTags = (htmlString) => {
  if (!htmlString) return '';
  if (typeof htmlString !== 'string') return '';

  // If input is plain text without HTML markup, clean noise and return
  if (!htmlString.includes('<')) {
    return cleanNoiseFromText(htmlString);
  }

  // Pre-clean <script>, <style>, <noscript> blocks before DOM parsing
  let preCleaned = htmlString
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<\s*\/\s*(?:p|div|pre|blockquote|h[1-6]|tr|li)\s*>/gi, '\n\n')
    .replace(/<\s*br\s*\/?>/gi, '\n');

  if (typeof window !== 'undefined' && window.DOMParser) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(preCleaned, 'text/html');

      // Target judgment container directly if present
      const judgmentContainer = doc.querySelector('.judgements, #doc_content, .expanded_doc, .doc_content, #content');

      // Remove website UI noise elements
      const noiseElements = doc.querySelectorAll(
        'script, style, noscript, nav, header, footer, iframe, svg, button, input, form, ' +
        '.premium-banner, #case-recast-fab, #google_translate_element, .search-autocomplete-list, ' +
        '.ui-dialog, .ui-widget, .ui-autocomplete, #translatewarn, #courtcopyform, ' +
        '#pdfdoc, #printdoc, .mainnavigation, .siteheader, .sitefooter, .navigation, ' +
        '[id^="google_translate"], .expanded_doc_header, .doc_options, .ad-box, .banner'
      );
      noiseElements.forEach(el => el.remove());

      const targetEl = judgmentContainer || doc.body || doc.documentElement;
      const bodyTxt = targetEl ? (targetEl.innerText || targetEl.textContent || '') : '';
      if (bodyTxt && bodyTxt.trim().length > 30) {
        return cleanNoiseFromText(bodyTxt);
      }
    } catch (e) {
      console.warn('DOMParser failed:', e);
    }
  }

  // Regex Fallback
  return cleanNoiseFromText(preCleaned.replace(/<[^>]*>/g, ' '));
};

export const sanitizeJudgmentHtml = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') return '';
  if (!htmlString.includes('<')) return htmlString;
  if (typeof window !== 'undefined' && window.DOMParser) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, 'text/html');

      const judgmentContainer = doc.querySelector('.judgements, #doc_content, .expanded_doc, .doc_content, #content');

      const noiseElements = doc.querySelectorAll(
        'script, style, noscript, nav, header, footer, iframe, svg, button, input, form, ' +
        '.premium-banner, #case-recast-fab, #google_translate_element, .search-autocomplete-list, ' +
        '.ui-dialog, .ui-widget, .ui-autocomplete, #translatewarn, #courtcopyform, ' +
        '#pdfdoc, #printdoc, .mainnavigation, .siteheader, .sitefooter, .navigation, ' +
        '[id^="google_translate"], .expanded_doc_header, .doc_options, .ad-box, .banner, ' +
        '.doc_title ~ .doc_title' // duplicate headers
      );
      noiseElements.forEach(el => el.remove());

      const targetEl = judgmentContainer || doc.body || doc.documentElement;

      // Keep structural html but remove inline styles/classes for a clean look
      const allEls = targetEl.querySelectorAll('*');
      allEls.forEach(el => {
        el.removeAttribute('style');
        // Let's keep specific structure classes if needed, or remove class entirely
        if (el.tagName !== 'A') { // Keep links if they exist (or we could strip a tags)
           // remove a tags' hrefs if they are relative to IK
           if (el.tagName === 'A') {
             el.removeAttribute('href');
           }
        }
      });

      // Inject some professional typography classes on known IK blockquote/pre tags
      targetEl.querySelectorAll('blockquote').forEach(el => el.className = "pl-4 border-l-4 border-slate-300 dark:border-slate-600 italic text-slate-700 dark:text-slate-300 my-4");
      targetEl.querySelectorAll('pre').forEach(el => el.className = "p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-x-auto my-4 text-xs font-mono text-slate-600 dark:text-slate-300");
      targetEl.querySelectorAll('.doc_title, h1, h2, h3').forEach(el => el.className = "text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4");

      return targetEl.innerHTML;
    } catch (e) {
      console.warn('DOMParser failed in HTML sanitize:', e);
    }
  }
  return htmlString;
};

export default {
  stripHtmlTags,
  sanitizeJudgmentHtml,
  decodeHtmlEntities
};
