print("Testing import order...")
try:
    from pypdf import PdfReader
    print("1. pypdf imported successfully")
except ImportError:
    print("1. pypdf failed initially")

import fastapi
print("Imported fastapi")

try:
    from pypdf import PdfWriter
    print("2. pypdf imported successfully after fastapi")
except ImportError:
    print("2. pypdf failed after fastapi")
    
import fitz
print("Imported fitz")

try:
    from pypdf import PdfMerger
    print("3. pypdf imported successfully after fitz")
except ImportError:
    print("3. pypdf failed after fitz")
