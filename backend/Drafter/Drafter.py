import logging
import os
import hashlib
from typing import Any, Dict, List, Optional, Set, Tuple
from urllib.parse import urlparse

import httpx
import jwt
import uvicorn
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Mm, Pt
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, BackgroundTasks, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

import sys
import re
import time

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, "../"))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

try:
    from Deep_research.lex_bot.tools.pdf_processor import pdf_processor
    from Deep_research.lex_bot.tools.session_cache import get_session_cache
except ImportError:
    pdf_processor = None
    get_session_cache = None

PLACEHOLDER_REGEX = re.compile(r'\b[A-Z][A-Z0-9_]{3,}\b')

def extract_and_cache_docx(file_path: str):
    try:
        from docx import Document
        doc = Document(file_path)
        text_parts = []
        # Extract from paragraphs
        for p in doc.paragraphs:
            if p.text.strip():
                text_parts.append(p.text)
        # Extract from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    for p in cell.paragraphs:
                        if p.text.strip():
                            text_parts.append(p.text)
        full_text = "\n".join(text_parts)
        
        if full_text.strip() and pdf_processor and get_session_cache:
            chunks = pdf_processor.chunk_text(full_text)
            session_cache = get_session_cache()
            session_cache.set_file_chunks(file_path, chunks)
            logger.info(f"Background extraction complete for {file_path}. Chunks cached.")
    except Exception as e:
        logger.error(f"Background extraction failed: {e}")


from legal_draft import generate_legal_draft

load_dotenv()

logger = logging.getLogger(__name__)

app = FastAPI(title="DraftMate Drafter Service", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth:8009")
JWT_SECRET = os.getenv("JWT_SECRET", "draftmate_jwt_production_signing_key_2026")
JWT_ALGORITHM = "HS256"


async def verify_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")
    session_id = authorization.split(" ", 1)[1].strip()
    if not session_id:
        raise HTTPException(status_code=401, detail="Missing session token.")

    verify_url = f"{AUTH_SERVICE_URL.rstrip('/')}/verify_session/{session_id}"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(verify_url, timeout=10.0)
    except httpx.RequestError:
        if os.getenv("DEV_BYPASS_AUTH") == "true":
            logger.warning("DEV_BYPASS_AUTH enabled; bypassing auth service failure.")
            return "dev_counsel_bypass"
        raise HTTPException(status_code=503, detail="Auth service unavailable.")

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session.")

    try:
        data = resp.json()
    except Exception:
        raise HTTPException(status_code=502, detail="Auth service returned invalid JSON.")

    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=502, detail="Auth service response missing user_id.")
    return str(user_id)


def _jwt_encode(payload: Dict[str, Any]) -> str:
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    if isinstance(token, bytes):
        return token.decode("utf-8")
    return token


def _safe_basename_from_url(url: str) -> str:
    parsed = urlparse(url)
    name = os.path.basename(parsed.path or "")
    name = name.replace("\\", "/")
    name = os.path.basename(name)
    return name


def _normalize_download_url(download_source_url: str) -> str:
    if "localhost" in download_source_url:
        return download_source_url.replace("localhost", "onlyoffice-server")
    if "127.0.0.1" in download_source_url:
        return download_source_url.replace("127.0.0.1", "onlyoffice-server")
    return download_source_url

