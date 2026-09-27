from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from embeddings import create_embeddings
from vector_store import (
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

    embeddings = create_embeddings(request.chunks)

    create_collection(
        vector_size=len(embeddings[0])
    )

    insert_chunks(
        request.chunks,
        embeddings
    )

    return {
        "success": True,
        "chunks_indexed": len(request.chunks),
    }


@app.post("/query")
def query_paper(request: QueryRequest):

    embedding = create_embeddings(
        [request.question]
    )[0]

    results = search(embedding)

    return {
        "results": results
    }