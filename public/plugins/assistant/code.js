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

    function convertUrlsToLinksInHtml(htmlContent) {
        if (!htmlContent) return '';

        // 1. Convert markdown style links: [Label](http://...)
        var mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+|www\.[^\s\)]+|indiankanoon\.org\/[^\s\)]+)\)/gi;
        var processed = htmlContent.replace(mdLinkRegex, function(_, label, rawUrl) {
            var fullUrl = rawUrl.startsWith('http') ? rawUrl : ('https://' + rawUrl);
            return '<a href="' + fullUrl + '" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 500;">' + label + '</a>';
        });

        // 2. Convert bare URLs: http://..., https://..., or indiankanoon.org/doc/...
        var bareUrlRegex = /(?<!href=")(https?:\/\/[^\s<>\)\]]+|(?<!\/)\b(?:www\.)?indiankanoon\.org\/[^\s<>\)\]]+)/gi;
        processed = processed.replace(bareUrlRegex, function(match) {
            var fullUrl = match.startsWith('http') ? match : ('https://' + match);
            return '<a href="' + fullUrl + '" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 500;">' + match + '</a>';
        });

        return processed;
    }

    function formatCaseNamesInHtml(escapedText) {
        var caseRegex = /\b([A-Z][A-Za-z0-9.&'/-]*(?:\s+[A-Z][A-Za-z0-9.&'/-]*)*)\s+(?:vs\.?|v\.?)\s+([A-Z][A-Za-z0-9.&'/-]*(?:\s+[A-Z][A-Za-z0-9.&'/-]*)*)\b|\bIn\s+re\s+([A-Z][A-Za-z0-9.&'/-]*(?:\s+[A-Z][A-Za-z0-9.&'/-]*)*)\b/g;
        return escapedText.replace(caseRegex, function(match) {
            return '<em style="font-style: italic; font-weight: 600;">' + match + '</em>';
        });
    }

    function formatLegalDocumentHtml(text) {
        var normalized = normalizeWhitespace(text);
        if (!normalized.trim()) return '';

        var lines = normalized.split('\n');
        var htmlBlocks = [];
        var currentPara = [];

        function flushPara() {
            if (currentPara.length === 0) return;
            var paraText = currentPara.join(' ').trim();
            currentPara = [];
            if (!paraText) return;

            var escaped = escapeXml(paraText);

            var labelMatch = paraText.match(/^([A-Z\s]{2,30}|[A-Z][a-z\s]{2,25}):\s*(.*)$/);
            if (labelMatch) {
                var label = escapeXml(labelMatch[1]);
                var val = convertUrlsToLinksInHtml(formatCaseNamesInHtml(escapeXml(labelMatch[2])));
                htmlBlocks.push(
                    '<p style="font-size: 11pt; line-height: 1.5; color: #111827; margin-top: 0pt; margin-bottom: 6pt; text-align: justify;">' +
                    '<strong style="font-weight: bold; color: #000000;">' + label + ':</strong> ' + (val || '&nbsp;') +
                    '</p>'
                );
                return;
            }

            if (isHeadingLine(paraText)) {
                var formattedHeader = convertUrlsToLinksInHtml(escaped);
                var isMainTitle = /^(IN THE|SUPREME COURT|HIGH COURT|BEFORE THE|PETITION|MEMORANDUM|DEED|AGREEMENT|SPECIAL LEAVE|RECORD OF PROCEEDINGS)\b/i.test(paraText.trim());
                if (isMainTitle) {
                    htmlBlocks.push(
                        '<h1 style="font-size: 14pt; font-weight: bold; color: #000000; margin-top: 14pt; margin-bottom: 6pt; line-height: 1.3; text-align: center;">' +
                        formattedHeader +
                        '</h1>'
                    );
                } else {
                    htmlBlocks.push(
                        '<h3 style="font-size: 11.5pt; font-weight: bold; color: #000000; margin-top: 10pt; margin-bottom: 4pt; line-height: 1.3; text-align: left;">' +
                        formattedHeader +
                        '</h3>'
                    );
                }
                return;
            }

            var formattedBody = convertUrlsToLinksInHtml(formatCaseNamesInHtml(escaped));
            htmlBlocks.push(
                '<p style="font-size: 11pt; line-height: 1.5; color: #111827; margin-top: 0pt; margin-bottom: 6pt; text-align: justify;">' +
                formattedBody +
                '</p>'
            );
        }

        lines.forEach(function(rawLine) {
            var line = String(rawLine || '').trim();
            if (!line) {
                flushPara();
            } else if (isHeadingLine(line) || /^([A-Z\s]{2,30}|[A-Z][a-z\s]{2,25}):\s*/.test(line)) {
                flushPara();
                currentPara.push(line);
                flushPara();
            } else {
                currentPara.push(line);
            }
        });
        flushPara();

        return '<div style="font-family: inherit; font-size: 11pt; line-height: 1.5; color: #111827;">\n' + htmlBlocks.join('\n') + '\n</div>';
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

            suppressSelectionSyncUntil = Date.now() + 1500;
            lastSelectionSnapshot = '';

            var htmlPayload = formatLegalDocumentHtml(selectedText);

            try {
                if (htmlPayload) {
                    window.Asc.plugin.executeMethod('PasteHtml', [htmlPayload]);
                } else {
                    window.Asc.plugin.executeMethod('PasteText', [cleaned]);
                }
                postToParent({
                    type: 'ONLYOFFICE_AUTOFORMAT_DONE',
                    applied: true
                });
            } catch (error) {
                console.warn('[ONLYOFFICE Plugin] PasteHtml auto-format failed, falling back to PasteText:', error);
                try {
                    window.Asc.plugin.executeMethod('PasteText', [cleaned]);
                    postToParent({
                        type: 'ONLYOFFICE_AUTOFORMAT_DONE',
                        applied: true
                    });
                } catch (fallbackErr) {
                    postToParent({
                        type: 'ONLYOFFICE_AUTOFORMAT_ERROR',
                        message: fallbackErr && fallbackErr.message ? fallbackErr.message : 'Auto format failed.'
                    });
                }
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

    function detectVariablesFromDocument() {
        try {
            window.Asc.plugin.callCommand(function() {
                var oDocument = Api.GetDocument();
                var foundVars = [];
                var ignoreSet = {
                    'THE': 1, 'AND': 1, 'FOR': 1, 'THAT': 1, 'THIS': 1, 'WITH': 1, 'FROM': 1,
                    'SHALL': 1, 'BEING': 1, 'UNDER': 1, 'UPON': 1, 'SAID': 1, 'HERETO': 1,
                    'OTHER': 1, 'COURT': 1, 'HIGH': 1, 'INDIA': 1, 'ACT': 1, 'SECTION': 1
                };

                // 1. Scan Content Controls by tag
                var aControls = oDocument.GetAllContentControls();
                if (aControls && aControls.length > 0) {
                    for (var i = 0; i < aControls.length; i++) {
                        var tag = aControls[i].GetTag();
                        if (tag && tag.trim() && foundVars.indexOf(tag.trim()) === -1) {
                            foundVars.push(tag.trim());
                        }
                    }
                }

                // 2. Scan Document Text for ALL_CAPS placeholders / bracketed tags
                var docText = oDocument.GetText();
                if (docText) {
                    var regex = /\[([A-Z0-9_]{2,40})\]|\{([A-Z0-9_]{2,40})\}|\b([A-Z0-9_]{3,35})\b/g;
                    var match;
                    while ((match = regex.exec(docText)) !== null) {
                        var v = (match[1] || match[2] || match[3] || '').trim();
                        if (v && v.length >= 3 && !ignoreSet[v] && foundVars.indexOf(v) === -1) {
                            if (/^[A-Z0-9_]+$/.test(v)) {
                                foundVars.push(v);
                            }
                        }
                    }
                }
                return foundVars;
            }, false, true, function(result) {
                if (Array.isArray(result) && result.length > 0) {
                    postToParent({
                        type: 'ONLYOFFICE_VARIABLES_DETECTED',
                        variables: result
                    });
                }
            });
        } catch (e) {
            console.warn('[ONLYOFFICE Plugin] Variable detection failed:', e);
        }
    }

    function navigateToVariableInDocument(tagToFind) {
        if (!tagToFind) return;
        try {
            window.Asc.scope.targetTag = tagToFind;
            window.Asc.plugin.callCommand(function() {
                var oDocument = Api.GetDocument();
                var target = Asc.scope.targetTag;
                if (!target) return;

                // 1. Try content control by tag
                var aContentControls = oDocument.GetContentControlsByTag(target);
                if (aContentControls && aContentControls.length > 0) {
                    aContentControls[0].GetRange().Select();
                    return;
                }

                // 2. Try exact search for tag or [tag] or {tag}
                var aSearch = oDocument.Search(target, false);
                if (aSearch && aSearch.length > 0) {
                    aSearch[0].Select();
                    return;
                }

                var bracketSearch = oDocument.Search('[' + target + ']', false);
                if (bracketSearch && bracketSearch.length > 0) {
                    bracketSearch[0].Select();
                }
            }, false);
        } catch (e) {
            console.warn('[ONLYOFFICE Plugin] Navigate to variable failed:', e);
        }
    }

    window.Asc.plugin.init = function() {
        postToParent({ type: 'ONLYOFFICE_PLUGIN_READY' });
        startSelectionWatcher();
        setTimeout(function() {
            detectVariablesFromDocument();
        }, 1200);
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
        } else if (event.data.type === 'ONLYOFFICE_INSERT_HTML') {
            var rawHtml = String(event.data.html || '');
            console.log('[ONLYOFFICE Plugin] Received ONLYOFFICE_INSERT_HTML payload (length: ' + rawHtml.length + ')');
            try {
                window.Asc.plugin.executeMethod('PasteHtml', [rawHtml]);
                console.log('[ONLYOFFICE Plugin] PasteHtml executed successfully.');
            } catch (err) {
                console.error('[ONLYOFFICE Plugin] PasteHtml execution failed:', err);
            }
        } else if (event.data.type === 'ONLYOFFICE_INSERT_TEXT') {
            var rawText = String(event.data.text || '');
            var formattedHtml = formatLegalDocumentHtml(rawText);
            try {
                if (formattedHtml) {
                    window.Asc.plugin.executeMethod('PasteHtml', [formattedHtml]);
                } else {
                    window.Asc.plugin.executeMethod('PasteText', [rawText]);
                }
            } catch (err) {
                console.warn('[ONLYOFFICE Plugin] PasteHtml failed in ONLYOFFICE_INSERT_TEXT, falling back to PasteText:', err);
                try {
                    window.Asc.plugin.executeMethod('PasteText', [rawText]);
                } catch (e) {}
            }
        } else if (event.data.type === 'ONLYOFFICE_AUTO_FORMAT_SELECTION') {
            applyAutoFormat();
        } else if (event.data.type === 'ONLYOFFICE_ENHANCE_WITH_AI') {
            requestEnhanceSelection();
        } else if (event.data.type === 'ONLYOFFICE_DETECT_VARIABLES') {
            detectVariablesFromDocument();
        } else if (event.data.type === 'ONLYOFFICE_NAVIGATE_TO_VARIABLE') {
            navigateToVariableInDocument(event.data.tag);
        }
    });
})(window, undefined);
