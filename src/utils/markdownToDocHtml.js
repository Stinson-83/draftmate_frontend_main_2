import DOMPurify from 'dompurify';

/**
 * Transforms Markdown and non-standard AI Legal Research responses into
 * clean, semantic, DOMPurify-sanitized HTML for ONLYOFFICE PasteHtml insertion.
 * Enforces standard Calibri 11pt document typography, fixes placeholder collisions,
 * and ensures all inserted citations ([1], [2], statutory IPC/CrPC sections, case names, Kanoon links)
 * are clean, valid, clickable URLs that open the exact source page when clicked.
 */

const escapeHtml = (str) => {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Sanitizes & cleans target URLs by removing trailing brackets ], parentheses ), periods ., commas, etc.
 * Normalizes protocol to https:// to prevent 404 errors.
 */
export const cleanTargetUrl = (rawUrl) => {
  if (!rawUrl) return '';
  let cleaned = String(rawUrl).trim();

  // Strip trailing punctuation like ], ), ., ,, ;, :, >
  cleaned = cleaned.replace(/[\s\)\].!?,;:>]+$/g, '');

  // Ensure trailing slash for Indian Kanoon doc URLs if stripped down to digits (e.g. /doc/172598580)
  if (/\/doc\/\d+$/i.test(cleaned)) {
    cleaned += '/';
  }

  // Ensure proper https:// protocol
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = 'https://' + cleaned;
  } else if (cleaned.startsWith('http://')) {
    cleaned = cleaned.replace(/^http:\/\//i, 'https://');
  }

  return cleaned;
};

/**
 * Formats inline text elements with safe placeholder replacements:
 * - Bold: **text** or __text__ -> <strong>text</strong>
 * - Italic: *text* or _text_ -> <em>text</em>
 * - Hyperlinks: [label](url) -> <a href="url">label</a>
 * - Bracketed URLs: [Indian Kanoon - http://...] -> <a href="url">[label]</a>
 * - Naked URLs: http(s):// -> <a href="url">url</a>
 * - Citations: [1], [2] -> <a href="url" target="_blank"><sup>[1]</sup></a> (Clickable source links)
 * - Statutory Provisions: "Section 12 of Contempt of Courts Act", "Section 406 IPC", "Article 30" -> Clickable Kanoon search link
 * - Legal Case Names: "X vs Y", "X v. Y", "In re X" -> <a href="..." target="_blank"><em>Case Name</em></a>
 */
