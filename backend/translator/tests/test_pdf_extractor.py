from pathlib import Path

from reportlab.pdfgen import canvas

from backend.translator.extractors import extract_pdf_blocks


def _create_sample_pdf(pdf_path: Path) -> None:
    pdf = canvas.Canvas(str(pdf_path))
    pdf.setFont("Helvetica", 12)
    pdf.drawString(72, 720, "First PDF block")
    pdf.drawString(72, 700, "Second PDF block")
    pdf.save()


def test_extract_pdf_blocks(tmp_path: Path) -> None:
    pdf_path = tmp_path / "sample.pdf"
    _create_sample_pdf(pdf_path)

    blocks = extract_pdf_blocks(pdf_path)

    assert len(blocks) >= 2
    assert blocks[0].text == "First PDF block"
    assert blocks[1].text == "Second PDF block"
    assert len(blocks[0].bounding_box) == 4
    assert blocks[0].style["page_number"] == 1