def create_content_control_run(paragraph, placeholder_tag: str, default_text: str):
    sdt = OxmlElement("w:sdt")


    sdt_pr = OxmlElement("w:sdtPr")

    tag = OxmlElement("w:tag")
    tag.set(qn("w:val"), placeholder_tag)
    sdt_pr.append(tag)

    alias = OxmlElement("w:alias")
    alias.set(qn("w:val"), placeholder_tag)
    sdt_pr.append(alias)

    showing = OxmlElement("w:showingPlcHdr")
    sdt_pr.append(showing)

    sdt.append(sdt_pr)

    sdt_content = OxmlElement("w:sdtContent")

    r = OxmlElement("w:r")
    r_pr = OxmlElement("w:rPr")

    r_fonts = OxmlElement("w:rFonts")
    r_fonts.set(qn("w:ascii"), "Times New Roman")
    r_fonts.set(qn("w:hAnsi"), "Times New Roman")
    r_fonts.set(qn("w:cs"), "Times New Roman")
    r_fonts.set(qn("w:eastAsia"), "Times New Roman")
    r_pr.append(r_fonts)

    sz = OxmlElement("w:sz")
    sz.set(qn("w:val"), "24")
    r_pr.append(sz)

    sz_cs = OxmlElement("w:szCs")
    sz_cs.set(qn("w:val"), "24")
    r_pr.append(sz_cs)

    r.append(r_pr)

    t = OxmlElement("w:t")
    t.text = f"[{default_text}]"
    r.append(t)

    sdt_content.append(r)
    sdt.append(sdt_content)

    paragraph._p.append(sdt)


def _token_core_segments(token: str) -> Tuple[str, str, str]:
    if not token:
        return "", "", ""
    start = 0
    while start < len(token) and not (token[start].isalnum() or token[start] == "_"):
        start += 1
    end = len(token)
    while end > start and not (token[end - 1].isalnum() or token[end - 1] == "_"):
        end -= 1
    return token[:start], token[start:end], token[end:]


def _apply_run_style(run, font_size: Pt, bold: bool):
    run.font.name = "Times New Roman"
    run.font.size = font_size
    run.bold = bold


def build_docx_with_controls(ai_data: dict, file_target_name: str) -> str:
    shared_storage_path = os.getenv("SHARED_STORAGE_PATH")
    if not shared_storage_path:
        raise ValueError("SHARED_STORAGE_PATH is not set.")

    os.makedirs(shared_storage_path, exist_ok=True)

    safe_name = (file_target_name or "").strip() or "draftmate_draft.docx"
    if not safe_name.lower().endswith(".docx"):
        safe_name = safe_name + ".docx"
    output_path = os.path.join(shared_storage_path, safe_name)

    doc = Document()
    section = doc.sections[0]
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)

    metadata = ai_data.get("metadata") or {}
    placeholders_list = metadata.get("placeholders_detected") or []
    placeholders: Set[str] = set(x for x in placeholders_list if isinstance(x, str))

    content_blocks = ai_data.get("content") or []
    for block in content_blocks:
        if not isinstance(block, dict):
            continue

        element_type = block.get("element_type")
        text = block.get("text") or ""
        if not isinstance(text, str):
            text = str(text)

        paragraph = doc.add_paragraph()
        paragraph.paragraph_format.line_spacing = 1.5

        if element_type == "header_block":
            paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
            font_size = Pt(14)
            bold = True
        elif element_type == "paragraph":
            paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            font_size = Pt(12)
            bold = False
        elif element_type == "heading_1":
            paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
            font_size = Pt(13)
            bold = True
        else:
            paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
            font_size = Pt(12)
            bold = False

        tokens = text.split(" ")
        for idx, token in enumerate(tokens):
            if idx > 0:
                space_run = paragraph.add_run(" ")
                _apply_run_style(space_run, font_size=font_size, bold=bold)

            prefix, core, suffix = _token_core_segments(token)
            if core and core in placeholders:
                if prefix:
                    r = paragraph.add_run(prefix)
                    _apply_run_style(r, font_size=font_size, bold=bold)

                create_content_control_run(paragraph, placeholder_tag=core, default_text=core)

                if suffix:
                    r = paragraph.add_run(suffix)
                    _apply_run_style(r, font_size=font_size, bold=bold)
            else:
                r = paragraph.add_run(token)
                _apply_run_style(r, font_size=font_size, bold=bold)

    doc.save(output_path)
    return output_path


class DraftCompileRequest(BaseModel):
    case_context: Optional[str] = None
    case_metadata_context: Optional[List[Dict[str, Any]]] = None
    legal_documents: Optional[str] = None
    document_type: str = "Legal Document"
    file_target_name: str = "draftmate_draft.docx"


class ForceSaveRequest(BaseModel):
    document_key: str


@app.get("/")
def root():
    return {"service": "drafter-service", "status": "ok"}


