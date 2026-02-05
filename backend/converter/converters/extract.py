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
    
    # Scale factor: 96/72 ensures content matches standard screen DPI (1.333x).
    # We maintain 1:1 scale relative to the Editor's paper dimensions.
    PT_TO_PX = 96 / 72 

    first_page = doc[0]
    
    # We return a Fragment, not a full HTML doc, because this is injected into a div.
    # Critical styles MUST be inline to survive.
    
    html_content = ""

    # Optional: Keep style block for non-critical or shared styles, 
    # but assume it might be stripped in some contexts.
    html_content += """
    <style>
        .pdf-page {
            /* box-shadow removed to blend with editor page */
        }
        .text-span {
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
        }
    </style>
    """

    for page_num, page in enumerate(doc):
        # Scale dimensions
        page_width_px = page.rect.width * PT_TO_PX
        page_height_px = page.rect.height * PT_TO_PX
        
        # INLINE: position: relative, negative margins to counter Editor padding (-72px).
        # Height is capped at 912px (Editor safe area) to prevent infinite pagination loops, 
        # but overflow is visible to show full content (footer/header areas).
        html_content += f'<div class="pdf-page" style="position: relative; width:{page_width_px}px; height:912px; background-color: white; margin: -72px 0 0 -72px; padding: 0; overflow: visible;">\n'

        # Process Text
        blocks = page.get_text("dict")["blocks"]
        for block in blocks:
            for line in block.get("lines", []):
                raw_spans = line.get("spans", [])
                if not raw_spans:
                    continue
                
                # MERGE SPANS: content reconstruction
                merged_spans = []
                if raw_spans:
                    curr = raw_spans[0].copy()
                    
                    for next_span in raw_spans[1:]:
                        # Check similarity
                        is_same_font = (
                            curr["font"] == next_span["font"] and 
                            abs(curr["size"] - next_span["size"]) < 0.1 and
                            curr["color"] == next_span["color"] and
                            curr["flags"] == next_span["flags"]
                        )
                        
                        # Check adjacency (gap < 5px roughly)
                        # origin is [x, y], bbox is [x0, y0, x1, y1]
                        gap = next_span["origin"][0] - curr["bbox"][2]
                        is_adjacent = abs(gap) < 5 

                        if is_same_font and is_adjacent:
                            # Merge
                            curr["text"] += next_span["text"]
                            # Update bbox (x1 increases, y1 takes max)
                            curr["bbox"] = (
                                curr["bbox"][0], 
                                curr["bbox"][1], 
                                next_span["bbox"][2], 
                                max(curr["bbox"][3], next_span["bbox"][3])
                            )
                        else:
                            merged_spans.append(curr)
                            curr = next_span.copy()
                            
                    merged_spans.append(curr)

                for span in merged_spans:
                    text = html.escape(span["text"])
                    
                    font_size_pt = span["size"]
                    
                    # For merged spans, origin might drift, but x0 from bbox is reliable
                    x0_pt = span["bbox"][0] 
                    y0_pt = span["bbox"][1]
                    x1_pt = span["bbox"][2]

                    width_pt = x1_pt - x0_pt
                    height_pt = span["bbox"][3] - span["bbox"][1]
                    
                    # Convert to pixels
                    width_px = width_pt * PT_TO_PX
                    height_px = height_pt * PT_TO_PX
                    font_size_px = font_size_pt * PT_TO_PX
                    x0_px = x0_pt * PT_TO_PX
                    y0_px = y0_pt * PT_TO_PX

                    font_name, color, flags = span["font"], span["color"], span["flags"]
                    css_color = f"#{color:06x}"
                    font_weight = "bold" if flags & 2**4 else "normal"
                    font_style = "italic" if flags & 2**1 else "normal"
                    text_decoration = "underline" if flags & 2**0 else "none"
                    
                    # INLINE: position: absolute, white-space: nowrap, line-height: 1
                    # Added height to prevent vertical overlap
                    base_style = (
                        f"position: absolute; left:{x0_px}px; top:{y0_px}px; width:{width_px}px; height:{height_px}px; "
                        f"white-space: pre; line-height: 1; overflow: visible; "
                        f"font-family:'{font_name}', sans-serif; font-size:{font_size_px}px; "
                        f"font-weight:{font_weight}; font-style:{font_style}; color:{css_color};"
                    )
                    
                    if text_decoration != "none":
                        base_style += f" text-decoration: {text_decoration};"

                    html_content += f'<span class="content-element text-span" style="{base_style}">{text}</span>\n'

        html_content += '</div>\n'
    
    # Script removed as it is handled by the React frontend (Editor.jsx Blueprint Layout Engine)
    html_content += "</body></html>"

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