# server/utils/extract_text.py

import os
from PyPDF2 import PdfReader
import docx

# Try to import OCR libraries (Google Cloud Vision API)
try:
    from google.cloud import vision
    import fitz  # PyMuPDF
    OCR_AVAILABLE = True
    print("✅ OCR available via Google Cloud Vision API")
except ImportError as e:
    OCR_AVAILABLE = False
    print(f"⚠️ OCR not available: {e}")


class ScannedPDFError(Exception):
    """Raised when a scanned PDF is detected but OCR is not available"""
    pass


# ======================================================
# MAIN ENTRY
# ======================================================
def extract_text(file_path):
    """
    Extract text from PDF, DOCX, or TXT.
    - Text-based PDFs: Fast extraction
    - Scanned PDFs: OCR fallback (if available)
    """

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"❌ File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return extract_from_pdf_with_ocr(file_path)

    elif ext in {".docx", ".doc"}:
        return extract_from_docx(file_path)

    elif ext == ".txt":
        return extract_from_txt(file_path)

    else:
        raise ValueError(f"❌ Unsupported file type: {ext}")


# ======================================================
# PDF EXTRACTION (TEXT → OCR FALLBACK)
# ======================================================
def extract_from_pdf_with_ocr(pdf_path):
    """
    1️⃣ Try normal text extraction (FAST)
    2️⃣ If empty → OCR fallback with Vision API
    """

    # Try text extraction first
    text = extract_from_pdf_text(pdf_path)

    if text.strip() and len(text.strip()) >= 50:
        print("✅ Text extracted from PDF")
        return text.strip()

    # ---- OCR FALLBACK ----
    print("⚠️ No extractable text found. Attempting OCR with Vision API...")

    if not OCR_AVAILABLE:
        raise ScannedPDFError(
            "This PDF appears to be scanned or image-based. "
            "OCR service is not available on this server. "
            "Please upload a text-based PDF or contact support."
        )

    try:
        ocr_text = extract_from_pdf_ocr(pdf_path)
        
        if not ocr_text.strip() or len(ocr_text.strip()) < 50:
            raise ScannedPDFError(
                "Could not extract enough text from this PDF. "
                "The file may be blank, corrupted, or have very low quality images."
            )
        
        print(f"✅ OCR successful: {len(ocr_text)} characters extracted")
        return ocr_text.strip()
        
    except Exception as e:
        if isinstance(e, ScannedPDFError):
            raise
        print(f"❌ OCR failed: {e}")
        raise ScannedPDFError(
            f"Failed to extract text from this scanned PDF: {str(e)}"
        )


def extract_from_pdf_text(pdf_path):
    """
    Extract text from text-based PDFs.
    Image-only PDFs will return empty string.
    """
    text = ""
    try:
        reader = PdfReader(pdf_path)

        if len(reader.pages) == 0:
            return ""

        for i, page in enumerate(reader.pages):
            content = page.extract_text()
            if content:
                text += content + "\n"

    except Exception as e:
        print(f"⚠️ PDF text extraction error: {e}")
        return ""

    return text


def extract_from_pdf_ocr(pdf_path):
    """
    OCR fallback using Google Cloud Vision API
    Works on App Engine Standard (no poppler/tesseract needed!)
    """
    if not OCR_AVAILABLE:
        raise ImportError("Google Cloud Vision API not configured")
    
    text = ""
    try:
        # Initialize Vision API client
        client = vision.ImageAnnotatorClient()
        
        # Open PDF with PyMuPDF (works without poppler!)
        pdf_document = fitz.open(pdf_path)
        total_pages = len(pdf_document)
        
        print(f"📄 Processing {total_pages} page(s) with Vision API...")
        
        for page_num in range(total_pages):
            page = pdf_document[page_num]
            
            # Convert page to image (PNG format)
            # Using 200 DPI for good quality and reasonable processing time
            pix = page.get_pixmap(dpi=200)
            img_bytes = pix.tobytes("png")
            
            # Send to Vision API
            image = vision.Image(content=img_bytes)
            response = client.text_detection(image=image)
            
            # ✅ FIXED: Better error handling for Vision API
            if response.error.message:
                error_msg = response.error.message
                
                # Provide helpful error based on error type
                if "quota" in error_msg.lower():
                    raise Exception(
                        "Vision API quota exceeded. Please try again later or contact support."
                    )
                elif "permission" in error_msg.lower() or "authentication" in error_msg.lower():
                    raise Exception(
                        "Vision API authentication failed. Please contact support."
                    )
                else:
                    raise Exception(f"Vision API error: {error_msg}")
            
            # Extract text from annotations
            if response.text_annotations:
                # First annotation contains all text
                page_text = response.text_annotations[0].description
                text += page_text + "\n\n"
                print(f"✅ Page {page_num + 1}/{total_pages} processed ({len(page_text)} chars)")
            else:
                print(f"⚠️ Page {page_num + 1}/{total_pages} has no text")
        
        pdf_document.close()
        
        if not text.strip():
            raise Exception("No text found in any page")
        
        print(f"✅ Vision API OCR complete: {len(text)} characters extracted")
        
    except Exception as e:
        print(f"❌ OCR processing failed: {e}")
        raise

    return text


# ======================================================
# DOCX EXTRACTION
# ======================================================
def extract_from_docx(docx_path):
    try:
        document = docx.Document(docx_path)
        paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
        
        if not paragraphs:
            raise ValueError("DOCX file appears to be empty")
        
        return "\n".join(paragraphs).strip()
        
    except Exception as e:
        raise RuntimeError(f"DOCX extraction failed: {e}")


# ======================================================
# TXT EXTRACTION
# ======================================================
def extract_from_txt(txt_path):
    try:
        with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read().strip()
            
        if not content:
            raise ValueError("TXT file is empty")
            
        return content
        
    except Exception as e:
        raise RuntimeError(f"TXT extraction failed: {e}")