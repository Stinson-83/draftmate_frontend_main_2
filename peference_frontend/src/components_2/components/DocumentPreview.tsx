import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Placeholder } from "@/pages/Index";

interface DocumentPreviewProps {
  htmlContent: string;
  placeholders: Placeholder[];
}

export const DocumentPreview = ({
  htmlContent,
  placeholders,
}: DocumentPreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewRef.current) {
      let processedHtml = htmlContent;
      let placeholderIndex = 0;

      // Use raw HTML; placeholders will be wrapped and updated dynamically
      previewRef.current.innerHTML = processedHtml;

      // Build a continuous editor per page while respecting initial ordering
      const pdfPages = previewRef.current.querySelectorAll(".pdf-page");
      pdfPages.forEach((page) => {
        const htmlPage = page as HTMLElement;

        // Page sizing to avoid overflow outside bounds
        htmlPage.style.position = "relative";
        htmlPage.style.boxSizing = "border-box";
        htmlPage.style.width = "816px"; // PDF page width
        htmlPage.style.height = "1056px"; // PDF page height (fixed for pagination)
        htmlPage.style.padding = "40px"; // page margin
        htmlPage.style.overflow = "hidden";
        // htmlPage.style.backgroundColor = "white"; // white background for the page
        // htmlPage.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)"; // subtle shadow for depth
        // htmlPage.style.marginBottom = "20px"; // spacing between pages

        // Collect content elements and sort by original absolute positions
        const contentElements = Array.from(
          page.querySelectorAll(".content-element")
        ) as HTMLElement[];

        if (contentElements.length === 0) return;

        const items = contentElements.map((el) => {
          const styleAttr = el.getAttribute("style") || "";
          const topMatch = styleAttr.match(/top:\s*([-.\d]+)px/i);
          const leftMatch = styleAttr.match(/left:\s*([-.\d]+)px/i);
          const top = topMatch ? parseFloat(topMatch[1]) : 0;
          const left = leftMatch ? parseFloat(leftMatch[1]) : 0;
          return { html: el.innerHTML, top, left };
        });

        // Order: top to bottom, then left to right
        items.sort((a, b) => (a.top === b.top ? a.left - b.left : a.top - b.top));

        // Create a single continuous contenteditable container
        const editor = document.createElement("div");
        editor.setAttribute("contenteditable", "true");
        editor.className = "editor-root";
        editor.style.outline = "none";
        editor.style.whiteSpace = "normal";
        editor.style.lineHeight = "1.5";
        editor.style.wordBreak = "break-word";
        editor.style.overflowWrap = "anywhere";
        editor.style.width = "100%";
        editor.style.maxWidth = "100%";

        items.forEach((item) => {
          if (!item.html) return;
          const p = document.createElement("p");
          const replaced = (item.html || "").replace(/_\(([^)]+)\)_/g, (_m, k) => {
            const placeholder = placeholders[placeholderIndex];
            const placeholderId = placeholder?.id || `placeholder_${placeholderIndex}`;
            const val = placeholder?.value || "";
            const text = val || `_(${k})_`;
            placeholderIndex++;
            return `<span data-placeholder="true" data-placeholder-id="${placeholderId}" data-key="${k}">${text}</span>`;
          });
          p.innerHTML = replaced; // preserve inline formatting and wrap placeholders
          p.style.margin = "0 0 0.5em 0";
          p.style.maxWidth = "100%";
          editor.appendChild(p);
        });

        // Replace page content with the continuous editor
        htmlPage.innerHTML = "";
        htmlPage.appendChild(editor);
      });

      // Pagination: move overflowing content to next pages and pull back when space
      const PAGE_HEIGHT = 1056;
      const PAGE_PADDING = 40;
      const MAX_CONTENT_HEIGHT = PAGE_HEIGHT - PAGE_PADDING * 2;

      const initEmptyEditor = (pageEl: HTMLElement) => {
        let ed = pageEl.querySelector('.editor-root') as HTMLElement | null;
        if (!ed) {
          ed = document.createElement('div');
          ed.setAttribute('contenteditable', 'true');
          ed.className = 'editor-root';
          ed.style.outline = 'none';
          ed.style.whiteSpace = 'normal';
          ed.style.lineHeight = '1.5';
          ed.style.wordBreak = 'break-word';
          ed.style.overflowWrap = 'anywhere';
          ed.style.width = '100%';
          ed.style.maxWidth = '100%';
          pageEl.appendChild(ed);
        }
        return ed;
      };

      const ensureNextPage = (currentPage: HTMLElement) => {
        let next = currentPage.nextElementSibling as HTMLElement | null;
        if (!next || !next.classList.contains('pdf-page')) {
          next = document.createElement('div');
          next.className = 'pdf-page';
          next.style.position = 'relative';
          next.style.boxSizing = 'border-box';
          next.style.width = '816px';
          next.style.height = `${PAGE_HEIGHT}px`;
          next.style.padding = `${PAGE_PADDING}px`;
          next.style.overflow = 'hidden';
          initEmptyEditor(next);
          currentPage.parentElement?.insertBefore(next, currentPage.nextSibling);
        }
        return next!;
      };

      const paginateAll = () => {
        let safety = 0;
        let changed = true;
        while (changed && safety < 20) {
          changed = false;
          safety++;
          const pages = Array.from(previewRef.current!.querySelectorAll('.pdf-page')) as HTMLElement[];

          // forward pass: push overflow down
          for (let i = 0; i < pages.length; i++) {
            const pageEl = pages[i];
            const editor = initEmptyEditor(pageEl);
            while (editor.scrollHeight > MAX_CONTENT_HEIGHT && editor.lastChild) {
              const next = ensureNextPage(pageEl);
              const nextEditor = initEmptyEditor(next);
              nextEditor.insertBefore(editor.lastChild, nextEditor.firstChild);
              changed = true;
            }
          }

          // backward pass: pull up if space and next has content
          for (let i = pages.length - 2; i >= 0; i--) {
            const pageEl = pages[i];
            const nextEl = pages[i + 1];
            const editor = initEmptyEditor(pageEl);
            const nextEditor = initEmptyEditor(nextEl);
            while (editor.scrollHeight < MAX_CONTENT_HEIGHT && nextEditor.firstChild) {
              editor.appendChild(nextEditor.firstChild);
              changed = true;
            }
            // remove empty trailing page
            if (i === pages.length - 2 && !nextEditor.firstChild) {
              nextEl.remove();
              changed = true;
            }
          }
        }
      };

      // initial pagination after building
      paginateAll();

      // Re-paginate on edits
      const containerEl = previewRef.current!;
      const schedule = () => requestAnimationFrame(paginateAll);
      containerEl.addEventListener('input', schedule, true);
      containerEl.addEventListener('paste', schedule, true);
      containerEl.addEventListener('keyup', schedule, true);

      // cleanup
      return () => {
        containerEl.removeEventListener('input', schedule, true);
        containerEl.removeEventListener('paste', schedule, true);
        containerEl.removeEventListener('keyup', schedule, true);
      };

    }
  }, [htmlContent]);

  // Update placeholder spans in-place on sidebar changes
  useEffect(() => {
    if (!previewRef.current) return;
    const spans = previewRef.current.querySelectorAll('[data-placeholder="true"]');
    spans.forEach((el) => {
      const span = el as HTMLElement;
      const placeholderId = span.getAttribute('data-placeholder-id');
      const key = span.getAttribute('data-key');
      if (!placeholderId || !key) return;
      const placeholder = placeholders.find(p => p.id === placeholderId);
      const val = placeholder?.value || "";
      span.textContent = val || `_(${key})_`;
    });
  }, [placeholders]);

  return (
    <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
      <div className="min-h-full bg-[hsl(var(--editor-bg))] p-8">
        <div
          ref={previewRef}
          className="mx-auto"
          style={{
            maxWidth: "816px",
          }}
        />
      </div>
    </ScrollArea>
  );
};