@app.get("/v2/draft/serve/{filename}")
def serve_draft_file(filename: str):
    shared_storage_path = os.getenv("SHARED_STORAGE_PATH")
    if not shared_storage_path:
        raise HTTPException(status_code=500, detail="SHARED_STORAGE_PATH is not set.")

    safe_name = os.path.basename((filename or "").replace("\\", "/"))
    if not safe_name:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    file_path = os.path.join(shared_storage_path, safe_name)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found.")

    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=safe_name,
    )


@app.post("/v2/draft/compile")
async def compile_draft(request: DraftCompileRequest, authorization: Optional[str] = Header(default=None)):
    try:
        await verify_token(authorization)

        context_parts: List[str] = []
        if request.case_metadata_context:
            for item in request.case_metadata_context:
                if isinstance(item, dict):
                    for k, v in item.items():
                        context_parts.append(f"{k}: {v}")
        if request.case_context:
            context_parts.append(request.case_context)
        case_context = "\n".join([p for p in context_parts if p]).strip()
        if not case_context:
            raise ValueError("case_context is required.")

        ai_data = generate_legal_draft(
            case_context=case_context,
            legal_documents=request.legal_documents,
            document_type=request.document_type,
        )
        output_path = build_docx_with_controls(ai_data=ai_data, file_target_name=request.file_target_name)
        file_name = os.path.basename(output_path)
        try:
            with open(output_path, "rb") as f:
                file_bytes = f.read()
            document_key = hashlib.sha256(file_bytes).hexdigest()
        except Exception:
            document_key = hashlib.sha256(file_name.encode("utf-8")).hexdigest()

        params: Dict[str, Any] = {
            "document": {
                "fileType": "docx",
                "key": document_key,
                "title": file_name,
                "url": f"http://drafter-service:8003/v2/draft/serve/{file_name}",
                "permissions": {"edit": True, "download": True, "print": True},
            },
            "documentType": "word",
            "editorConfig": {
                "callbackUrl": "http://drafter-service:8003/v2/draft/callback",
                "mode": "edit",
                "customization": {"forcesave": True, "chat": False},
            },
        }
        params["token"] = _jwt_encode(params)
        
        # Include the detected placeholder variables for the frontend workspace side-panel
        metadata = ai_data.get("metadata") or {}
        placeholders_list = metadata.get("placeholders_detected") or []
        params["variablesDetected"] = placeholders_list

        return params
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Draft compilation failed.")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v2/draft/create")
async def create_empty_draft(authorization: Optional[str] = Header(default=None)):
    try:
        await verify_token(authorization)

        shared_storage_path = os.getenv("SHARED_STORAGE_PATH")
        if not shared_storage_path:
            raise HTTPException(status_code=500, detail="SHARED_STORAGE_PATH is not set.")

        os.makedirs(shared_storage_path, exist_ok=True)

        file_name = f"Empty_Draft_{int(time.time())}.docx"
        output_path = os.path.join(shared_storage_path, file_name)

        from docx import Document
        doc = Document()
        doc.add_paragraph("")
        doc.save(output_path)

        with open(output_path, "rb") as f:
            file_bytes = f.read()

        document_key = hashlib.sha256(file_bytes).hexdigest()

        # Copy empty file to lex_bot upload directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        lex_bot_upload_dir = os.path.abspath(os.path.join(current_dir, "../Deep_research/lex_bot/data/uploads"))
        os.makedirs(lex_bot_upload_dir, exist_ok=True)
        lex_bot_path = os.path.join(lex_bot_upload_dir, file_name)
        with open(lex_bot_path, "wb") as f:
            f.write(file_bytes)

        params: Dict[str, Any] = {
            "document": {
                "fileType": "docx",
                "key": document_key,
                "title": file_name,
                "url": f"http://drafter-service:8003/v2/draft/serve/{file_name}",
                "permissions": {"edit": True, "download": True, "print": True},
            },
            "documentType": "word",
            "editorConfig": {
                "callbackUrl": "http://drafter-service:8003/v2/draft/callback",
                "mode": "edit",
                "customization": {"forcesave": True, "chat": False},
            },
        }
        params["token"] = _jwt_encode(params)
        params["documentKey"] = document_key
        params["filename"] = file_name
        params["variablesDetected"] = []

        return params
    except Exception as e:
        logger.exception("Failed to create empty draft.")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v2/draft/upload")
