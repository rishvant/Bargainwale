import axios from "axios";
import { API_BASE_URL, addOrganizationInterceptor } from "./api";

// Create a new axios instance for sales service
const salesApi = axios.create({
    baseURL: API_BASE_URL,
});

// Add the organization interceptor
addOrganizationInterceptor(salesApi);

// Helper function to get the latest orgId
const getOrgId = () => localStorage.getItem('clerk_active_org');

// Fetch sales
export const getSales = async () => {
    try {
        const orgId = getOrgId();
        if (!orgId) throw new Error("Organization ID not found");

        const response = await salesApi.get(`${API_BASE_URL}/totalsales/${orgId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching sales:", error);
        throw error;
    }
};

// Create a new sale
export const createSales = async (data) => {
    try {
        const response = await salesApi.post(`${API_BASE_URL}/sale`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating sale:", error);
        throw error;
    }
};

// Update a sale
export const updateSales = async (data, id) => {
    try {
        const response = await salesApi.put(`${API_BASE_URL}/sale/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating sale:", error);
        throw error;
    }
};
