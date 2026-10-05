import os
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent / ".env")


GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)


def _prompt(question: str, context: str) -> str:
    return f"""\
You are PaperPilot, an AI research assistant.

Answer the user's question using ONLY the provided research paper context.
If the answer cannot be found in the context, say that the paper does not
provide enough information.
Be precise and explain technical concepts clearly.

Research paper context:
{context}

User question:
{question}
"""


def _request_error(provider: str, error: httpx.HTTPStatusError) -> RuntimeError:
    detail = error.response.text[:500].strip()
    return RuntimeError(
        f"{provider} API request failed with HTTP {error.response.status_code}: "
        f"{detail or 'no error details returned'}"
    )


def _groq_answer(prompt: str, api_key: str) -> Any:
    model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    response = httpx.post(
        GROQ_API_URL,
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
        },
        timeout=60.0,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


def _gemini_answer(prompt: str, api_key: str) -> Any:
    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    response = httpx.post(
        GEMINI_API_URL.format(model=model),
        params={"key": api_key},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2},
        },
        timeout=60.0,
    )
    response.raise_for_status()
    return response.json()["candidates"][0]["content"]["parts"][0]["text"]


def generate_answer(question: str, context: str) -> str:
    provider = os.getenv("LLM_PROVIDER", "groq").lower()
    if provider not in {"groq", "gemini"}:
        raise RuntimeError("LLM_PROVIDER must be either 'groq' or 'gemini'")

    key_name = "GROQ_API_KEY" if provider == "groq" else "GEMINI_API_KEY"
    api_key = os.getenv(key_name)
    if not api_key:
        raise RuntimeError(f"{key_name} environment variable is not set")

    try:
        answer = (
            _groq_answer(_prompt(question, context), api_key)
            if provider == "groq"
            else _gemini_answer(_prompt(question, context), api_key)
        )
    except httpx.TimeoutException as error:
        raise RuntimeError(f"{provider.title()} API request timed out") from error
    except httpx.RequestError as error:
        raise RuntimeError(f"Could not reach {provider.title()} API: {error}") from error
    except httpx.HTTPStatusError as error:
        raise _request_error(provider.title(), error) from error
    except (KeyError, IndexError, TypeError, ValueError) as error:
        raise RuntimeError(
            f"{provider.title()} API returned an unexpected response format"
        ) from error

    if not isinstance(answer, str) or not answer.strip():
        raise RuntimeError(f"{provider.title()} API returned an empty answer")

    return answer.strip()
