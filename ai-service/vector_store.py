from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import os
import uuid



def create_client():
    qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
    remote_client = QdrantClient(url=qdrant_url)

    try:
        remote_client.get_collections()
        return remote_client
    except Exception:
        return QdrantClient(":memory:")


client = create_client()

COLLECTION_NAME = "paperpilot"


def collection_exists():
    return any(
        collection.name == COLLECTION_NAME
        for collection in client.get_collections().collections
    )


def create_collection(vector_size):
    if not collection_exists():
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE,
            ),
        )


def insert_chunks(chunks, embeddings):
    points = []

    for chunk, embedding in zip(chunks, embeddings):
        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding,
                payload={
                    "text": chunk,
                },
            )
        )

    client.upsert(
        collection_name=COLLECTION_NAME,
        points=points,
    )


def search(query_embedding, limit=5):
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        limit=limit,
    )

    return [
        {
            "text": result.payload["text"],
            "score": result.score,
        }
        for result in results.points
    ]

def reset_collection():
    collections = client.get_collections().collections

    exists = any(
        collection.name == COLLECTION_NAME
        for collection in collections
    )

    if exists:
        client.delete_collection(
            collection_name=COLLECTION_NAME
        )