from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import io
import os
import tempfile
import zipfile
import fitz  # PyMuPDF
try:
    from pypdf import PdfReader, PdfWriter, PdfMerger
    print("SUCCESS: Imported pypdf classes")
except ImportError as e:
    print(f"FAILURE: {e}")
