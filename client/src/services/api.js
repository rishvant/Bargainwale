import axios from 'axios';

export const API_BASE_URL = "https://api.bargainwale.com/api";
export const API_BASE_URL2 = "http://localhost:3000/api";

// Create and export the interceptor function
export const addOrganizationInterceptor = (axiosInstance) => {
    axiosInstance.interceptors.request.use(
        (config) => {
            // Get the latest organizationId from localStorage for each request
            const orgId = localStorage.getItem('clerk_active_org');

            if (orgId) {
                config.headers = {
                    ...config.headers,
                    'Organization-Id': orgId,
                };
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );
    return axiosInstance;
};

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
});

addOrganizationInterceptor(api);

export default api;