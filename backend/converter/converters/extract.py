# Lightweight wrapper that imports your existing PyMuPDF-based converter.
# The original extract.py from your other project has been copied here verbatim.

import fitz
import html
import base64
import os

def extract_content_metadata(file_path):

    doc = fitz.open(file_path)

    content={}

    for page_num, page in enumerate(doc, start=1):
        blocks = page.get_text("dict")["blocks"]
        
        for block in blocks:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span["text"]
                    font = span["font"]
                    size = span["size"]
                    x0, y0, x1, y1 = span["bbox"]
                    content.setdefault(page_num, []).append(f"Font: {font} ({size}pt)  Position: ({x0:.2f}, {y0:.2f})  ({x1:.2f}, {y1:.2f})\nText: '{text}'")
    return content


def cvt_txt(content, meta_path):

    t= open(f"{meta_path}_meta.txt", "w")
    for page_num in content:
        t.write(f"Page {page_num}  \n")          
        for c in content[page_num]:
            t.write(c+"\n\n")

    t.close()


def cvt_html(pdf_path, output_path=None):
    """
    Creates a high-fidelity HTML blueprint that fixes overlapping text
    by using the 'origin' coordinate for accurate horizontal positioning.
    """
    doc = fitz.open(pdf_path)
    
    PT_TO_PX = 96 / 72

    first_page = doc[0]
    width_pt, height_pt = first_page.rect.width, first_page.rect.height

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>PDF Blueprint</title>
        <style>
            @page {{
                size: {width_pt}pt {height_pt}pt;
                margin: 0;
            }}
            body {{ margin: 0; background-color: #f0f0f0; }}
            .pdf-page {{
                position: relative;
                background-color: white;
                margin: 20px auto;
                padding: 96px;
                box-sizing: border-box;
            }}
            .content-element {{
                position: absolute;
                overflow: hidden;
                right: 72px;
            }}
            .text-span {{
                white-space: normal;
                -webkit-font-smoothing: antialiased;
                text-rendering: optimizeLegibility;
                line-height: 1;
            }}
            .editable {{
            line-height: 1.4;
            }}
            @media print {{
                body {{ background-color: transparent; }}
                .pdf-page {{ margin: 0; box-shadow: none; break-after: page; }}
                .pdf-page:last-child {{ break-after: auto; }}
            }}
        </style>
    </head>
    <body>
    """

    for page_num, page in enumerate(doc):
        page_width_px = page.rect.width * PT_TO_PX
        page_height_px = page.rect.height * PT_TO_PX
        html_content += f'<div class="pdf-page" style="width:{page_width_px}px; height:{page_height_px}px;">\n'

        # Process Text
        blocks = page.get_text("dict")["blocks"]
        for block in blocks:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = html.escape(span["text"])
                    
                    font_size_pt = span["size"]
                    
                    # --- THE FIX FOR OVERLAPPING ---
                    # Use the span's 'origin' for the x-coordinate (horizontal)
                    # and its 'bbox' for the y-coordinate (vertical).
                    x0_pt = span["origin"][0]
                    y0_pt = span["bbox"][1]

                    # Calculate width
                    x1_pt = span["bbox"][2]
                    width_pt = x1_pt - x0_pt
                    width_px = width_pt * PT_TO_PX

                    # Convert all values to pixels
                    font_size_px = font_size_pt * PT_TO_PX
                    x0_px = x0_pt * PT_TO_PX
                    y0_px = y0_pt * PT_TO_PX

                    font_name, color, flags = span["font"], span["color"], span["flags"]
                    css_color = f"#{color:06x}"
                    font_weight = "bold" if flags & 2**4 else "normal"
                    font_style = "italic" if flags & 2**1 else "normal"
                    text_decoration = "underline" if flags & 2**0 else "none"
                    
                    if text_decoration == "underline":
                        style = (
                            f"left:{x0_px}px; top:{y0_px}px; width:{width_px}px; "
                            f"font-family:'{font_name}'; font-size:{font_size_px}px; "
                            f"font-weight:{font_weight}; font-style:{font_style}; color:{css_color}; "
                            f"text-decoration: underline;"
    )
                    elif text_decoration == "none":
                        style = (
                            f"left:{x0_px}px; top:{y0_px}px; width:{width_px}px; "
                            f"font-family:'{font_name}'; font-size:{font_size_px}px; "
                            f"font-weight:{font_weight}; font-style:{font_style}; color:{css_color};"
                        )
                    html_content += f'<span class="content-element text-span" style="{style}">{text}</span>\n'

        html_content += '</div>\n'

    html_content += """<script>
        document.addEventListener('DOMContentLoaded', () => {
            const allElements = Array.from(document.querySelectorAll('.content-element'));

            // Store original top/left positions and single-line heights
            const editableSpans = document.querySelectorAll('.editable');
            allElements.forEach(el => {
                el.dataset.originalTop = el.style.top;
                el.dataset.originalLeft = el.style.left;
                
                const editable = el.querySelector('.editable') || (el.classList.contains('editable') ? el : null);
                if (editable && editable.isContentEditable) {
                    // Store the initial, single-line height
                    editable.dataset.singleLineHeight = editable.offsetHeight > 0 ? editable.offsetHeight : 17;
                }
            });

            const updateLayout = () => {
                let cumulativeShift = 0; // The total vertical shift for *all subsequent rows*

                // Group elements by their original top position
                const rows = new Map();
                allElements.forEach(el => {
                    const top = el.dataset.originalTop;
                    if (!rows.has(top)) {
                        rows.set(top, []);
                    }
                    rows.get(top).push(el);
                });

                // Get the unique top positions and sort them numerically
                const sortedTopPositions = Array.from(rows.keys()).sort((a, b) => parseFloat(a) - parseFloat(b));

                // Iterate through each "visual row"
                for (const top of sortedTopPositions) {
                    const elementsInRow = rows.get(top);
                    
                    // Sort elements in this row by their LEFT position
                    elementsInRow.sort((a, b) => parseFloat(a.dataset.originalLeft) - parseFloat(b.dataset.originalLeft));

                    let perElementShift = 0; // The shift *within* this row for horizontal collisions
                    let maxHeightThisRow = 17; // Track the tallest element in this "visual row"
                    let originalRowHeight = 17; // The base height of the row

                    // Get the original row height from the first editable element in it
                    const firstEditable = elementsInRow[0].querySelector('.editable');
                    if (firstEditable && firstEditable.dataset.singleLineHeight) {
                        originalRowHeight = parseFloat(firstEditable.dataset.singleLineHeight);
                    }

                    // Iterate through each element in the row
                    for (let i = 0; i < elementsInRow.length; i++) {
                        const el = elementsInRow[i];
                        
                        // Apply BOTH shifts: the global cumulative shift AND the intra-row shift
                        el.style.top = `${parseFloat(top) + cumulativeShift + perElementShift}px`;
                        
                        const currentHeight = el.offsetHeight;
                        maxHeightThisRow = Math.max(maxHeightThisRow, currentHeight);

                        // --- THIS IS THE NEW COLLISION LOGIC ---
                        if (i < elementsInRow.length - 1) {
                            const nextElement = elementsInRow[i+1];
                            
                            // Get the right edge of this element
                            const myRightEdge = el.offsetLeft + el.offsetWidth;
                            
                            // Get the left edge of the next element
                            const nextElementLeftEdge = nextElement.offsetLeft;

                            // Check for overlap
                            if (myRightEdge > nextElementLeftEdge) {
                                // COLLISION!
                                // Add the full height of the current element to the intra-row shift.
                                // This will push the 'nextElement' (and all others after it) down.
                                perElementShift += currentHeight;
                            }
                        }
                    }

                    // Now, update the global cumulative shift for the *next* row
                    let rowHeightIncrease = (maxHeightThisRow > originalRowHeight) ? (maxHeightThisRow - originalRowHeight) : 0;
                    cumulativeShift += rowHeightIncrease + perElementShift;
                }
            };

            // Add the listener to all *editable* fields
            editableSpans.forEach(span => {
                span.addEventListener('input', updateLayout);
            });
        });
    </script></body></html>"""

    if output_path is None:
        output_filename = f"{pdf_path.split('.')[0]}.html"
    else: 
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        output_filename = os.path.join(output_path, base_name + ".html")
        print(output_filename)

    with open(output_filename, "w", encoding="utf-8") as f:
        f.write(html_content)

    if __name__ == "__main__":
        pdf_path= "Undertaking Form (BT, BS)_2024.pdf"
        
        Metadata= extract_content_metadata(pdf_path)
        cvt_txt(Metadata, pdf_path.split(".")[0])
        cvt_html(pdf_path)