# PaperPilot — AI Research Paper Assistant

PaperPilot is an AI-powered desktop application that helps users understand research papers more efficiently. It combines PDF reading with Retrieval-Augmented Generation (RAG), allowing users to ask questions about research papers and receive context-aware answers supported by relevant source excerpts.

Built with Electron, React, FastAPI, Qdrant, Sentence Transformers, and Groq, PaperPilot brings research reading and AI-assisted understanding into one workspace.

## Features

- **Research Library:** Store and organize research papers in a centralized desktop library.
- **PDF Reading:** Open and read research papers within the application.
- **AI-Powered Q&A:** Ask questions about a paper and receive answers grounded in its content.
- **Semantic Search:** Retrieve relevant passages using vector embeddings rather than relying only on keyword matching.
- **Source References:** View relevant source excerpts and page information when available.
- **Local Library:** Revisit saved papers without manually selecting them each time.
- **Dark Desktop Interface:** A focused interface designed for reading and research.

## Tech Stack

| Component | Technology |
|---|---|
| Desktop application | Electron.js |
| Frontend | React, Vite |
| Backend API | Python, FastAPI |
| PDF processing | pdf-parse |
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`) |
| Vector database | Qdrant |
| LLM inference | Groq API |
| HTTP communication | Axios, HTTPX |

## Architecture

PaperPilot uses a RAG pipeline to generate answers grounded in the contents of research papers.

```text
Research Paper (PDF)
        |
        v
 PDF Text Extraction
        |
        v
 Text Chunking
        |
        v
 Sentence Transformers
        |
        v
 Qdrant Vector Database
        |
        v
 User Question
        |
        v
 Semantic Retrieval
        |
        v
 Relevant Paper Context
        |
        v
 Groq Inference API
        |
        v
 Grounded Answer + Sources
```

The Electron application provides the desktop interface, while the FastAPI service handles embeddings, vector retrieval, and AI-generated responses.

## Prerequisites

Before running PaperPilot, install:

- [Node.js](https://nodejs.org/) and npm
- [Python](https://www.python.org/) compatible with the project's dependencies
- A [Groq API key](https://console.groq.com/)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd paperpilot
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Set up the AI service

Navigate to the AI service directory:

```bash
cd ai-service
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it.

**macOS / Linux**

```bash
source .venv/bin/activate
```

**Windows PowerShell**

```powershell
.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

### 4. Configure the Groq API key

Set the environment variable expected by the backend.

**macOS / Linux**

```bash
export GROQ_API_KEY="your_groq_api_key"
```

**Windows PowerShell**

```powershell
$env:GROQ_API_KEY="your_groq_api_key"
```

Keep your API key private. Never commit it to version control.

### 5. Configure vector storage

PaperPilot uses Qdrant's embedded local storage by default, so a separate Qdrant
server is not required. Data is stored under the application's user-data
directory. To use a remote Qdrant server instead, set `QDRANT_URL`.

### 6. Start the AI service

From the `ai-service` directory, with the virtual environment activated and API key configured:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at:

- API: `http://localhost:8000`
- Interactive API documentation: `http://localhost:8000/docs`

### 7. Launch PaperPilot

Open a separate terminal, navigate to the project root, and run:

```bash
npm run dev
```

This starts the Vite development server and launches the Electron desktop application using the configured development script.

## How to Use

1. Launch PaperPilot and open the research library.
2. Add a research paper in PDF format.
3. Wait for text extraction, chunking, embedding generation, and indexing to complete.
4. Open the indexed paper in the reading workspace.
5. Ask questions about its methodology, architecture, experiments, findings, or technical concepts.
6. Review the generated answers and retrieved source excerpts to understand the evidence behind them.

## Project Structure

```text
paperpilot/
├── electron/
│   ├── main.js
│   └── preload.js
├── src/
│   ├── components/
│   ├── services/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── ai-service/
│   ├── main.py
│   ├── embeddings.py
│   ├── vector_store.py
│   ├── llm.py
│   └── requirements.txt
├── package.json
└── vite.config.js
```

*The exact structure may vary as the project evolves.*

## Future Improvements

- More advanced citation navigation and PDF highlighting.
- Improved multi-paper search and comparison.
- Paper summaries and structured research insights.
- Enhanced document management and indexing.
- Production packaging for Windows, macOS, and Linux.
