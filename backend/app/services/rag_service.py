import httpx
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings

from app.core.config import get_settings


class RAGService:
    def __init__(self):
        settings = get_settings()
        self._embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
        )
        self._splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
        )
        self._supabase_url = settings.SUPABASE_URL
        self._supabase_key = settings.SUPABASE_KEY
        self._headers = {
            "apikey": self._supabase_key,
            "Authorization": f"Bearer {self._supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

    async def store_document(self, text: str, metadata: dict | None = None) -> int:
        """텍스트를 청킹 → 임베딩 → Supabase에 저장. 저장된 청크 수 반환."""
        chunks = self._splitter.split_text(text)
        vectors = self._embeddings.embed_documents(chunks)

        rows = [
            {
                "content": chunk,
                "embedding": vec,
                "metadata": metadata or {},
            }
            for chunk, vec in zip(chunks, vectors)
        ]

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self._supabase_url}/rest/v1/documents",
                headers=self._headers,
                json=rows,
            )
            resp.raise_for_status()

        return len(rows)

    async def search(self, query: str, top_k: int = 5) -> list[dict]:
        """쿼리와 유사한 문서 청크를 검색."""
        query_vec = self._embeddings.embed_query(query)

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self._supabase_url}/rest/v1/rpc/match_documents",
                headers=self._headers,
                json={"query_embedding": query_vec, "match_count": top_k},
            )
            resp.raise_for_status()

        return resp.json()


def get_rag_service() -> RAGService:
    return RAGService()
