/* eslint-disable no-restricted-globals */

// Helper to process elements - Moved from Editor.jsx
const processElements = (elements) => {
    if (elements.length === 0) return '';

    // Group by approximate Y (top) position to form lines
    const rows = new Map();
    const TOLERANCE = 5; // px

    elements.forEach(el => {
        let top = parseFloat(el.style.top || '0');
        // Find existing row within tolerance
        let rowKey = Array.from(rows.keys()).find(k => Math.abs(parseFloat(k) - top) < TOLERANCE);

        if (!rowKey) {
            rowKey = top.toString();
            rows.set(rowKey, []);
        }
        rows.get(rowKey).push(el);
    });

    // Sort rows by Y position
    const sortedRowKeys = Array.from(rows.keys()).sort((a, b) => parseFloat(a) - parseFloat(b));

    // Build new HTML
    let cleanHtml = '';

    sortedRowKeys.forEach(key => {
        const rowElements = rows.get(key);
        // Sort elements in row by X (left) position
        rowElements.sort((a, b) => {
            const leftA = parseFloat(a.style.left || '0');
            const leftB = parseFloat(b.style.left || '0');
            return leftA - leftB;
        });

        // Create a paragraph for this line
        cleanHtml += '<p>';

        let previousRight = 0;

        rowElements.forEach((el, index) => {
            // Extract style metadata we want to preserve
            const styles = el.style;
            const relevantStyles = [];

            if (styles.fontWeight && styles.fontWeight !== 'normal') relevantStyles.push(`font-weight:${styles.fontWeight}`);
            if (styles.fontStyle && styles.fontStyle !== 'normal') relevantStyles.push(`font-style:${styles.fontStyle}`);
            if (styles.textDecoration && styles.textDecoration !== 'none') relevantStyles.push(`text-decoration:${styles.textDecoration}`);
            // if (styles.color && styles.color !== 'rgb(0, 0, 0)' && styles.color !== '#000000') relevantStyles.push(`color:${styles.color}`);
            if (styles.fontSize) relevantStyles.push(`font-size:${styles.fontSize}`);
            // FORCE BLACK COLOR to ensure visibility
            relevantStyles.push('color: black');

            // Calculate Margin for visual spacing
            const left = parseFloat(styles.left || '0');
            const width = parseFloat(styles.width || '0');

            if (index > 0) {
                const gap = left - previousRight;
                // Only add margin if gap is significant (> 5px) to avoid jitter
                if (gap > 5) {
                    relevantStyles.push(`margin-left:${Math.round(gap)}px`);
                } else {
                    // Ensure at least a space if gap is small but positive
                    relevantStyles.push(`margin-left: 4px`);
                }
            }

            // Update previousRight for next element
            // If width is missing (legacy docs), estimate based on text length (approx 7px per char for 12px font)
            const estimatedWidth = width > 0 ? width : (el.innerText.length * 7);
            previousRight = left + estimatedWidth;

            const styleString = relevantStyles.length > 0 ? `style="${relevantStyles.join(';')}"` : '';
            // Use innerHTML from the simplified object
            cleanHtml += `<span ${styleString}>${el.innerHTML}</span>`;
        });

        cleanHtml += '</p>';
    });

    return cleanHtml;
};

/* eslint-disable no-restricted-globals */

/**
 * HIGH-FIDELITY BLUEPRINT WORKER
 * This worker processes the HTML string to identify [PLACEHOLDERS] 
 * and wraps them in metadata for the Variables Sidebar.
 */
self.onmessage = (e) => {
    const { htmlContent } = e.data;

    try {
        if (!htmlContent) {
            self.postMessage({ result: '' });
            return;
        }

        // 1. Identify high-fidelity markers. If it's a blueprint, we PRESERVE it.
        if (htmlContent.includes('content-element') || htmlContent.includes('pdf-page')) {
            
            // 2. Identify [PLACEHOLDERS] and wrap them in a 'variable' span.
            // This allows the Editor.jsx to 'see' them and list them in the sidebar.
            const enrichedHtml = htmlContent.replace(/\[([^\]<>]+)\]/g, (match, label) => {
                const cleanLabel = label.trim();
                // Create a unique key for state management (e.g., [Party Name] -> party_name)
                const key = cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
                
                return `<span class="variable" 
                              data-key="${key}" 
                              data-label="${cleanLabel}" 
                              contenteditable="false">[${cleanLabel}]</span>`;
            });

            self.postMessage({ result: enrichedHtml });
        } else {
            // 3. Fallback for standard, non-absolute text
            self.postMessage({ result: htmlContent });
        }
    } catch (e) {
        console.error("Worker Error:", e);
        // If we fail, return the original content so the user sees something
        self.postMessage({ result: htmlContent });
    }
};
