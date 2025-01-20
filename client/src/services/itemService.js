import axios from "axios";
import { API_BASE_URL, addOrganizationInterceptor } from "./api";

// Create a new axios instance for item service
const itemApi = axios.create({
    baseURL: API_BASE_URL,
});

// Add the organization interceptor
addOrganizationInterceptor(itemApi);

export const getItems = async () => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await itemApi.get(`${API_BASE_URL}/${orgId}/items`);
        return response.data;
    } catch (error) {
        console.error("Error fetching items:", error);
        throw error;
    }
};

export const getPricesByWarehouse = async (warehouseId) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await itemApi.get(`${API_BASE_URL}/${orgId}/warehouseprices/${warehouseId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching prices:", error);
        throw error;
    }
};

export const getPricesById = async (itemId, warehouseId) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await itemApi.get(`${API_BASE_URL}/${orgId}/warehouse/${warehouseId}/itemprice/${itemId}`);
        return response;
    } catch (error) {
        console.error("Error fetching prices:", error);
        throw error;
    }
};

export const getPrices = async () => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await itemApi.get(`${API_BASE_URL}/${orgId}/prices`);
        return response.data;
    } catch (error) {
        console.error("Error fetching prices:", error);
        throw error;
    }
};

export const addPrice = async (data) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await itemApi.post(`${API_BASE_URL}/${orgId}/add`, data);
        return response.data;
    } catch (error) {
        console.error("Error adding prices:", error);
        throw error;
    }
};

export const getItemPriceHistoryById = async (warehouseId) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await itemApi.get(`${API_BASE_URL}/${orgId}/history/${warehouseId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching price history:", error);
        throw error;
    }
};

export const getItemHistoryById = async (warehouseId) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await itemApi.get(`${API_BASE_URL}/${orgId}/itemhistory/${warehouseId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching item history:", error);
        throw error;
    }
};