export const formatInlineText = (text, sources = []) => {
  if (!text) return '';
  let str = text;

  // Build a lookup map for sources by index (both 1-indexed and 0-indexed)
  const sourceMap = {};
  if (Array.isArray(sources)) {
    sources.forEach((s, i) => {
      const idx = s.index !== undefined ? s.index : (i + 1);
      sourceMap[idx] = s;
      sourceMap[String(idx)] = s;
      if (s.id !== undefined) sourceMap[s.id] = s;
    });
  }

  // Use SAFE non-markdown placeholders (no underscores/asterisks) to avoid corruption
  const replacements = [];
  const addPlaceholder = (html) => {
    const token = `XPH${replacements.length}XPH`;
    replacements.push({ token, html });
    return token;
  };

  // 1. Bracketed URLs e.g. [Indian Kanoon - http://indiankanoon.org/doc/172598580/]
  const bracketedUrlRegex = /\[([^\]]*?)(https?:\/\/[^\s\]]+|(?:www\.)?indiankanoon\.org\/[^\s\]]+)([^\]]*?)\]/gi;
  str = str.replace(bracketedUrlRegex, (match, prefix, rawUrl, suffix) => {
    const validUrl = cleanTargetUrl(rawUrl);
    const labelText = (prefix + suffix).replace(/^[-:\s]+|[-:\s]+$/g, '').trim();
    const displayLabel = labelText ? `[${escapeHtml(labelText)} - ${validUrl}]` : `[${validUrl}]`;
    return addPlaceholder(`<a href="${validUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${displayLabel}</a>`);
  });

  // 2. Explicit Markdown links [label](url)
  str = str.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, label, url) => {
    const validUrl = cleanTargetUrl(url);
    return addPlaceholder(`<a href="${validUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${escapeHtml(label)}</a>`);
  });

  // 3. Naked URLs (e.g. http://indiankanoon.org/doc/172598580/ or indiankanoon.org/doc/172598580/)
  const urlRegex = /(?<!\]\(|href=")(\b(?:https?:\/\/|(?:www\.)?indiankanoon\.org\/)[^\s<>\)\],]+)/gi;
  str = str.replace(urlRegex, (match) => {
    const validUrl = cleanTargetUrl(match);
    return addPlaceholder(`<a href="${validUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${validUrl}</a>`);
  });

  // 4. Contextual Citation Tags e.g. [1], [2], [3] -> Clickable Source Links
  str = str.replace(/([^\n.!?]{2,60})?\s*\[(\d+)\]/g, (match, contextBefore, num) => {
    const source = sourceMap[num] || sourceMap[parseInt(num)];

    let rawTargetUrl = source?.url || source?.link || source?.source_url || source?.href;
    if (!rawTargetUrl && source?.doc_id) {
      rawTargetUrl = `https://indiankanoon.org/doc/${source.doc_id}/`;
    }
    if (!rawTargetUrl && source?.docid) {
      rawTargetUrl = `https://indiankanoon.org/doc/${source.docid}/`;
    }
    if (!rawTargetUrl) {
      const cleanContext = (contextBefore || '').replace(/[\*\_\[\]]/g, '').trim();
      const searchQuery = source?.citation || source?.title || source?.name || cleanContext || (`Citation ${num}`);
      rawTargetUrl = `https://indiankanoon.org/search/?formInput=${encodeURIComponent(searchQuery)}`;
    }

    const validUrl = cleanTargetUrl(rawTargetUrl);
    const titleAttr = escapeHtml(source?.title || source?.citation || source?.name || `Citation [${num}]`);
    const prefixText = contextBefore ? contextBefore : '';
    const citationHtml = `<a href="${validUrl}" target="_blank" rel="noopener noreferrer" title="${titleAttr}" style="color: #2563eb; text-decoration: underline; font-weight: bold;"><sup>[${num}]</sup></a>`;
    
    return `${prefixText}${addPlaceholder(citationHtml)}`;
  });

  // 5. Statutory Law References (e.g., Section 12 of the Contempt of Courts Act, 1971, Article 30 of the Constitution of India, Section 406 IPC)
  const statuteRegex = /\b(?:Sections?|Article)\s+\d+(?:\(\d+\))?(?:\([a-zA-Z]\))?(?:\s*,\s*\d+(?:\(\d+\))?)*(?:\s+and\s+\d+(?:\(\d+\))?)?\s+of\s+(?:the\s+)?[A-Z][A-Za-z0-9\s,()'-]+(?:Act|Code|Constitution)(?:\s*,\s*\d{4})?\b/g;
  str = str.replace(statuteRegex, (match) => {
    if (match.includes('XPH') || match.includes('<a')) return match;
    const searchUrl = `https://indiankanoon.org/search/?formInput=${encodeURIComponent(match)}`;
    return addPlaceholder(`<a href="${searchUrl}" target="_blank" rel="noopener noreferrer" style="color: #059669; text-decoration: underline; font-weight: 500;">${escapeHtml(match)}</a>`);
  });

  // 6. Bold: **text** or __text__
  str = str.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

  // 7. Italic: *text* or _text_
  str = str.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

  // 8. Legal Case Name Auto-detection (e.g. Anand Kumar Mohatta v. State, Radhey Shyam v. Chhabi Nath)
  const caseRegex = /\b([A-Z][A-Za-z0-9.&'/-]*(?:\s+[A-Z][A-Za-z0-9.&'/-]*)*)\s+(?:vs\.?|v\.?)\s+([A-Z][A-Za-z0-9.&'/-]*(?:\s+[A-Z][A-Za-z0-9.&'/-]*)*)\b|\bIn\s+re\s+([A-Z][A-Za-z0-9.&'/-]*(?:\s+[A-Z][A-Za-z0-9.&'/-]*)*)\b/g;
  str = str.replace(caseRegex, (match) => {
    if (match.includes('<strong>') || match.includes('<em>') || match.includes('XPH') || match.includes('<a')) return match;
    const searchUrl = `https://indiankanoon.org/search/?formInput=${encodeURIComponent(match)}`;
    return addPlaceholder(`<a href="${searchUrl}" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; text-decoration: underline; font-style: italic;"><em>${escapeHtml(match)}</em></a>`);
  });

  // Restore placeholders safely
  replacements.forEach(({ token, html }) => {
    str = str.replace(token, html);
  });

  return str;
};

