import axios from "axios";
import { API_BASE_URL, addOrganizationInterceptor } from "./api";

// Create a new axios instance for purchase service
const purchaseApi = axios.create({
    baseURL: API_BASE_URL,
});

// Add the organization interceptor
addOrganizationInterceptor(purchaseApi);

export const getPurchases = async () => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await purchaseApi.get(`${API_BASE_URL}/${orgId}/purchase`);
        return response.data;
    } catch (error) {
        console.error("Error fetching purchases:", error);
        throw error;
    }
};

export const createPurchase = async (data) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await purchaseApi.post(`${API_BASE_URL}/${orgId}/purchase`, data);
        return response;
    } catch (error) {
        console.error("Error creating purchase:", error);
        throw error;
    }
};

export const updatePurchase = async (data, id) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await purchaseApi.put(`${API_BASE_URL}/${orgId}/purchase/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating purchase:", error);
        throw error;
    }
};