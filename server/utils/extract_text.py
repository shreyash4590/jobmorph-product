import os
from PyPDF2 import PdfReader
import docx


def extract_text(file_path):
    """
    Extract text from PDF, DOCX, or TXT.
    Image-based PDFs will return empty text (handled upstream).
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"❌ File not found: {file_path}")

    ext = os.path.splitext(file_path)[1].lower()

    try:
        if ext == '.pdf':
            return extract_from_pdf(file_path)

        elif ext in ['.docx', '.doc']:
            return extract_from_docx(file_path)

        elif ext == '.txt':
            return extract_from_txt(file_path)

        else:
            raise ValueError(f"❌ Unsupported file format: {ext}")

    except Exception as e:
        raise RuntimeError(f"❌ Error extracting text: {str(e)}")


def extract_from_pdf(pdf_path):
    """
    Extract text from text-based PDFs.
    Image-based PDFs will result in empty text.
    """
    text = ""
    try:
        reader = PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            content = page.extract_text()
            if content:
                text += content + "\n"
            else:
                print(f"⚠️ Page {i + 1} has no extractable text (likely scanned PDF)")
        return text.strip()
    except Exception as e:
        raise RuntimeError(f"PDF extraction failed: {str(e)}")


def extract_from_docx(docx_path):
    try:
        doc = docx.Document(docx_path)
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs).strip()
    except Exception as e:
        raise RuntimeError(f"DOCX extraction failed: {str(e)}")


def extract_from_txt(txt_path):
    try:
        with open(txt_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except Exception as e:
        raise RuntimeError(f"TXT extraction failed: {str(e)}")
