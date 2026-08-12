(function(window, undefined) {
    var pollTimer = null;
    var lastSelectionSnapshot = '';
    var suppressSelectionSyncUntil = 0;

    var parentOrigin = '*';
    try {
        if (document.referrer) {
            parentOrigin = new URL(document.referrer).origin;
        }
    } catch (e) {}

    function postToParent(payload) {
        window.top.postMessage(payload, '*');
    }

    function getSelectedText(callback) {
        window.Asc.plugin.executeMethod('GetSelectedText', [{
            Numbering: false,
            Math: false,
            TableCellSeparator: '\n',
            ParaSeparator: '\n',
            TabSymbol: String.fromCharCode(9)
        }], function(text) {
            callback(String(text || ''));
        });
    }

    function escapeXml(unsafe) {
        return String(unsafe || '').replace(/[<>&'\"]/g, function(c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    function normalizeWhitespace(text) {
        return String(text || '')
            .replace(/\r\n?/g, '\n')
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/\n{3,}/g, '\n\n');
    }

    function isHeadingLine(line) {
        var trimmed = String(line || '').trim();
        if (!trimmed) return false;

        if (/^(ARTICLE|SECTION|CLAUSE|INTRODUCTION|BACKGROUND|SUMMARY|CONCLUSION|PRAYER|RELIEF|DEFINITIONS)\b/i.test(trimmed)) {
            return true;
        }

        return trimmed.length <= 60 && !/[.!?]$/.test(trimmed) && trimmed === trimmed.toUpperCase();
    }

    function isListLine(line) {
        return /^\s*(?:\d+[\).]|[a-zA-Z][\).]|[-*])\s+/.test(String(line || ''));
    }

    function formatPlainText(text) {
        var normalized = normalizeWhitespace(text);
        var lines = normalized.split('\n');
        return lines.map(function(line) {
            return String(line || '').replace(/[ \t]{2,}/g, ' ').trimEnd();
        }).join('\n').trim();
    }

    function createCaseNameRuns(line) {
        var caseRegex = /\b([A-Z][A-Za-z0-9.&'/-]*(?:\s+[A-Z][A-Za-z0-9.&'/-]*)*)\s+v\.?\s+([A-Z][A-Za-z0-9.&'/-]*(?:\s+[A-Z][A-Za-z0-9.&'/-]*)*)\b|\bIn\s+re\s+([A-Z][A-Za-z0-9.&'/-]*(?:\s+[A-Z][A-Za-z0-9.&'/-]*)*)\b/g;
        var runXml = '';
        var cursor = 0;
        var match;

        function appendRun(text, bold, italic) {
            if (!text) return;
            runXml += '<w:r><w:rPr>';
            if (bold) runXml += '<w:b/>';
            if (italic) runXml += '<w:i/>';
            runXml += '</w:rPr><w:t xml:space="preserve">' + escapeXml(text) + '</w:t></w:r>';
        }

        while ((match = caseRegex.exec(line)) !== null) {
            if (match.index > cursor) {
                appendRun(line.slice(cursor, match.index), false, false);
            }
            appendRun(match[0], true, true);
            cursor = match.index + match[0].length;
        }

        if (cursor < line.length) {
            appendRun(line.slice(cursor), false, false);
        }

        return runXml || '<w:r><w:t xml:space="preserve">' + escapeXml(line) + '</w:t></w:r>';
    }

    function buildOoxml(text) {
        var paragraphs = [];
        var lines = normalizeWhitespace(text).split('\n');

        lines.forEach(function(rawLine) {
            var line = String(rawLine || '').trim();
            if (!line) {
                paragraphs.push('<w:p/>');
                return;
            }

            var pPr = '';
            var runs = '';

            if (isHeadingLine(line)) {
                runs = '<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">' + escapeXml(line) + '</w:t></w:r>';
                pPr = '<w:pPr><w:jc w:val="left"/></w:pPr>';
            } else {
                runs = createCaseNameRuns(line);
            }

            paragraphs.push('<w:p>' + pPr + runs + '</w:p>');
        });

        return '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
            paragraphs.join('') +
            '<w:sectPr/></w:body></w:document>';
    }

    function emitSelectionState(text) {
        var snapshot = String(text || '').replace(/\s+$/g, '');
        if (snapshot === lastSelectionSnapshot) return;
        lastSelectionSnapshot = snapshot;
        postToParent({
            type: 'ONLYOFFICE_SELECTION_STATE',
            text: snapshot,
            hasSelection: !!snapshot.trim()
        });
    }

    function syncCurrentSelection() {
        var now = Date.now();
        if (now < suppressSelectionSyncUntil) return;

        getSelectedText(function(text) {
            emitSelectionState(text);
        });
    }

    function startSelectionWatcher() {
        if (pollTimer) return;
        syncCurrentSelection();
        pollTimer = window.setInterval(syncCurrentSelection, 400);
    }

    function stopSelectionWatcher() {
        if (pollTimer) {
            window.clearInterval(pollTimer);
            pollTimer = null;
        }
        lastSelectionSnapshot = '';
    }

    function applyAutoFormat() {
        getSelectedText(function(selectedText) {
            var cleaned = formatPlainText(selectedText);

            if (!cleaned.trim()) {
                postToParent({
                    type: 'ONLYOFFICE_AUTOFORMAT_DONE',
                    applied: false,
                    reason: 'empty-selection'
                });
                return;
            }

            suppressSelectionSyncUntil = Date.now() + 1200;
            lastSelectionSnapshot = '';

            try {
                window.Asc.plugin.executeMethod('PasteText', [cleaned]);
                postToParent({
                    type: 'ONLYOFFICE_AUTOFORMAT_DONE',
                    applied: true
                });
            } catch (error) {
                postToParent({
                    type: 'ONLYOFFICE_AUTOFORMAT_ERROR',
                    message: error && error.message ? error.message : 'Auto format failed.'
                });
            }
        });
    }

    function requestEnhanceSelection() {
        getSelectedText(function(selectedText) {
            var cleaned = formatPlainText(selectedText);
            postToParent({
                type: 'ONLYOFFICE_ENHANCE_SELECTION',
                text: cleaned || ''
            });
        });
    }

    window.Asc.plugin.init = function() {
        postToParent({ type: 'ONLYOFFICE_PLUGIN_READY' });
        startSelectionWatcher();
    };

    window.Asc.plugin.button = function(id) {
        stopSelectionWatcher();
        this.executeCommand('close', '');
    };

    window.addEventListener('message', function(event) {
        if (!event.data) return;

        if (event.data.type === 'ONLYOFFICE_GET_SELECTION') {
            getSelectedText(function(text) {
                postToParent({
                    type: 'ONLYOFFICE_SELECTION',
                    text: text || ''
                });
            });
        } else if (event.data.type === 'ONLYOFFICE_POLL_SELECTION') {
            getSelectedText(function(text) {
                postToParent({
                    type: 'ONLYOFFICE_SELECTION_STATE',
                    text: text || '',
                    hasSelection: !!String(text || '').trim()
                });
            });
        } else if (event.data.type === 'ONLYOFFICE_INSERT_TEXT') {
            window.Asc.plugin.executeMethod('PasteText', [event.data.text]);
        } else if (event.data.type === 'ONLYOFFICE_AUTO_FORMAT_SELECTION') {
            applyAutoFormat();
        } else if (event.data.type === 'ONLYOFFICE_ENHANCE_WITH_AI') {
            requestEnhanceSelection();
        }
    });
})(window, undefined);
