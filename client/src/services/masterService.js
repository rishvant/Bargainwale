import axios from "axios";
import { API_BASE_URL, addOrganizationInterceptor } from "./api";

// Create a new axios instance for master service
const masterApi = axios.create({
    baseURL: API_BASE_URL,
});

// Add the organization interceptor
addOrganizationInterceptor(masterApi);

// items
export const getItems = async () => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await masterApi.get(`${API_BASE_URL}/${orgId}/items`);
        return response.data;
    } catch (error) {
        console.error("Error fetching items:", error);
        throw error;
    }
};

export const createItem = async (data) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await masterApi.post(`${API_BASE_URL}/${orgId}/items`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating item:", error);
        throw error;
    }
};

export const updateItem = async (data, id) => {
    try {
        const response = await masterApi.put(`${API_BASE_URL}/items/${id}`, data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const deleteItem = async (id) => {
    try {
        const response = await masterApi.delete(`${API_BASE_URL}/items/${id}`);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

// transport
export const getTransport = async () => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await masterApi.get(`${API_BASE_URL}/${orgId}/transports`);
        return response.data;
    } catch (error) {
        console.error("Error fetching transports:", error);
        throw error;
    }
};

export const createTransport = async (data) => {
    try {
        const response = await masterApi.post(`${API_BASE_URL}/transports`, data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const updateTransport = async (data, id) => {
    try {
        const response = await masterApi.put(`${API_BASE_URL}/transports/${id}`, data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const deleteTransport = async (id) => {
    try {
        const response = await masterApi.delete(`${API_BASE_URL}/transports/${id}`);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

// buyer
export const getBuyer = async () => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await masterApi.get(`${API_BASE_URL}/${orgId}/buyers`);
        return response.data;
    } catch (error) {
        console.error("Error fetching buyers:", error);
        throw error;
    }
};

export const createBuyer = async (data) => {
    try {
        const response = await masterApi.post(`${API_BASE_URL}/buyers`, data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const updateBuyer = async (data, id) => {
    try {
        const response = await masterApi.put(`${API_BASE_URL}/buyers/${id}`, data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const deleteBuyer = async (id) => {
    try {
        const response = await masterApi.delete(`${API_BASE_URL}/buyers/${id}`);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

// manufacturer
export const getManufacturer = async () => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await masterApi.get(`${API_BASE_URL}/${orgId}/manufacturers`);
        return response.data;
    } catch (error) {
        console.error("Error fetching manufacturers:", error);
        throw error;
    }
};

export const createManufacturer = async (data) => {
    try {
        const response = await masterApi.post(`${API_BASE_URL}/manufacturers`, data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const updateManufacturer = async (data, id) => {
    try {
        const response = await masterApi.put(`${API_BASE_URL}/manufacturers/${id}`, data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const deleteManufacturer = async (id) => {
    try {
        const response = await masterApi.delete(`${API_BASE_URL}/manufacturers/${id}`);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};