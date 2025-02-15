import axios from "axios";
import { API_BASE_URL, addOrganizationInterceptor } from "./api";

// Create a new axios instance for sales service
const salesApi = axios.create({
    baseURL: API_BASE_URL,
});

// Add the organization interceptor
addOrganizationInterceptor(salesApi);

const orgId = localStorage.getItem('clerk_active_org');

export const getSales = async () => {
    try {
        const response = await salesApi.get(`${API_BASE_URL}/totalsales/${orgId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching sales:", error);
        throw error;
    }
};

export const createSales = async (data) => {
    try {
        const response = await salesApi.post(`${API_BASE_URL}/sale`, data);
        return response;
    } catch (error) {
        console.error("Error creating sale:", error);
        throw error;
    }
};

export const updateSales = async (data, id) => {
    try {
        const response = await salesApi.put(`${API_BASE_URL}/sale/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating sale:", error);
        throw error;
    }
};