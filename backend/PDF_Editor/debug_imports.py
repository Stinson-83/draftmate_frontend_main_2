import pypdf
import sys

print(f"Python executable: {sys.executable}")
print(f"pypdf file: {pypdf.__file__}")
print(f"pypdf version: {pypdf.__version__}")
print(f"dir(pypdf): {dir(pypdf)}")

try:
    from pypdf import PdfReader
    print("Successfully imported PdfReader")
except ImportError as e:
    print(f"ImportError: {e}")
