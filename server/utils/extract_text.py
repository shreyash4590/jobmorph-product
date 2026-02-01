# server/utils/extract_text.py

import os
from PyPDF2 import PdfReader
import docx

# OCR dependencies (PDF ONLY – NOT IMAGES)
from pdf2image import convert_from_path
import pytesseract


# ======================================================
# MAIN ENTRY
# ======================================================
def extract_text(file_path):
    """
    Extract text from PDF, DOCX, or TXT.
    - Images are NOT allowed
    - OCR is used ONLY for scanned PDFs
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
        # Safety net (images blocked here)
        raise ValueError(f"❌ Unsupported file type: {ext}")


# ======================================================
# PDF EXTRACTION (TEXT → OCR FALLBACK)
# ======================================================
def extract_from_pdf_with_ocr(pdf_path):
    """
    1️⃣ Try normal text extraction (FAST)
    2️⃣ If empty → OCR fallback (SLOW, PDF ONLY)
    """

    text = extract_from_pdf_text(pdf_path)

    if text.strip():
        return text.strip()

    # ---- OCR FALLBACK ----
    print("⚠️ No extractable text found. Attempting OCR (PDF only)...")

    ocr_text = extract_from_pdf_ocr(pdf_path)

    if not ocr_text.strip():
        print("❌ OCR failed or PDF is unreadable")
        return ""

    return ocr_text.strip()


def extract_from_pdf_text(pdf_path):
    """
    Extract text from text-based PDFs.
    Image-only PDFs will return empty string.
    """
    text = ""
    try:
        reader = PdfReader(pdf_path)

        for i, page in enumerate(reader.pages):
            content = page.extract_text()
            if content:
                text += content + "\n"
            else:
                print(f"⚠️ Page {i + 1} has no extractable text")

    except Exception as e:
        print(f"❌ PDF text extraction error: {e}")

    return text


def extract_from_pdf_ocr(pdf_path):
    """
    OCR fallback – ONLY for PDFs
    """
    text = ""
    try:
        images = convert_from_path(pdf_path)

        for img in images:
            text += pytesseract.image_to_string(img)

    except Exception as e:
        print(f"❌ OCR processing failed: {e}")

    return text


# ======================================================
# DOCX EXTRACTION
# ======================================================
def extract_from_docx(docx_path):
    try:
        document = docx.Document(docx_path)
        paragraphs = [p.text for p in document.paragraphs if p.text.strip()]
        return "\n".join(paragraphs).strip()
    except Exception as e:
        raise RuntimeError(f"DOCX extraction failed: {e}")


# ======================================================
# TXT EXTRACTION
# ======================================================
def extract_from_txt(txt_path):
    try:
        with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()
    except Exception as e:
        raise RuntimeError(f"TXT extraction failed: {e}")













# import os
# from PyPDF2 import PdfReader
# import docx


# def extract_text(file_path):
#     """
#     Extract text from PDF, DOCX, or TXT.
#     Image-based PDFs will return empty text (handled upstream).
#     """
#     if not os.path.exists(file_path):
#         raise FileNotFoundError(f"❌ File not found: {file_path}")

#     ext = os.path.splitext(file_path)[1].lower()

#     try:
#         if ext == '.pdf':
#             return extract_from_pdf(file_path)

#         elif ext in ['.docx', '.doc']:
#             return extract_from_docx(file_path)

#         elif ext == '.txt':
#             return extract_from_txt(file_path)

#         else:
#             raise ValueError(f"❌ Unsupported file format: {ext}")

#     except Exception as e:
#         raise RuntimeError(f"❌ Error extracting text: {str(e)}")


# def extract_from_pdf(pdf_path):
#     """
#     Extract text from text-based PDFs.
#     Image-based PDFs will result in empty text.
#     """
#     text = ""
#     try:
#         reader = PdfReader(pdf_path)
#         for i, page in enumerate(reader.pages):
#             content = page.extract_text()
#             if content:
#                 text += content + "\n"
#             else:
#                 print(f"⚠️ Page {i + 1} has no extractable text (likely scanned PDF)")
#         return text.strip()
#     except Exception as e:
#         raise RuntimeError(f"PDF extraction failed: {str(e)}")


# def extract_from_docx(docx_path):
#     try:
#         doc = docx.Document(docx_path)
#         paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
#         return "\n".join(paragraphs).strip()
#     except Exception as e:
#         raise RuntimeError(f"DOCX extraction failed: {str(e)}")


# def extract_from_txt(txt_path):
#     try:
#         with open(txt_path, 'r', encoding='utf-8') as f:
#             return f.read().strip()
#     except Exception as e:
#         raise RuntimeError(f"TXT extraction failed: {str(e)}")