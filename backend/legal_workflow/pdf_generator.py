"""PDF Generator — converts HTML drafts to PDF.

For the delivery layer to send actual PDF files over WhatsApp, or for
users to download via the web API.
"""
from __future__ import annotations

import logging
from io import BytesIO

logger = logging.getLogger(__name__)

def html_to_pdf(html_content: str) -> bytes:
    """Convert HTML string to PDF bytes.
    
    Uses WeasyPrint for robust HTML/CSS rendering.
    """
    try:
        from weasyprint import HTML
        
        # Wrap the draft in standard A4 styling if not already present
        if "<html" not in html_content.lower():
            styled_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    @page {{
                        size: A4;
                        margin: 2.5cm;
                    }}
                    body {{
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 12pt;
                        line-height: 1.5;
                        color: #000;
                    }}
                    p {{
                        margin-bottom: 1em;
                        text-align: justify;
                    }}
                    h1, h2, h3 {{
                        text-align: center;
                        margin-top: 2em;
                        margin-bottom: 1em;
                    }}
                    b, strong {{
                        font-weight: bold;
                    }}
                    .center {{
                        text-align: center;
                    }}
                </style>
            </head>
            <body>
                {html_content}
            </body>
            </html>
            """
        else:
            styled_html = html_content
            
        pdf_bytes = HTML(string=styled_html).write_pdf()
        return pdf_bytes
        
    except ImportError:
        logger.warning("WeasyPrint not installed. Falling back to simple text-to-pdf.")
        # Fallback if weasyprint is not available
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import A4
            
            # Very basic fallback that strips HTML tags
            import re
            text = re.sub(r'<[^>]+>', ' ', html_content)
            
            buffer = BytesIO()
            p = canvas.Canvas(buffer, pagesize=A4)
            width, height = A4
            
            y = height - 50
            for line in text.split('\n'):
                if y < 50:
                    p.showPage()
                    y = height - 50
                p.drawString(50, y, line[:100])  # Crude line wrapping
                y -= 15
                
            p.save()
            return buffer.getvalue()
        except ImportError:
            logger.error("No PDF generation libraries available. Install weasyprint or reportlab.")
            raise RuntimeError("Cannot generate PDF: no libraries available")
    except Exception as e:
        logger.exception("PDF generation failed")
        raise RuntimeError(f"Failed to generate PDF: {e}")
