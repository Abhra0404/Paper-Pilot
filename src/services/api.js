import axios from "axios";

const API_URL = "http://127.0.0.1:8000";
const REQUEST_RETRIES = 60;

async function postToApi(path, payload) {
  let lastError;
  for (let attempt = 0; attempt < REQUEST_RETRIES; attempt += 1) {
    try {
      return await axios.post(`${API_URL}${path}`, payload);
    } catch (error) {
      lastError = error;
      if (!error.request || attempt === REQUEST_RETRIES - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}

async function getFromApi(path) {
  let lastError;
  for (let attempt = 0; attempt < REQUEST_RETRIES; attempt += 1) {
    try {
      return await axios.get(`${API_URL}${path}`);
    } catch (error) {
      lastError = error;
      if (
        !error.request ||
        error.response ||
        attempt === REQUEST_RETRIES - 1
      ) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw lastError;
}

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
    const response = await postToApi("/index", {
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

export async function isPaperIndexed(paperId) {
  try {
    const response = await getFromApi(
      `/index-status/${encodeURIComponent(paperId)}`
    );
    return response.data.indexed === true;
  } catch (error) {
    throw new Error(getApiError(error, "Unable to check the paper index."), {
      cause: error,
    });
  }
}

export async function queryPaper(paperId, question) {
  try {
    const response = await postToApi("/query", {
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