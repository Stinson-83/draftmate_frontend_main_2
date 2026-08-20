(function(window, undefined) {
    var selectedText    = "";
    var activeControlTag= "";
    var documentKey     = "";
    var draftId         = "";
    var changesList     = [];

    function esc(s) {
        return String(s || "")
            .replace(/&/g,"&amp;").replace(/</g,"&lt;")
            .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }

    // Collapses multiple whitespaces/newlines/nbsps into single space, performs case-insensitive
    // search, and maps the matching indices back to the original un-collapsed text block coordinates.
    function findFuzzyMatch(text, searchStr) {
        if (!text || !searchStr) return null;
        var cleanText   = text.replace(/[\s\u00a0\r\n]+/g, " ").toLowerCase();
        var cleanSearch = searchStr.replace(/[\s\u00a0\r\n]+/g, " ").toLowerCase().trim();

        var idx = cleanText.indexOf(cleanSearch);
        if (idx === -1) return null;

        var origStart = -1;
        var origEnd   = -1;

        var cleanCharCount = 0;
        for (var i = 0; i < text.length; i++) {
            var char = text[i];
            var isWhitespace = /[\s\u00a0\r\n]/.test(char);

            if (cleanCharCount === idx && origStart === -1) {
                origStart = i;
            }

            if (origStart !== -1) {
                if (cleanCharCount >= idx + cleanSearch.length) {
                    origEnd = i;
                    break;
                }
            }

            if (isWhitespace) {
                var nextChar = text[i + 1];
                var nextIsWhitespace = nextChar && /[\s\u00a0\r\n]/.test(nextChar);
                if (!nextIsWhitespace) {
                    cleanCharCount++;
                }
            } else {
                cleanCharCount++;
            }
        }

        if (origStart !== -1) {
            if (origEnd === -1) origEnd = text.length;
            return { start: origStart, end: origEnd };
        }
        return null;
    }

    // ─── Initialize ────────────────────────────────────────────────────────────
    window.Asc.plugin.init = function() {
        document.getElementById("btn-capture").addEventListener("click", captureSelection);
        document.getElementById("btn-generate").addEventListener("click", generateRedline);

        window.addEventListener("message", function(e) {
            if (e.data && e.data.type === "REDLINE_METADATA") {
                draftId     = e.data.draftId     || "";
                documentKey = e.data.documentKey || "";
                loadChanges();
            }
        });

        window.top.postMessage({ type: "REDLINE_PLUGIN_READY" }, "*");
        var n = 0, t = setInterval(function() {
            if (++n > 15 || draftId || documentKey) { clearInterval(t); return; }
            try { window.top.postMessage({ type: "REDLINE_PLUGIN_READY" }, "*"); } catch(err) {}
        }, 1000);
    };

    function getTargetId() {
        if (draftId) return draftId;
        if (documentKey) return documentKey;
        try {
            var ref = document.referrer || (window.top && window.top.location ? window.top.location.href : "");
            if (ref) {
                var p = new URLSearchParams(new URL(ref).search);
                return p.get("draftId") || p.get("documentKey") || p.get("id") || "";
            }
        } catch(e) {}
        return "";
    }

    // ─── 1. Capture Selection ──────────────────────────────────────────────────
    function captureSelection() {
        var statusDiv = document.getElementById("selection-status");
        statusDiv.innerHTML = "Capturing...";

        window.Asc.plugin.executeMethod("GetSelectedText", [{
            Numbering: false, Math: false,
            TableCellSeparator: "\n", ParaSeparator: "\n", TabSymbol: "\t"
        }], function(text) {
            var rawText = String(text || "").trim();
            if (!rawText) {
                statusDiv.innerHTML = "<span style='color:#ef4444'>No text selected. Highlight text and try again.</span>";
                document.getElementById("btn-generate").disabled = true;
                return;
            }

            selectedText = rawText;
            statusDiv.innerHTML = '"' + selectedText.substring(0, 120) + (selectedText.length > 120 ? "…" : "") + '"';
            document.getElementById("btn-generate").disabled = false;

            // Stamp content control tag for precise position tracking
            var tag = "chg_" + Math.random().toString(36).substring(2, 11);
            activeControlTag = tag;
            window.Asc.plugin.executeMethod("AddContentControl", [1, { Tag: tag, Lock: 0 }], function() {
                activeControlTag = tag;
            });
        });
    }

    // ─── 2. Generate Redline Proposal ──────────────────────────────────────────
    // Sends proposal to backend drafter, which uses Gemini LLM
    function generateRedline() {
        var btn         = document.getElementById("btn-generate");
        var instruction = document.getElementById("ai-instruction").value.trim();
        if (!instruction) { alert("Please enter an instruction."); return; }
        btn.disabled  = true;
        btn.innerHTML = "<span class='loader'></span> Generating...";

        fetch(window.location.origin + "/drafter/v2/redline/propose", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                draft_id     : getTargetId(),
                paragraph_id : activeControlTag || "chg_auto",
                selected_text: selectedText,
                instruction  : instruction
            })
        })
        .then(function(r) {
            if (!r.ok) return r.json().then(function(e) { throw new Error(e.detail || r.status); });
            return r.json();
        })
        .then(function() {
            document.getElementById("ai-instruction").value  = "";
            document.getElementById("btn-generate").disabled = true;
            document.getElementById("selection-status").innerHTML = "Highlight text and click Capture.";
            selectedText     = "";
            activeControlTag = "";
            loadChanges();
        })
        .catch(function(err) { alert("Failed: " + err.message); })
        .finally(function() { btn.disabled = false; btn.innerText = "Generate Redline Proposal"; });
    }

    // ─── 3. Load changes ───────────────────────────────────────────────────────
    function loadChanges() {
        var id = getTargetId();
        if (!id) return;
        fetch(window.location.origin + "/drafter/v2/redline/changes/" + id)
            .then(function(r) { return r.json(); })
            .then(function(d) { changesList = d.changes || []; renderChangesList(); })
            .catch(function() {});
    }

    // ─── 4. Render Review Panel ────────────────────────────────────────────────
    function renderChangesList() {
        var container = document.getElementById("changes-list");
        container.innerHTML = "";
        var pending = changesList.filter(function(c) { return c.status === "pending"; });
        if (!pending.length) {
            container.innerHTML = "<div style='font-style:italic;color:#64748b;font-size:11px;text-align:center;margin:1rem 0'>No pending tracked changes.</div>";
            return;
        }
        pending.forEach(function(c) {
            var card = document.createElement("div");
            card.className = "change-card";
            card.innerHTML =
                '<div class="change-summary">' + esc(c.summary || "") + '</div>' +
                '<div class="change-details">' +
                    '<span style="text-decoration:line-through;color:#f87171">' + esc(c.original_text || "") + '</span>' +
                    ' &rarr; ' +
                    '<span style="text-decoration:underline;color:#34d399">' + esc(c.new_text || "") + '</span>' +
                '</div>' +
                '<div class="change-actions">' +
                    '<button class="accept-btn">✓ Accept</button>' +
                    '<button class="reject-btn">✗ Reject</button>' +
                '</div>';

            (function(changeId, ctrlTag, origText, newText) {
                card.querySelector(".accept-btn").addEventListener("click", function() {
                    acceptChange(card, changeId, ctrlTag, origText, newText);
                });
                card.querySelector(".reject-btn").addEventListener("click", function() {
                    rejectChange(card, changeId, ctrlTag);
                });
            })(c.id, c.paragraph_id || "", c.original_text || "", c.new_text || "");

            container.appendChild(card);
        });
    }

    // ─── 5. ACCEPT — Locate selection first, then route PasteText via background plugin ──
    function acceptChange(card, changeId, ctrlTag, origText, newText) {
        var btns = card.querySelectorAll("button");
        btns.forEach(function(b) { b.disabled = true; });
        card.style.opacity = "0.7";

        var oldErr = card.querySelector(".error-label");
        if (oldErr) oldErr.remove();

        window.Asc.scope.ctrlTag  = ctrlTag;
        window.Asc.scope.origText = origText;

        // Locate and highlight text
        window.Asc.plugin.callCommand(function() {
            var oDoc = Api.GetDocument();
            var found = false;

            // Strategy 1: Content control lookup by tag
            if (Asc.scope.ctrlTag && Asc.scope.ctrlTag !== "chg_auto") {
                var ctrls = oDoc.GetContentControlsByTag(Asc.scope.ctrlTag);
                if (ctrls && ctrls.length > 0) {
                    ctrls[0].GetRange().Select();
                    found = true;
                }
            }

            // Strategy 2: Walk paragraphs/cells recursively, matching with our fuzzy mapper
            if (!found && Asc.scope.origText) {
                // Scope functions cannot be called from within callCommand directly, 
                // so we include the mapping algorithm inline inside the callCommand context.
                function matchFuzzy(text, searchStr) {
                    if (!text || !searchStr) return null;
                    var cleanText   = text.replace(/[\s\u00a0\r\n]+/g, " ").toLowerCase();
                    var cleanSearch = searchStr.replace(/[\s\u00a0\r\n]+/g, " ").toLowerCase().trim();

                    var idx = cleanText.indexOf(cleanSearch);
                    if (idx === -1) return null;

                    var origStart = -1;
                    var origEnd   = -1;

                    var cleanCharCount = 0;
                    for (var i = 0; i < text.length; i++) {
                        var char = text[i];
                        var isWhitespace = /[\s\u00a0\r\n]/.test(char);

                        if (cleanCharCount === idx && origStart === -1) {
                            origStart = i;
                        }

                        if (origStart !== -1) {
                            if (cleanCharCount >= idx + cleanSearch.length) {
                                origEnd = i;
                                break;
                            }
                        }

                        if (isWhitespace) {
                            var nextChar = text[i + 1];
                            var nextIsWhitespace = nextChar && /[\s\u00a0\r\n]/.test(nextChar);
                            if (!nextIsWhitespace) {
                                cleanCharCount++;
                            }
                        } else {
                            cleanCharCount++;
                        }
                    }

                    if (origStart !== -1) {
                        if (origEnd === -1) origEnd = text.length;
                        return { start: origStart, end: origEnd };
                    }
                    return null;
                }

                function walkParagraphs(oEl, searchStr) {
                    if (!oEl) return false;
                    var type = oEl.GetClassType ? oEl.GetClassType() : "";

                    if (type === "paragraph") {
                        var text = oEl.GetText ? oEl.GetText() : "";
                        var match = matchFuzzy(text, searchStr);
                        if (match) {
                            var oRange = oEl.GetRange(match.start, match.end - 1);
                            if (oRange) {
                                oRange.Select();
                                return true;
                            }
                        }
                    } else if (type === "table") {
                        var nRows = oEl.GetRowsCount ? oEl.GetRowsCount() : 0;
                        for (var r = 0; r < nRows; r++) {
                            var oRow = oEl.GetRow(r);
                            if (!oRow) continue;
                            var nCells = oRow.GetCellsCount ? oRow.GetCellsCount() : 0;
                            for (var c = 0; c < nCells; c++) {
                                var oCell = oRow.GetCell(c);
                                if (!oCell) continue;
                                var nParas = oCell.GetElementsCount ? oCell.GetElementsCount() : 0;
                                for (var p = 0; p < nParas; p++) {
                                    var oPara = oCell.GetElement(p);
                                    if (oPara && walkParagraphs(oPara, searchStr)) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                    return false;
                }

                var nTop = oDoc.GetElementsCount();
                for (var i = 0; i < nTop; i++) {
                    if (walkParagraphs(oDoc.GetElement(i), Asc.scope.origText)) {
                        found = true;
                        break;
                    }
                }
            }

            return found;
        }, false, true, function(found) {

            // Readiness / Find check guard
            if (!found) {
                card.style.opacity = "1";
                card.style.borderColor = "#ef4444";
                btns.forEach(function(b) { b.disabled = false; });

                var errLabel = document.createElement("div");
                errLabel.className = "error-label";
                errLabel.style = "color:#f87171;font-size:11px;font-weight:600;margin-top:0.4rem;";
                errLabel.innerText = "✗ Text block position not found in document.";
                card.appendChild(errLabel);
                return;
            }

            // Selection is now active. We broadcast the insert event to the background script
            // code.js (the assistant plugin) which runs PasteText under its privileged window context.
            // This is IDENTICAL to the "Insert Into Document" path.
            var routed = false;
            try {
                var iframes = window.top.document.querySelectorAll("iframe");
                for (var i = 0; i < iframes.length; i++) {
                    try {
                        if (iframes[i].contentWindow) {
                            iframes[i].contentWindow.postMessage({
                                type: "ONLYOFFICE_INSERT_TEXT",
                                text: newText
                            }, "*");
                            routed = true;
                        }
                    } catch(e) {}
                }
            } catch(err) {
                console.error("Failed to post message to background plugin:", err);
            }

            if (!routed) {
                // Fallback to direct executeMethod if iframe posting fails
                window.Asc.plugin.executeMethod("PasteText", [newText]);
            }

            // Cleanup content control tag if it still exists (non-fatal)
            if (ctrlTag && ctrlTag !== "chg_auto") {
                window.Asc.plugin.executeMethod("GetAllContentControls", [], function(ctrls) {
                    for (var i = 0; i < (ctrls || []).length; i++) {
                        if (ctrls[i].Tag === ctrlTag) {
                            window.Asc.plugin.executeMethod("RemoveContentControl", [ctrls[i].Id]);
                            break;
                        }
                    }
                });
            }

            // Update DB status to accepted
            fetch(window.location.origin + "/drafter/v2/redline/changes/" + changeId, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "accepted" })
            }).catch(function() {});

            // Show success
            card.innerHTML =
                '<div style="color:#34d399;font-weight:700;font-size:12px;">✓ Accepted</div>' +
                '<div style="color:#64748b;font-size:10px;margin-top:0.25rem;">Change applied at selection position.</div>';
            card.style.opacity = "1";
            card.style.borderColor = "rgba(52,211,153,0.4)";
            setTimeout(loadChanges, 1500);
        });
    }

    // ─── 6. REJECT ─────────────────────────────────────────────────────────────
    function rejectChange(card, changeId, ctrlTag) {
        card.querySelectorAll("button").forEach(function(b) { b.disabled = true; });

        if (ctrlTag && ctrlTag !== "chg_auto") {
            window.Asc.plugin.executeMethod("GetAllContentControls", [], function(ctrls) {
                for (var i = 0; i < (ctrls || []).length; i++) {
                    if (ctrls[i].Tag === ctrlTag) {
                        window.Asc.plugin.executeMethod("RemoveContentControl", [ctrls[i].Id]);
                        break;
                    }
                }
            });
        }

        fetch(window.location.origin + "/drafter/v2/redline/changes/" + changeId, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "rejected" })
        }).catch(function() {});

        card.innerHTML =
            '<div style="color:#94a3b8;font-weight:700;font-size:12px;">✗ Rejected</div>' +
            '<div style="color:#64748b;font-size:10px;margin-top:0.25rem;">Change dismissed. Document unchanged.</div>';
        card.style.borderColor = "rgba(239,68,68,0.3)";
        setTimeout(loadChanges, 1500);
    }

})(window, undefined);
