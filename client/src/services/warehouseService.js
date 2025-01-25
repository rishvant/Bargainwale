import axios from "axios";
import { API_BASE_URL, addOrganizationInterceptor } from "./api";

// Create a new axios instance for warehouse service
const warehouseApi = axios.create({
    baseURL: API_BASE_URL,
});

// Add the organization interceptor
addOrganizationInterceptor(warehouseApi);

export const getWarehouses = async () => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await warehouseApi.get(`${API_BASE_URL}/${orgId}/warehouse`);
        return response.data;
    } catch (error) {
        console.error("Error fetching warehouses:", error);
        throw error;
    }
};

export const getWarehouseById = async (id) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await warehouseApi.get(`${API_BASE_URL}/${orgId}/warehouse/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching warehouse:", error);
        throw error;
    }
};

export const createWarehouse = async (data) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await warehouseApi.post(`${API_BASE_URL}/warehouse`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating warehouse:", error);
        throw error;
    }
};

export const fetchWarehouse = async (state, city) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
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
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await warehouseApi.put(`${API_BASE_URL}/${orgId}/warehouse/updateInventoryItem/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating inventory:", error);
        throw error;
    }
};

export const updateWarehouse = async (data, id) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await warehouseApi.put(`${API_BASE_URL}/${orgId}/warehouse/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating warehouse:", error);
        throw error;
    }
};

export const deleteWarehouse = async (id) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await warehouseApi.delete(`${API_BASE_URL}/${orgId}/warehouse/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting warehouse:", error);
        throw error;
    }
};
