from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)
import os
import uuid
import hashlib
from pathlib import Path


def collection_name(paper_id):
    digest = hashlib.sha256(paper_id.encode("utf-8")).hexdigest()[:24]
    return f"paperpilot_{digest}"


def create_client():
    qdrant_url = os.getenv("QDRANT_URL")
    if qdrant_url:
        return QdrantClient(url=qdrant_url)

    qdrant_path = Path(
        os.getenv(
            "PAPERPILOT_QDRANT_PATH",
            Path.home() / ".paperpilot" / "qdrant",
        )
    )
    qdrant_path.mkdir(parents=True, exist_ok=True)
    return QdrantClient(path=str(qdrant_path))


client = create_client()


def collection_exists(paper_id):
    name = collection_name(paper_id)
    return any(
        collection.name == name
        for collection in client.get_collections().collections
    )


def create_collection(paper_id, vector_size):
    name = collection_name(paper_id)
    if not collection_exists(paper_id):
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE,
            ),
        )


def insert_chunks(paper_id, chunks, embeddings):

    points = []

    for chunk, embedding in zip(chunks, embeddings):

        points.append(
            PointStruct(
                id=str(uuid.uuid4()),

                vector=embedding,

                payload={
                    "paper_id": paper_id,
                    "text": chunk.text,
                    "page_number": chunk.pageNumber,
                    "chunk_index": chunk.chunkIndex,
                },
            )
        )

    client.upsert(
        collection_name=collection_name(paper_id),
        points=points,
    )


def search(paper_id, query_embedding, limit=5):
    results = client.query_points(
        collection_name=collection_name(paper_id),
        query=query_embedding,
        limit=limit,
        query_filter=Filter(
            must=[
                FieldCondition(
                    key="paper_id",
                    match=MatchValue(value=paper_id),
                )
            ]
        ),
    )

    return [
        {
            "text": result.payload["text"],
            "score": result.score,
            "page_number": result.payload["page_number"],
            "chunk_index": result.payload["chunk_index"],
        }
        for result in results.points
    ]

def reset_collection(paper_id):
    collections = client.get_collections().collections

    exists = any(
        collection.name == collection_name(paper_id)
        for collection in collections
    )

    if exists:
        client.delete_collection(
            collection_name=collection_name(paper_id)
        )