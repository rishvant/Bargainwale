import axios from "axios";
import { API_BASE_URL, addOrganizationInterceptor } from "./api";

// Create a new axios instance for credit note service
const creditNoteApi = axios.create({
    baseURL: API_BASE_URL,
});

// Add the organization interceptor
addOrganizationInterceptor(creditNoteApi);

// Helper function to get the latest orgId
const getOrgId = () => localStorage.getItem('clerk_active_org');

export const getCN = async () => {
    try {
        const orgId = getOrgId();
        if (!orgId) throw new Error("Organization ID not found");

        const response = await creditNoteApi.get(`${API_BASE_URL}/creditNote/${orgId}`);
        return response;
    } catch (error) {
        console.error("Error fetching credit notes:", error);
        throw error;
    }
};

export const createCN = async (data) => {
    try {
        const response = await creditNoteApi.post(`${API_BASE_URL}/createCreditnote`, data);
        return response;
    } catch (error) {
        console.error("Error creating credit note:", error);
        throw error;
    }
};

export const updateSales = async (data, id) => {
    try {
        const response = await creditNoteApi.put(`${API_BASE_URL}/sale/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating sales:", error);
        throw error;
    }
};

export const updateCNStatus = async (creditNoteId) => {
    try {
        const response = await creditNoteApi.patch(`${API_BASE_URL}/creditNote/${creditNoteId}/settle`);
        return response;
    } catch (error) {
        console.error("Error updating credit note status:", error);
        throw error;
    }
};
