import io
import tempfile
from pathlib import Path

from fastapi import UploadFile
from pypdf import PdfReader


async def parse_pdf(file: UploadFile) -> str:
    """PDF에서 텍스트를 추출한다. pypdf 1차 시도, 실패 시 pdfminer fallback."""
    content = await file.read()

    text = _extract_with_pypdf(content)

    if len(text.strip()) < 50:
        text = _extract_with_pdfminer(content)

    return text.strip()


def _extract_with_pypdf(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages)


def _extract_with_pdfminer(content: bytes) -> str:
    from pdfminer.high_level import extract_text as pdfminer_extract

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        return pdfminer_extract(str(tmp_path))
    finally:
        tmp_path.unlink(missing_ok=True)
