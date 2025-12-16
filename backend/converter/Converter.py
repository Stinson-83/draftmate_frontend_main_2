from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from extract_metadata import extract_metadata_from_html
from s3_upload import upload_to_s3
import tempfile
import shutil
import os
import uuid
import datetime

import pypandoc

from converters import extract


app = FastAPI(title="Converter Service")

# Allow all origins for development; tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def index():
    return {"ok": True, "service": "converter"}

# ==================== Main Query Endpoints ====================

@app.post("/convert", response_class=HTMLResponse)
async def convert(file: UploadFile = File(...)):
    """Accepts a single file upload, converts supported types to HTML and returns HTML string.

    Supported flows implemented here:
      - .docx, .doc, .rtf, .html, .htm, .txt -> pypandoc -> HTML string
      - .pdf -> converters.extract.cvt_html -> creates an HTML file next to PDF which we read and return
    """
    filename = file.filename or f"upload-{uuid.uuid4()}"
    ext = os.path.splitext(filename)[1].lower()

    with tempfile.TemporaryDirectory() as tmpdir:
        in_path = os.path.join(tmpdir, filename)
        # write uploaded bytes to disk
        with open(in_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        file_size = os.path.getsize(in_path)
        upload_time = datetime.datetime.utcnow().isoformat() + "Z"
        file_ext = ext
        file_name = filename
        # content_type = getattr(file, "content_type", "") or ""
        headers = {
            "File-Name": file_name,
            "File-Size": str(file_size),
            "File-Ext": file_ext,  #ig isme html he jane wala hai
            "Upload-Time": upload_time,
            # "Content-Type": content_type
        }

        # For non-PDF inputs: convert to PDF with pypandoc, then use the PyMuPDF converter to produce HTML
        if ext in (".docx", ".doc", ".rtf", ".txt"):
            try:
                base_name = os.path.splitext(os.path.basename(in_path))[0]
                pdf_path = os.path.join(tmpdir, base_name + ".pdf")
                # Convert input to PDF first (uses wkhtmltopdf as the pdf engine)
                pypandoc.convert_file(in_path, "pdf", outputfile=pdf_path, extra_args=["--pdf-engine=wkhtmltopdf"])

                # Now convert the generated PDF to HTML using 
                extract.cvt_html(pdf_path, output_path=tmpdir)
                out_file = os.path.join(tmpdir, base_name + ".html")
                if not os.path.exists(out_file):
                    raise HTTPException(status_code=500, detail="Intermediate PDF -> HTML conversion failed")
                with open(out_file, "r", encoding="utf-8") as fh:
                    # print(type(fh.read()))
                    content= fh.read()
                    c= extract_metadata_from_html(content, headers)

                    # print(c["original_filename"])
                    # print(c["file_extension"])  # like .rtf 
                    # print(c["file_size_kb"])
                    # print(c["scrape_timestamp"])
                    s3_key = f"converted/{base_name}.html"
                    # a,b= upload_to_s3(out_file, s3_key)
                    # print(a, b, sep=" ")
                    return HTMLResponse(content=content)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Conversion error: {e}")

        # PDF -> use your PyMuPDF-based converter directly
        if ext == ".pdf":
            try:
                extract.cvt_html(in_path, output_path=tmpdir)
                base = os.path.splitext(os.path.basename(in_path))[0] + ".html"
                out_file = os.path.join(tmpdir, base)
                if not os.path.exists(out_file):
                    raise HTTPException(status_code=500, detail="PDF -> HTML conversion failed")
                with open(out_file, "r", encoding="utf-8") as fh:
                    # print(fh.read())
                    # print("=====")
                    # print(type(fh.read()))
                    return HTMLResponse(content=fh.read())
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"PDF conversion error: {e}")

        raise HTTPException(status_code=400, detail="Unsupported file type")