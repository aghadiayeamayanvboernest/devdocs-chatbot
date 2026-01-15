"""File processing service for handling uploaded files."""
import io
import logging
from typing import List, Tuple
from fastapi import UploadFile

logger = logging.getLogger(__name__)

# Supported file extensions
SUPPORTED_EXTENSIONS = {
    ".txt", ".md", ".json", ".js", ".ts", ".tsx", ".jsx",
    ".py", ".css", ".html", ".xml", ".yaml", ".yml", ".csv", ".pdf"
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


async def extract_text_from_file(file: UploadFile) -> Tuple[str, str]:
    """
    Extract text content from an uploaded file.

    Returns:
        Tuple of (filename, extracted_text)
    """
    filename = file.filename or "unknown"
    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""

    if ext not in SUPPORTED_EXTENSIONS:
        logger.warning(f"Unsupported file type: {ext}")
        return filename, f"[Unsupported file type: {ext}]"

    try:
        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            return filename, f"[File too large: {len(content)} bytes, max {MAX_FILE_SIZE} bytes]"

        # Handle PDF files
        if ext == ".pdf":
            text = await extract_pdf_text(content)
            return filename, text

        # Handle text-based files
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                text = content.decode("latin-1")
            except Exception:
                return filename, "[Could not decode file content]"

        return filename, text

    except Exception as e:
        logger.error(f"Error extracting text from {filename}: {e}")
        return filename, f"[Error reading file: {str(e)}]"


async def extract_pdf_text(content: bytes) -> str:
    """Extract text from PDF content."""
    try:
        try:
            from PyPDF2 import PdfReader
            pdf_file = io.BytesIO(content)
            reader = PdfReader(pdf_file)

            text_parts = []
            for page_num, page in enumerate(reader.pages, 1):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(f"--- Page {page_num} ---\n{page_text}")

            return "\n\n".join(text_parts) if text_parts else "[No text found in PDF]"

        except ImportError:
            return "[PDF parsing not available - install PyPDF2]"

    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        return f"[Error parsing PDF: {str(e)}]"


async def process_uploaded_files(files: List[UploadFile]) -> str:
    """
    Process multiple uploaded files and return combined context.

    Returns:
        Combined text content from all files, formatted for context.
    """
    if not files:
        return ""

    file_contents = []

    for file in files:
        filename, text = await extract_text_from_file(file)

        # Truncate very long files
        max_chars = 50000
        if len(text) > max_chars:
            text = text[:max_chars] + f"\n\n[... truncated, {len(text) - max_chars} chars omitted ...]"

        file_contents.append(f"=== File: {filename} ===\n{text}\n")

    combined = "\n".join(file_contents)
    logger.info(f"Processed {len(files)} files, total {len(combined)} chars")

    return combined


def format_file_context(file_content: str) -> str:
    """Format file content for inclusion in prompt context."""
    if not file_content:
        return ""

    return f"""
<uploaded_files>
The user has uploaded the following file(s) for context:

{file_content}
</uploaded_files>

Please analyze the uploaded file content and use it to help answer the user's question.
"""
