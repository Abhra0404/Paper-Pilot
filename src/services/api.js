import axios from "axios";

const API_URL = "http://localhost:8000";

export async function indexPaper(chunks) {
  const response = await axios.post(
    `${API_URL}/index`,
    {
      chunks,
    }
  );

  return response.data;
}

export async function queryPaper(question) {
  const response = await axios.post(
    `${API_URL}/query`,
    {
      question,
    }
  );

  return response.data;
}