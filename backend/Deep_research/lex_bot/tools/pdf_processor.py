import logging
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
import fitz  # PyMuPDF
from pdf2image import convert_from_path
import easyocr
import numpy as np
logger = logging.getLogger(__name__)

class PDFProcessor:
    """
    Handles PDF text extraction and chunking.
    """
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        self.reader = easyocr.Reader(['en'], gpu=False)

    def extract_text(self, pdf_path: str) -> str:
            # 1. Try Direct Extraction
            doc = fitz.open(pdf_path)
            extracted_text = ""
            page_count = len(doc)
            
            for page in doc:
                extracted_text += page.get_text()
            
            # 2. Check if text is valid
            if len(extracted_text.strip()) > (page_count * 20):
                print("Successfully extracted selectable text.")
                doc.close()
                return extracted_text
            
            # 3. Fallback to OCR using EasyOCR
            print("No selectable text found. Falling back to OCR...")
            ocr_text_list = []
            
            try:
                for i, page in enumerate(doc):
                    # Convert PDF page to an image (pixmap)
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2)) # 2x zoom for better OCR
                    
                    # Convert pixmap to a numpy array that EasyOCR can read
                    img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                    
                    # Perform OCR
                    # detail=0 returns just the text strings without coordinates
                    result = self.reader.readtext(img_data, detail=0)
                    
                    page_content = " ".join(result)
                    ocr_text_list.append(page_content)
                    print(f"OCR: Processed page {i+1}")
                
                doc.close()
                return "\n".join(ocr_text_list)

            except Exception as e:
                logger.error(f"OCR Failed: {e}")
                if 'doc' in locals(): doc.close()
                return ""
            
    def chunk_text(self, text: str) -> List[str]:
        """
        Splits text into chunks.
        """
        if not text:
            return []
        return self.splitter.split_text(text)

# Singleton
pdf_processor = PDFProcessor()
