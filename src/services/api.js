import axios from "axios";

const API_URL = "http://localhost:8000";

function getApiError(error, fallback) {
  return (
    error.response?.data?.detail ||
    error.response?.data?.message ||
    error.message ||
    fallback
  );
}

export async function indexPaper(paperId, chunks) {
  try {
    const response = await axios.post(`${API_URL}/index`, {
      paper_id: paperId,
      chunks,
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiError(error, "Unable to index the paper."), {
      cause: error,
    });
  }
}

export async function queryPaper(paperId, question) {
  try {
    const response = await axios.post(`${API_URL}/query`, {
      paper_id: paperId,
      question,
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiError(error, "Unable to get an answer."), {
      cause: error,
    });
  }
}