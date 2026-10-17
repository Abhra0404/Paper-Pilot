# PaperPilot

**Your research papers. One workspace. Smarter understanding.**

PaperPilot is an AI-powered desktop application that helps users read, explore, and understand research papers. It combines PDF reading with Retrieval-Augmented Generation (RAG), enabling users to ask questions about a paper and receive context-aware answers based on relevant passages from the document.

Built with Electron, React, FastAPI, Qdrant, Sentence Transformers, and Groq, PaperPilot brings document reading and AI-assisted research into a single desktop workspace.

## Features

- **Research Library:** Keep research papers organized in a centralized workspace.
- **Integrated PDF Reading:** Open research papers within the desktop application.
- **AI-Powered Q&A:** Ask questions about a paper's concepts, methodology, architecture, experiments, and findings.
- **Semantic Retrieval:** Find relevant passages using vector embeddings and similarity search.
- **Context-Grounded Answers:** Provide retrieved paper excerpts to the language model to help ground its responses in the document.
- **Source References:** Inspect retrieved source excerpts and page information when available.
- **Modern Desktop Experience:** A polished dark interface designed for focused reading and research.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop framework | Electron.js |
| Frontend | React, Vite |
| Backend API | Python, FastAPI |
| PDF extraction | pdf-parse |
| Embedding model | Sentence Transformers — `all-MiniLM-L6-v2` |
| Vector database | Qdrant |
| LLM inference | Groq API |
| HTTP clients | Axios, HTTPX |

## How It Works

PaperPilot uses Retrieval-Augmented Generation (RAG) to answer questions using the contents of research papers.

```text
          Research Paper (PDF)
                   |
                   v
            PDF Extraction
                   |
                   v
              Text Chunking
                   |
                   v
          Embedding Generation
                   |
                   v
           Qdrant Vector Store
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
              Groq API
                   |
                   v
         Answer + Source Excerpts
```

1. **Extract:** Text is extracted from the uploaded PDF.
2. **Chunk:** The extracted text is divided into smaller passages.
3. **Embed:** Sentence Transformers converts passages into vector embeddings.
4. **Index:** Embeddings and associated metadata are stored in Qdrant.
5. **Retrieve:** A user's question is embedded and used to find relevant passages.
6. **Generate:** The retrieved context is sent to Groq for answer generation.
7. **Present:** PaperPilot displays the answer and available source information.

## Getting Started

### Prerequisites

Install the following before running PaperPilot:

- [Node.js](https://nodejs.org/) and npm
- [Python](https://www.python.org/) compatible with the project's dependencies
- [Docker](https://www.docker.com/)
- A [Groq API key](https://console.groq.com/)

### 1. Clone the repository

```bash
git clone <repository-url>
cd paperpilot
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Set up the Python service

```bash
cd ai-service
python -m venv .venv
```

Activate the virtual environment.

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

### 4. Configure Groq

Set the API key expected by your backend.

**macOS / Linux**

```bash
export GROQ_API_KEY="your_groq_api_key"
```

**Windows PowerShell**

```powershell
$env:GROQ_API_KEY="your_groq_api_key"
```

Never commit your actual API key to GitHub.

### 5. Start Qdrant

Start a local Qdrant instance using Docker:

```bash
docker run -d \
  --name paperpilot-qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  qdrant/qdrant
```

If a Qdrant container is already running, reuse it rather than starting another container on the same ports.

Qdrant dashboard: [http://localhost:6333/dashboard](http://localhost:6333/dashboard)

### 6. Start the AI backend

From the `ai-service` directory, with the virtual environment activated and the API key configured:

```bash
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`.

Interactive API documentation is available at `http://localhost:8000/docs`.

### 7. Launch the desktop application

Open another terminal, navigate to the project root, and run:

```bash
npm run dev
```

This uses the development command configured in `package.json` to start the frontend and launch Electron.

> **Note:** The setup commands assume the project uses the directory names and configuration shown above. Check your current `package.json` and `requirements.txt` if your setup differs.

## Using PaperPilot

1. Launch the desktop application.
2. Open the research library.
3. Upload a research paper in PDF format.
4. Wait for text extraction, embedding generation, and indexing to finish.
5. Open the paper in the reading workspace.
6. Ask questions about the paper.
7. Review the answer and its retrieved source excerpts to understand the supporting evidence.

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

The exact structure may evolve as development continues.

## Download

Download the latest packaged application from [GitHub Releases](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY/releases/latest).

For macOS, download the `.dmg` asset attached to the release and follow the included installation instructions.

**Runtime requirements:** The current architecture uses a separate Python AI service and Qdrant instance. Unless these services are bundled or hosted separately, they must be configured and running for AI functionality to work.

## Limitations

- Answer quality depends on PDF extraction, chunking, retrieval relevance, and the selected Groq model.
- Scanned PDFs may require OCR if they do not contain extractable text.
- Page citations are available only when page metadata is preserved during extraction and indexing.
- The application requires access to the configured AI inference service.

## Future Improvements

- Improved PDF citation navigation and source highlighting.
- More advanced research-paper search and comparison.
- Automated paper summaries and structured insights.
- More robust indexing and paper-library management.
- Simplified installation and deployment of backend dependencies.

---

**PaperPilot — Read less. Understand more.**