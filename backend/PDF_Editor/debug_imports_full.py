try:
    import fitz
    print("Imported fitz")
except Exception as e:
    print(f"Failed fitz: {e}")

try:
    from pypdf import PdfReader
    print("Imported PdfReader")
except Exception as e:
    print(f"Failed PdfReader from pypdf: {e}")

# Try importing old way just in case
try:
    from PyPDF2 import PdfReader
    print("Imported PdfReader from PyPDF2")
except Exception as e:
    print(f"Failed PdfReader from PyPDF2: {e}")

import pypdf
print(f"pypdf file: {pypdf.__file__}")
