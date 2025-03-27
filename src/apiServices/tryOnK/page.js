import fetchData from "../api/page";

export const tryOnKlingAI = (data) =>
  fetchData("virtual-tryon-klingAI", "POST", data, {
    authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
  });

export const getKlingAIResults = (taskId, token) =>
  fetchData(
    `get-result-try-on/${taskId}`,
    "POST",
    {
      token: token,
    },
    {
      authorization: `Bearer ${sessionStorage.getItem("accessToken")}`,
    }
  );
