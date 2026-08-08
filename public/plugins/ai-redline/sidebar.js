(function(window, undefined) {
    let selectedText = "";
    let activeControlId = "";
    let documentKey = "";
    let draftId = "";
    let changesList = [];

    // Initialize ONLYOFFICE Plugin
    window.Asc.plugin.init = function() {
        documentKey = window.Asc.plugin.info.documentKey || "";
        // Look up active draft ID from OnlyOffice config if available
        draftId = window.Asc.plugin.info.editorConfig?.customization?.logo?.url || ""; 

        // Bind DOM events
        document.getElementById("btn-capture").addEventListener("click", captureSelection);
        document.getElementById("btn-generate").addEventListener("click", generateRedline);
        
        // Load existing changes
        loadChanges();
    };

    // 1. Capture text selection
    function captureSelection() {
        const statusDiv = document.getElementById("selection-status");
        statusDiv.innerHTML = "Capturing...";
        
        window.Asc.plugin.executeMethod("GetSelectedText", [], function(text) {
            if (!text || !text.trim()) {
                statusDiv.innerHTML = "<span style='color:#ef4444;'>No text selected. Highlight text in editor and try again.</span>";
                document.getElementById("btn-generate").disabled = true;
                return;
            }

            selectedText = text.trim();
            statusDiv.innerHTML = `"${selectedText.substring(0, 100)}${selectedText.length > 100 ? '...' : ''}"`;
            
            // Wrap range in content control to lock bounds
            window.Asc.plugin.callCommand(function() {
                var oDocument = Api.GetDocument();
                var oRange = oDocument.GetRangeBySelect();
                var controlId = "chg_" + Math.random().toString(36).substring(2, 11);
                
                var oContentControl = Api.CreateContentControl(2); // Block content control
                oContentControl.SetTag(controlId);
                oContentControl.SetLock(1); // Content locking
                oRange.InsertContentControl(oContentControl);
                
                return { controlId: controlId };
            }, false, true, function(result) {
                activeControlId = result.controlId;
                document.getElementById("btn-generate").disabled = false;
            });
        });
    }

    // 2. Propose AI Redline
    async function generateRedline() {
        const btn = document.getElementById("btn-generate");
        const instruction = document.getElementById("ai-instruction").value.trim();
        if (!instruction) {
            alert("Please enter an instruction for the AI.");
            return;
        }

        btn.disabled = true;
        btn.innerHTML = "<span class='loader'></span> Generating...";

        try {
            // Find base origin URL
            const apiBase = window.location.origin;
            const resp = await fetch(`${apiBase}/drafter/v2/redline/propose`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("session_id") ? `Bearer ${localStorage.getItem("session_id")}` : ""
                },
                body: JSON.stringify({
                    draft_id: draftId || documentKey, // Fallback to key
                    paragraph_id: activeControlId,
                    selected_text: selectedText,
                    instruction: instruction
                })
            });

            if (!resp.ok) {
                throw new Error("Redlining generation failed.");
            }

            const data = await resp.json();
            
            // Render diff on ONLYOFFICE editor
            applyDiffToEditor(activeControlId, data.opcodes);
            
            // Reset input fields
            document.getElementById("ai-instruction").value = "";
            document.getElementById("btn-generate").disabled = true;
            document.getElementById("selection-status").innerHTML = "Highlight text and click Capture.";
            
            toastMessage("Redline suggestion generated!");
            loadChanges();
        } catch (err) {
            console.error(err);
            alert("AI Redlining failed: " + err.message);
            // Cleanup empty content control on failure
            removeControl(activeControlId);
        } finally {
            btn.disabled = false;
            btn.innerText = "Generate Redline Proposal";
        }
    }

    // 3. Render redline markup inside OnlyOffice Content Control
    function applyDiffToEditor(controlId, opcodes) {
        window.Asc.plugin.callCommand(function(data) {
            var oDocument = Api.GetDocument();
            var aContentControls = oDocument.GetContentControlsByTag(data.controlId);
            if (aContentControls.length > 0) {
                var oControl = aContentControls[0];
                var oRange = oControl.GetRange();
                oRange.Delete(); // Clear original text block
                
                // Construct styled runs
                for (var i = 0; i < data.opcodes.length; i++) {
                    var op = data.opcodes[i];
                    if (op.op === "equal") {
                        var run = oRange.AddRun();
                        run.AddText(op.orig_chunk);
                    } else if (op.op === "delete") {
                        var run = oRange.AddRun();
                        run.AddText(op.orig_chunk);
                        run.SetStrikeout(true);
                        run.SetColor(239, 68, 68); // Red Strikethrough
                    } else if (op.op === "insert") {
                        var run = oRange.AddRun();
                        run.AddText(op.rev_chunk);
                        run.SetUnderline(true);
                        run.SetColor(16, 185, 129); // Green Underline
                    }
                }
            }
        }, false, true);
    }

    // 4. Fetch changes list from backend
    async function loadChanges() {
        try {
            const apiBase = window.location.origin;
            const resp = await fetch(`${apiBase}/drafter/v2/redline/changes/${draftId || documentKey}`, {
                headers: {
                    "Authorization": localStorage.getItem("session_id") ? `Bearer ${localStorage.getItem("session_id")}` : ""
                }
            });
            const data = await resp.json();
            changesList = data.changes || [];
            renderChangesList();
        } catch (err) {
            console.error(err);
        }
    }

    // Render list cards in HTML
    function renderChangesList() {
        const container = document.getElementById("changes-list");
        container.innerHTML = "";
        
        const pendingChanges = changesList.filter(c => c.status === "pending");
        
        if (pendingChanges.length === 0) {
            container.innerHTML = "<div style='font-style: italic; color: #64748b; font-size: 11px; text-align: center; margin: 1rem 0;'>No pending tracked changes.</div>";
            return;
        }

        pendingChanges.forEach(c => {
            const card = document.createElement("div");
            card.className = "change-card";
            card.innerHTML = `
                <div class="change-summary">${c.summary}</div>
                <div class="change-details">
                    <span style="text-decoration:line-through;color:#f87171;">${c.original_text}</span> &rarr; 
                    <span style="text-decoration:underline;color:#34d399;">${c.new_text}</span>
                </div>
                <div class="change-actions">
                    <button class="accept-btn" onclick="acceptChange('${c.id}', '${c.paragraph_id}')">Accept</button>
                    <button class="reject-btn" onclick="rejectChange('${c.id}', '${c.paragraph_id}')">Reject</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // 5. Accept Suggested Edit
    window.acceptChange = async function(changeId, controlId) {
        try {
            const apiBase = window.location.origin;
            await fetch(`${apiBase}/drafter/v2/redline/changes/${changeId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("session_id") ? `Bearer ${localStorage.getItem("session_id")}` : ""
                },
                body: JSON.stringify({ status: "accepted" })
            });

            // Run ONLYOFFICE Accept commands
            window.Asc.plugin.callCommand(function(data) {
                var oDocument = Api.GetDocument();
                var aContentControls = oDocument.GetContentControlsByTag(data.controlId);
                if (aContentControls.length > 0) {
                    var oControl = aContentControls[0];
                    var oRange = oControl.GetRange();
                    
                    var aRuns = oRange.GetRuns();
                    for (var i = aRuns.length - 1; i >= 0; i--) {
                        var run = aRuns[i];
                        if (run.GetStrikeout()) {
                            run.Delete(); // Remove original text
                        } else if (run.GetUnderline()) {
                            run.SetUnderline(false); // Reset new text underline
                            run.SetColor(0, 0, 0); // Reset color to standard
                        }
                    }
                    oControl.RemoveSelf(); // Remove content control boundary
                }
            }, false, true);

            loadChanges();
        } catch (err) {
            console.error(err);
        }
    };

    // 6. Reject Suggested Edit
    window.rejectChange = async function(changeId, controlId) {
        try {
            const apiBase = window.location.origin;
            await fetch(`${apiBase}/drafter/v2/redline/changes/${changeId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": localStorage.getItem("session_id") ? `Bearer ${localStorage.getItem("session_id")}` : ""
                },
                body: JSON.stringify({ status: "rejected" })
            });

            // Run ONLYOFFICE Reject commands
            window.Asc.plugin.callCommand(function(data) {
                var oDocument = Api.GetDocument();
                var aContentControls = oDocument.GetContentControlsByTag(data.controlId);
                if (aContentControls.length > 0) {
                    var oControl = aContentControls[0];
                    var oRange = oControl.GetRange();
                    
                    var aRuns = oRange.GetRuns();
                    for (var i = aRuns.length - 1; i >= 0; i--) {
                        var run = aRuns[i];
                        if (run.GetUnderline()) {
                            run.Delete(); // Remove new text insertions
                        } else if (run.GetStrikeout()) {
                            run.SetStrikeout(false); // Re-activate original text
                            run.SetColor(0, 0, 0);
                        }
                    }
                    oControl.RemoveSelf();
                }
            }, false, true);

            loadChanges();
        } catch (err) {
            console.error(err);
        }
    };

    // Helper: Remove control wrapper
    function removeControl(controlId) {
        window.Asc.plugin.callCommand(function(data) {
            var oDocument = Api.GetDocument();
            var aContentControls = oDocument.GetContentControlsByTag(data.controlId);
            if (aContentControls.length > 0) {
                aContentControls[0].RemoveSelf();
            }
        }, false, true);
    }

    function toastMessage(msg) {
        console.log("AI Redlining Notification: " + msg);
    }

})(window, undefined);
