import axios from "axios";
import configs from "configs";

// const https = require('https');
//
// const agent = new https.Agent({
//     rejectUnauthorized: false,
// });

// Khoi tao axios instance
const instance = axios.create({
  baseURL: configs.WS_BASE_URL,
  timeout: 10 * 1000, //3s
  headers: {
    "content-type": "application/json",
  },
});

// Khoi tao middleware, ham nay duoc goi truoc khi gui request
instance.interceptors.request.use(
  async (config) => {
    // Cac route nay` se khong can kiem tra accessToken
    if (
      config.url.indexOf("/login") >= 0 ||
      config.url.indexOf("/refreshtoken") >= 0 ||
      config.url.indexOf("/test") >= 0
    ) {
      return config;
    }
    const accessToken = localStorage.getItem("accessToken");
    config.headers.Authorization = accessToken ? accessToken : "";
    config.headers.ContentType = "application/json";
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

// Ham nay duoc goi khi kêt thuc mot request
instance.interceptors.response.use(
  async (response) => {
    // console.log("🚀 ~ file: ApiAxios.js:42 ~ response:", response.data);
    const config = response.config;

    // Cac route khong can check token
    if (
      config.url.indexOf("/login") >= 0 ||
      config.url.indexOf("/refreshtoken") >= 0 ||
      config.url.indexOf("/test") >= 0
    ) {
      return response;
    }
    const { errorCode, message } = response.data;
    if (errorCode && (errorCode === 401 || errorCode === 403)) {
      console.log(message);
      if (message === "jwt expired") {
        const refreshToken = localStorage.getItem("refreshToken");

        try {
          const { data } = await sendRefreshToken(refreshToken);
          if (data.success) {
            config.headers.Authorization = data.accessToken;
            localStorage.setItem("accessToken", data.accessToken);

            return instance(config);
          }
        } catch (error) {
          console.error(error);
          window.location.assign("/auth/login");
        }
      }
    }

    return response;
  },
  (err) => {
    return Promise.reject(err);
  }
);

export const getAll = async () => await instance.get("user/all");

export const edit = async (userID, name, email) =>
  await instance.post("/user/edit", { userID, name, email });

export const forgotPassword = async (email) =>
  await instance.post("user/forgotpassword", { email });

export const confirmReset = async (id, password) =>
  await instance.post(`user/resetpass/${id}`, { password });

export const sendRefreshToken = async (refreshToken) =>
  await instance.post("/user/refreshtoken", { refreshToken });

// Api cho phan authentication
export const confirmRegister = async (id) =>
  await instance.post(`auth/confirm/${id}`);

export const login = async (username, password) =>
  await instance.post("auth/login", { username, password });

export const logout = async (accessToken) =>
  await instance.post("auth/logout", { accessToken });

export const register = async (
  username,
  email,
  password,
  phone,
  agency,
  role
) =>
  await instance.post("auth/register", {
    username,
    email,
    password,
    phone,
    agency,
    role,
  });

// Api to get version image
export const getListEsp32Binary = async (espVersion) =>
  await instance.get(`getListEsp32Binary/${espVersion}`, {});

export const getListDevices = async (espVersion) =>
  await instance.get(`devices`, {});

export const downloadBinary = async (data) => {
  const url = configs.WS_BASE_URL + `downloadBinary`;
  const response = await axios.post(url, data, {
    responseType: "blob",
  });
  return response.data;
};
