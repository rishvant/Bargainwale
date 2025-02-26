import axios from "axios";
import { API_BASE_URL, addOrganizationInterceptor } from "./api";

// Create a new axios instance for purchase service
const purchaseApi = axios.create({
    baseURL: API_BASE_URL,
});

// Add the organization interceptor
addOrganizationInterceptor(purchaseApi);

// Helper function to get the latest orgId
const getOrgId = () => localStorage.getItem('clerk_active_org');

// Fetch purchases
export const getPurchases = async () => {
    try {
        const orgId = getOrgId();
        if (!orgId) throw new Error("Organization ID not found");

        const response = await purchaseApi.get(`${API_BASE_URL}/${orgId}/purchase`);
        return response.data;
    } catch (error) {
        console.error("Error fetching purchases:", error);
        throw error;
    }
};

// Create a new purchase
export const createPurchase = async (data) => {
    try {
        const response = await purchaseApi.post(`${API_BASE_URL}/purchase`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating purchase:", error);
        throw error;
    }
};

// Update a purchase
export const updatePurchase = async (data, id) => {
    try {
        const response = await purchaseApi.put(`${API_BASE_URL}/purchase/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating purchase:", error);
        throw error;
    }
};
