import { useState, useRef, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { EditorToolbar } from "@/components/EditorToolbar";
import { PlaceholdersSidebar } from "@/components/PlaceholdersSidebar";
import { DocumentPreview } from "@/components/DocumentPreview";
import { toast } from "sonner";

export interface Placeholder {
  id: string;
  key: string;
  value: string;
}

const Index = () => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const lastRangeRef = useRef<Range | null>(null);

  // Track selection inside editor to restore after toolbar clicks
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      // Ensure selection is inside a contenteditable editor
      let node: Node | null = sel.anchorNode;
      let within = false;
      while (node) {
        if ((node as HTMLElement).nodeType === 1) {
          const el = node as HTMLElement;
          if (el.getAttribute && el.getAttribute("contenteditable") === "true") {
            within = true;
            break;
          }
        }
        node = node.parentNode;
      }
      if (within) {
        lastRangeRef.current = range.cloneRange();
      }
    };
    document.addEventListener("selectionchange", handler);
    return () => document.removeEventListener("selectionchange", handler);
  }, []);

  const extractPlaceholders = (html: string): Placeholder[] => {
    const regex = /_\(([^)]+)\)_/g;
    const matches = html.matchAll(regex);
    const result: Placeholder[] = [];
    let counter = 0;

    for (const match of matches) {
      const key = match[1];
      result.push({
        id: `placeholder_${counter++}`,
        key: key,
        value: "",
      });
    }

    return result;
  };

  const handleFileLoad = (content: string, name: string) => {
    setHtmlContent(content);
    setFilename(name);
    const extracted = extractPlaceholders(content);
    setPlaceholders(extracted);
    toast.success("File loaded successfully!");
  };

  const handlePlaceholderChange = (id: string, value: string) => {
    setPlaceholders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, value } : p))
    );
  };

  const handleFormat = (command: string, value?: string) => {
    const sel = window.getSelection();
    
    // Find and focus the editable element first
    let editableEl: HTMLElement | null = null;
    
    // If we have a saved range, try to find the editable element from it
    if (lastRangeRef.current) {
      let node = lastRangeRef.current.commonAncestorContainer as Node | null;
      while (node) {
        if ((node as HTMLElement).nodeType === 1) {
          const el = node as HTMLElement;
          if (el.getAttribute && el.getAttribute("contenteditable") === "true") {
            editableEl = el;
            break;
          }
        }
        node = (node as Node).parentNode;
      }
    }
    
    // Fallback: find the first editable element
    if (!editableEl) {
      editableEl = document.querySelector(".editor-root") as HTMLElement | null;
    }
    
    // Focus the editable element first
    if (editableEl) {
      editableEl.focus();
      
      // For list commands, if there's no selection or the selection is collapsed,
      // create a selection at the end of the editor
      if (command === "insertUnorderedList" || command === "insertOrderedList") {
        if (!lastRangeRef.current || (sel && sel.rangeCount === 0)) {
          const range = document.createRange();
          const lastChild = editableEl.lastChild || editableEl;
          range.selectNodeContents(lastChild);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
          lastRangeRef.current = range.cloneRange();
        } else {
          // Restore the saved selection
          sel?.removeAllRanges();
          sel?.addRange(lastRangeRef.current);
        }
      } else if (lastRangeRef.current) {
        // For other commands, restore the saved selection
        sel?.removeAllRanges();
        sel?.addRange(lastRangeRef.current);
      }
    }

    // Execute the command
    if (command === "fontSize") {
      document.execCommand("fontSize", false, "7");
      const selection2 = window.getSelection();
      if (selection2 && selection2.rangeCount > 0) {
        const range = selection2.getRangeAt(0);
        const span = document.createElement("span");
        span.style.fontSize = `${value}px`;
        try {
          range.surroundContents(span);
        } catch (e) {
          span.appendChild(range.extractContents());
          range.insertNode(span);
        }
      }
    } else if (command === "fontName") {
      document.execCommand("fontName", false, value);
    } else if (
      command === "insertUnorderedList" ||
      command === "insertOrderedList"
    ) {
      document.execCommand(command, false, undefined);
    } else {
      document.execCommand(command, false, value);
    }

    // Save selection again after operation
    if (sel && sel.rangeCount > 0) {
      lastRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const handleDownloadPDF = async () => {
    if (!htmlContent) {
      toast.error("No file to download");
      return;
    }

    const previewElement = document.querySelector(".mx-auto");
    if (!previewElement) {
      toast.error("Preview not found");
      return;
    }

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      
      const opt = {
        margin: 0,
        filename: filename.replace('.html', '.pdf') || "edited-document.pdf",
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "px", format: [816, 1056] as [number, number], orientation: "portrait" as const },
      };

      html2pdf().set(opt).from(previewElement as HTMLElement).save();
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error("Failed to generate PDF");
      console.error(error);
    }
  };

  const handleDownloadHTML = () => {
    if (!htmlContent) {
      toast.error("No file to download");
      return;
    }

    const previewElement = document.querySelector(".mx-auto");
    if (!previewElement) {
      toast.error("Preview not found");
      return;
    }

    let modifiedHtml = htmlContent;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const pdfPages = doc.querySelectorAll(".pdf-page");

    const previewPages = previewElement.querySelectorAll(".pdf-page");

    pdfPages.forEach((page, index) => {
      if (previewPages[index]) {
        page.innerHTML = previewPages[index].innerHTML;
      }
    });

    modifiedHtml = doc.documentElement.outerHTML;

    const blob = new Blob([modifiedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "edited-document.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML downloaded successfully!");
  };

  const handleNewFile = () => {
    setHtmlContent("");
    setFilename("");
    setPlaceholders([]);
    toast.info("Ready for new file");
  };

  if (!htmlContent) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Document Editor</h1>
            <p className="text-muted-foreground">
              Edit documents 
            </p>
          </div>
          <FileUpload onFileLoad={handleFileLoad} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <EditorToolbar
        onFormat={handleFormat}
        onDownloadPDF={handleDownloadPDF}
        onDownloadHTML={handleDownloadHTML}
        onNewFile={handleNewFile}
        filename={filename}
      />
      <div className="flex flex-1 overflow-hidden">
        <PlaceholdersSidebar
          placeholders={placeholders}
          onPlaceholderChange={handlePlaceholderChange}
        />
        <DocumentPreview
          htmlContent={htmlContent}
          placeholders={placeholders}
        />
      </div>
    </div>
  );
};

export default Index;
