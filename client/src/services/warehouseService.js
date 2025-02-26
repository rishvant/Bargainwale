import axios from "axios";
import { API_BASE_URL, addOrganizationInterceptor } from "./api";

// Create a new axios instance for warehouse service
const warehouseApi = axios.create({
    baseURL: API_BASE_URL,
});

// Add the organization interceptor
addOrganizationInterceptor(warehouseApi);

// Helper function to get the latest orgId
const getOrgId = () => localStorage.getItem('clerk_active_org');

export const getWarehouses = async () => {
    try {
        const orgId = getOrgId();
        if (!orgId) throw new Error("Organization ID not found");

        const response = await warehouseApi.get(`${API_BASE_URL}/${orgId}/warehouse`);
        return response.data;
    } catch (error) {
        console.error("Error fetching warehouses:", error);
        throw error;
    }
};

export const getWarehouseById = async (id) => {
    try {
        const orgId = getOrgId();
        if (!orgId) throw new Error("Organization ID not found");

        const response = await warehouseApi.get(`${API_BASE_URL}/${orgId}/warehouse/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching warehouse:", error);
        throw error;
    }
};

export const createWarehouse = async (data) => {
    try {
        const response = await warehouseApi.post(`${API_BASE_URL}/warehouse`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating warehouse:", error);
        throw error;
    }
};

export const fetchWarehouse = async (state, city) => {
    try {
        const orgId = getOrgId();
        if (!orgId) throw new Error("Organization ID not found");

        const response = await warehouseApi.get(`${API_BASE_URL}/${orgId}/warehouse/filter`, {
            params: { state, city }
        });
        return response.data;
    } catch (error) {
        console.error("Error filtering warehouses:", error);
        throw error;
    }
};

export const updateInventory = async (id, data) => {
    try {
        const response = await warehouseApi.put(`${API_BASE_URL}/warehouse/updateInventoryItem/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating inventory:", error);
        throw error;
    }
};

export const updateWarehouse = async (data, id) => {
    try {
        const response = await warehouseApi.put(`${API_BASE_URL}/warehouse/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating warehouse:", error);
        throw error;
    }
};

export const deleteWarehouse = async (id) => {
    try {
        const orgId = getOrgId();
        if (!orgId) throw new Error("Organization ID not found");

        const response = await warehouseApi.delete(`${API_BASE_URL}/warehouse/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting warehouse:", error);
        throw error;
    }
};
