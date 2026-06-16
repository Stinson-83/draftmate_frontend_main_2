(function(window, undefined) {
    window.Asc.plugin.init = function() {
        // Send event to parent window to register this plugin
        window.top.postMessage({ type: "ONLYOFFICE_PLUGIN_READY" }, "*");
    };

    window.Asc.plugin.button = function(id) {
        this.executeCommand("close", "");
    };

    // Listen for messages from React app (forwarded from the parent window)
    window.addEventListener('message', function(event) {
        if (!event.data) return;

        if (event.data.type === 'ONLYOFFICE_GET_SELECTION') {
            window.Asc.plugin.executeMethod("GetSelectedText", [{
                "Numbering": false,
                "Math": false,
                "TableCellSeparator": "\n",
                "ParaSeparator": "\n",
                "TabSymbol": String.fromCharCode(9)
            }], function(text) {
                window.top.postMessage({
                    type: 'ONLYOFFICE_SELECTION',
                    text: text || ""
                }, '*');
            });
        } else if (event.data.type === 'ONLYOFFICE_INSERT_TEXT') {
            window.Asc.plugin.executeMethod("PasteText", [event.data.text]);
        }
    });
})(window, undefined);
