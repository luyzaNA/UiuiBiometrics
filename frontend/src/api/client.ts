import axios from "axios";

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    const oidcStorage = sessionStorage.getItem(`oidc.user:${import.meta.env.VITE_COGNITO_AUTHORITY}:${import.meta.env.VITE_COGNITO_CLIENT_ID}`);
    if (oidcStorage) {
        const user = JSON.parse(oidcStorage);
        config.headers.Authorization = `Bearer ${user.id_token}`;
    }
    console.log(config);
    return config;
});