/**
 * Main AST & Structure Parser: Converts raw text -> AST -> Styled HTML with Contextual Clickable Citations & Laws
 */
export const convertMarkdownToDocHtml = (rawInput, sources = []) => {
  if (!rawInput || !rawInput.trim()) return '';

  console.log('[MarkdownToDocHtml] --- Step 1: Original AI Response ---');
  console.log(rawInput);
  console.log('[MarkdownToDocHtml] Sources for citations:', sources);

  const lines = rawInput.replace(/\r\n/g, '\n').split('\n');
  const ast = [];
  let currentList = null;

  const flushList = () => {
    if (currentList) {
      ast.push(currentList);
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    // 1. Markdown Headings (# Heading, ## Heading, ### Heading)
    const mdHeaderMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (mdHeaderMatch) {
      flushList();
      const level = Math.min(mdHeaderMatch[1].length, 3);
      ast.push({
        type: 'heading',
        level,
        text: mdHeaderMatch[2].trim(),
      });
      continue;
    }

    // 2. Major Numbered Heading Detection (e.g. "1. **Brief Answer** content..." or "2. **Detailed Analysis**")
    const majorNumberedMatch = trimmed.match(/^(\d+)\.\s+(\*\*(.*?)\*\*|__(.*?)__|([A-Z0-9\s:/-]{3,}))(?:\s*(.*))?$/i);
    if (majorNumberedMatch) {
      flushList();
      const number = majorNumberedMatch[1];
      const titleText = majorNumberedMatch[3] || majorNumberedMatch[4] || majorNumberedMatch[5] || '';
      const inlineContent = majorNumberedMatch[6] ? majorNumberedMatch[6].trim() : '';

      ast.push({
        type: 'heading',
        level: 2,
        text: `${number}. ${titleText.trim().replace(/:$/, '')}`,
      });

      if (inlineContent) {
        ast.push({
          type: 'paragraph',
          text: inlineContent,
        });
      }
      continue;
    }

    // 3. Bullet Subsection Heading (e.g. "- **Case Identification:** Content...")
    const bulletHeadingMatch = trimmed.match(/^[-*]\s+\*\*(.*?)\:\*\*\s*(.*)$/);
    if (bulletHeadingMatch) {
      flushList();
      const titleText = bulletHeadingMatch[1].trim();
      const inlineContent = bulletHeadingMatch[2].trim();

      ast.push({
        type: 'heading',
        level: 3,
        text: titleText,
      });

      if (inlineContent) {
        ast.push({
          type: 'paragraph',
          text: inlineContent,
        });
      }
      continue;
    }

    // 4. Inline Bold Section Title (e.g. "**High Court's Decision:** Content...")
    const inlineBoldHeadingMatch = trimmed.match(/^\*\*(.*?)\:\*\*\s*(.*)$/);
    if (inlineBoldHeadingMatch) {
      flushList();
      const titleText = inlineBoldHeadingMatch[1].trim();
      const inlineContent = inlineBoldHeadingMatch[2].trim();

      ast.push({
        type: 'heading',
        level: 3,
        text: titleText,
      });

      if (inlineContent) {
        ast.push({
          type: 'paragraph',
          text: inlineContent,
        });
      }
      continue;
    }

    // 5. Blockquote Detection
    const quoteMatch = trimmed.match(/^&gt;|> (.*)$/);
    if (quoteMatch) {
      flushList();
      ast.push({
        type: 'blockquote',
        text: quoteMatch[1] || '',
      });
      continue;
    }

    // 6. Bullet List Items (- item, * item)
    const bulletItemMatch = rawLine.match(/^(\s*)[-*]\s+(.+)$/);
    if (bulletItemMatch) {
      const indent = bulletItemMatch[1].length;
      const itemText = bulletItemMatch[2].trim();

      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push({ text: itemText, indent });
      continue;
    }

    // 7. Numbered List Items (1. item, 2. item)
    const numberedItemMatch = rawLine.match(/^(\s*)(\d+)\.\s+(.+)$/);
    if (numberedItemMatch) {
      const indent = numberedItemMatch[1].length;
      const itemText = numberedItemMatch[3].trim();

      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push({ text: itemText, indent });
      continue;
    }

    // 8. Continuation line or Regular Paragraph text
    if (!currentList && ast.length > 0 && ast[ast.length - 1].type === 'paragraph') {
      ast[ast.length - 1].text += ' ' + trimmed;
    } else {
      flushList();
      ast.push({
        type: 'paragraph',
        text: trimmed,
      });
    }
  }

  flushList();

  console.log('[MarkdownToDocHtml] --- Step 2: Detected AST Structure ---', ast);

  // Render HTML that inherits active document font-family and styling from ONLYOFFICE
  let htmlResult = `<div style="line-height: 1.5; color: #111827;">\n`;

  ast.forEach((node) => {
    if (node.type === 'heading') {
      const marginTop = node.level === 1 ? '16pt' : node.level === 2 ? '14pt' : '10pt';
      htmlResult += `<h${node.level} style="font-weight: bold; color: #000000; margin-top: ${marginTop}; margin-bottom: 4pt;">${formatInlineText(node.text, sources)}</h${node.level}>\n`;
    } else if (node.type === 'paragraph') {
      htmlResult += `<p style="line-height: 1.5; color: #111827; margin-bottom: 8pt; text-align: justify;">${formatInlineText(node.text, sources)}</p>\n`;
    } else if (node.type === 'blockquote') {
      htmlResult += `<blockquote style="font-style: italic; border-left: 3px solid #cbd5e1; padding-left: 10pt; margin-left: 0; color: #374151;">${formatInlineText(node.text, sources)}</blockquote>\n`;
    } else if (node.type === 'ul' || node.type === 'ol') {
      const tag = node.type;
      htmlResult += `<${tag} style="line-height: 1.5; margin-bottom: 8pt; padding-left: 18pt;">\n`;
      node.items.forEach((item) => {
        htmlResult += `  <li style="margin-bottom: 4pt;">${formatInlineText(item.text, sources)}</li>\n`;
      });
      htmlResult += `</${tag}>\n`;
    }
  });

  htmlResult += `</div>`;

  console.log('[MarkdownToDocHtml] --- Step 3: Raw Generated HTML ---');
  console.log(htmlResult);

  // HTML Sanitization using DOMPurify
  const sanitizedHtml = DOMPurify.sanitize(htmlResult.trim(), {
    ALLOWED_TAGS: [
      'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'strong', 'em', 'b', 'i',
      'ul', 'ol', 'li', 'blockquote',
      'a', 'br', 'span', 'sub', 'sup'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'title', 'style'],
  });

  console.log('[MarkdownToDocHtml] --- Step 4: Final Sanitized HTML ---');
  console.log(sanitizedHtml);

  return sanitizedHtml;
};

export default convertMarkdownToDocHtml;
