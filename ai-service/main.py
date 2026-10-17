from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pydantic import Field
from llm import generate_answer

from embeddings import create_embeddings
from vector_store import (
    collection_exists,
    create_collection,
    insert_chunks,
    reset_collection,
    search,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "file://",
        "null",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Chunk(BaseModel):
    text: str
    pageNumber: int
    chunkIndex: int


class IndexRequest(BaseModel):
    paper_id: str = Field(min_length=1, max_length=100)
    chunks: list[Chunk]


class QueryRequest(BaseModel):
    paper_id: str = Field(min_length=1, max_length=100)
    question: str


@app.get("/")
def root():
    return {
        "message": "PaperPilot AI Service is running"
    }


@app.head("/", include_in_schema=False)
def root_head():
    return None


@app.post("/index")
def index_paper(request: IndexRequest):
    chunks = [chunk for chunk in request.chunks if chunk.text.strip()]
    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="At least one non-empty chunk is required",
        )

    embeddings = create_embeddings([chunk.text for chunk in chunks])

    reset_collection(request.paper_id)
    create_collection(
        request.paper_id,
        vector_size=len(embeddings[0]),
    )

    insert_chunks(
        request.paper_id,
        chunks,
        embeddings
    )

    return {
        "success": True,
        "chunks_indexed": len(chunks),
    }


@app.post("/query")
def query_paper(request: QueryRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    if not collection_exists(request.paper_id):
        raise HTTPException(
            status_code=409,
            detail="Index a paper before asking a question",
        )

    embedding = create_embeddings(
        [question]
    )[0]

    results = search(
        request.paper_id,
        embedding,
        limit=5
    )

    context = "\n\n".join(
        result["text"]
        for result in results
    )

    answer = generate_answer(
        question,
        context
    )

    return {
        "answer": answer,
        "sources": results,
    }
