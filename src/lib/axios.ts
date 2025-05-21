import axios from "axios";

export const ApiUrl = "https://api.executivosdigital.com.br";
export const localHost = "http://10.0.0.143:3333";
export let ngrok =
  "https://3a3b-2804-f08-99f-9100-69f2-10f3-672a-dfb7.ngrok-free.app/";
if (ngrok.endsWith("/")) {
  ngrok = ngrok.slice(0, -1);
}
export const baseURL = ApiUrl;

export const api = axios.create({
  baseURL,
});

export const PostAPI = async (url: string, data: unknown) => {
  const connect = await api
    .post(url, data)
    .then(({ data }) => {
      return {
        status: 200,
        body: data,
      };
    })
    .catch((err) => {
      const message = err.response.data;
      const status = err.response.status;
      return { status, body: message };
    });

  return connect.status === 500
    ? { status: connect.status, body: "Ops! algo deu errado, tente novamente" }
    : connect.status === 413
      ? {
          status: connect.status,
          body: "Ops! algo deu errado, tente novamente ou escolha outra imagem",
        }
      : connect;
};