async def upload_draft(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    authorization: Optional[str] = Header(default=None)
):
    try:
        await verify_token(authorization)
        
        shared_storage_path = os.getenv("SHARED_STORAGE_PATH")
        if not shared_storage_path:
            raise HTTPException(status_code=500, detail="SHARED_STORAGE_PATH is not set.")
            
        os.makedirs(shared_storage_path, exist_ok=True)
        
        file_name = file.filename or "uploaded_draft.docx"
        safe_name = file_name.strip()
        
        file_bytes = await file.read()
        is_pdf = safe_name.lower().endswith(".pdf") or file_bytes.startswith(b"%PDF")
        
        if is_pdf:
            if safe_name.lower().endswith(".pdf"):
                safe_name = safe_name[:-4] + ".docx"
            else:
                safe_name = safe_name + ".docx"
        else:
            if not safe_name.lower().endswith(".docx"):
                if "." in safe_name:
                    parts = safe_name.rsplit(".", 1)
                    safe_name = f"{parts[0]}_{int(time.time())}.docx"
                else:
                    safe_name = f"{safe_name}_{int(time.time())}.docx"
                
        output_path = os.path.join(shared_storage_path, safe_name)
        
        if is_pdf:
            import tempfile
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
                temp_pdf.write(file_bytes)
                temp_pdf_path = temp_pdf.name
            
            try:
                from pdf2docx import Converter
                cv = Converter(temp_pdf_path)
                cv.convert(output_path, start=0, end=None)
                cv.close()
            except Exception as conv_e:
                logger.error(f"pdf2docx conversion failed: {conv_e}")
                # Fallback: simple text extraction via fitz (PyMuPDF)
                try:
                    import fitz
                    from docx import Document
                    pdf_doc = fitz.open(temp_pdf_path)
                    doc = Document()
                    for page_num in range(len(pdf_doc)):
                        page = pdf_doc[page_num]
                        text = page.get_text()
                        if page_num > 0:
                            doc.add_page_break()
                        if text.strip():
                            for para_text in text.split('\n\n'):
                                if para_text.strip():
                                    doc.add_paragraph(para_text.strip())
                    doc.save(output_path)
                except Exception as fitz_e:
                    logger.error(f"Fallback fitz conversion also failed: {fitz_e}")
                    raise HTTPException(status_code=500, detail="Failed to convert PDF to DOCX.")
            finally:
                try:
                    os.unlink(temp_pdf_path)
                except Exception:
                    pass
        else:
            with open(output_path, "wb") as f:
                f.write(file_bytes)
            
        # Read the DOCX bytes
        with open(output_path, "rb") as f:
            docx_bytes = f.read()

        # Copy file to lex_bot upload directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        lex_bot_upload_dir = os.path.abspath(os.path.join(current_dir, "../Deep_research/lex_bot/data/uploads"))
        os.makedirs(lex_bot_upload_dir, exist_ok=True)
        lex_bot_path = os.path.join(lex_bot_upload_dir, safe_name)
        with open(lex_bot_path, "wb") as f:
            f.write(docx_bytes)
            
        # Link to session cache if session_id is provided
        if session_id and get_session_cache:
            try:
                session_cache = get_session_cache()
                if session_cache:
                    session_cache.add_file_path(session_id, lex_bot_path)
            except Exception as cache_e:
                logger.warning(f"Failed to add path to session cache: {cache_e}")
                
        # Scan file for placeholders using python-docx and regex
        placeholders_detected = []
        try:
            from docx import Document
            doc = Document(output_path)
            # Scan paragraphs
            for p in doc.paragraphs:
                matches = PLACEHOLDER_REGEX.findall(p.text)
                for m in matches:
                    if m not in placeholders_detected:
                        placeholders_detected.append(m)
            # Scan tables
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        for p in cell.paragraphs:
                            matches = PLACEHOLDER_REGEX.findall(p.text)
                            for m in matches:
                                if m not in placeholders_detected:
                                    placeholders_detected.append(m)
        except Exception as docx_e:
            logger.warning(f"Placeholder parsing failed: {docx_e}")
            
        document_key = hashlib.sha256(docx_bytes).hexdigest()
        
        params: Dict[str, Any] = {
            "document": {
                "fileType": "docx",
                "key": document_key,
                "title": safe_name,
                "url": f"http://drafter-service:8003/v2/draft/serve/{safe_name}",
                "permissions": {"edit": True, "download": True, "print": True},
            },
            "documentType": "word",
            "editorConfig": {
                "callbackUrl": "http://drafter-service:8003/v2/draft/callback",
                "mode": "edit",
                "customization": {"forcesave": True, "chat": False},
            },
        }
        params["token"] = _jwt_encode(params)
        params["variablesDetected"] = placeholders_detected
        params["documentKey"] = document_key
        params["filename"] = safe_name
        
        background_tasks.add_task(extract_and_cache_docx, lex_bot_path)
        
        return params
    except Exception as e:
        logger.exception("Draft upload failed.")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v2/draft/forcesave")
