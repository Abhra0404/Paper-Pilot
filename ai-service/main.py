from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llm import generate_answer

from embeddings import create_embeddings
from vector_store import (
    collection_exists,
    create_collection,
    insert_chunks,
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


class IndexRequest(BaseModel):
    chunks: list[str]


class QueryRequest(BaseModel):
    question: str


@app.get("/")
def root():
    return {
        "message": "PaperPilot AI Service is running"
    }


@app.post("/index")
def index_paper(request: IndexRequest):
    chunks = [chunk.strip() for chunk in request.chunks if chunk.strip()]

    if not chunks:
        raise HTTPException(
            status_code=400,
            detail="At least one non-empty chunk is required",
        )

    embeddings = create_embeddings(chunks)

    create_collection(
        vector_size=len(embeddings[0])
    )

    insert_chunks(
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

    if not collection_exists():
        raise HTTPException(
            status_code=409,
            detail="Index a paper before asking a question",
        )

    embedding = create_embeddings(
        [question]
    )[0]

    results = search(
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