async def onlyoffice_forcesave(request: ForceSaveRequest, authorization: Optional[str] = Header(default=None)):
    await verify_token(authorization)

    document_key = (request.document_key or "").strip()
    if not document_key:
        raise HTTPException(status_code=400, detail="document_key is required.")

    payload = {"c": "forcesave", "key": document_key}
    token = _jwt_encode(payload)
    command_payload = {"c": "forcesave", "key": document_key, "token": token}
    headers = {"Authorization": f"Bearer {token}"}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "http://onlyoffice-server/coauthoring/CommandService.ashx",
                json=command_payload,
                headers=headers,
                timeout=15.0,
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"OnlyOffice CommandService request failed: {e}")

    if resp.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"OnlyOffice CommandService error: {resp.status_code}")

    return {"ok": True}


@app.post("/v2/draft/callback")
async def onlyoffice_callback(event: Dict[str, Any], authorization: Optional[str] = Header(default=None)):
    try:
        token: Optional[str] = None
        if isinstance(authorization, str) and authorization.strip():
            auth_val = authorization.strip()
            if auth_val.lower().startswith("bearer "):
                token = auth_val.split(" ", 1)[1].strip()
            else:
                token = auth_val
        if not token:
            payload_token = event.get("token")
            if isinstance(payload_token, str) and payload_token.strip():
                token = payload_token.strip()

        if not token:
            raise HTTPException(status_code=403, detail="Forbidden")

        try:
            jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.PyJWTError:
            raise HTTPException(status_code=403, detail="Forbidden")

        status = event.get("status")
        if isinstance(status, str) and status.isdigit():
            status = int(status)

        if status == 4:
            return {"error": 0}

        if status in (2, 6):
            url = event.get("url") or event.get("fileUrl") or event.get("downloadUrl")
            if isinstance(url, dict):
                url = url.get("url")
            if not isinstance(url, str) or not url.strip():
                return {"error": 0}

            url = _normalize_download_url(url.strip())

            shared_storage_path = os.getenv("SHARED_STORAGE_PATH")
            if not shared_storage_path:
                return {"error": 0}

            file_name = _safe_basename_from_url(url)
            if not file_name:
                return {"error": 0}

            target_path = os.path.join(shared_storage_path, file_name)
            os.makedirs(shared_storage_path, exist_ok=True)

            async with httpx.AsyncClient(follow_redirects=True) as client:
                async with client.stream("GET", url, timeout=60.0) as resp:
                    resp.raise_for_status()
                    with open(target_path, "wb") as f:
                        async for chunk in resp.aiter_bytes():
                            if chunk:
                                f.write(chunk)
    except Exception:
        logger.exception("OnlyOffice callback processing failed.")

    return {"error": 0}


if __name__ == "__main__":
    uvicorn.run("Drafter:app", host="0.0.0.0", port=8003, reload=True)
