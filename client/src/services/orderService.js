import axios from "axios";
import { API_BASE_URL, addOrganizationInterceptor } from "./api";

// Create a new axios instance for order service
const orderApi = axios.create({
    baseURL: API_BASE_URL,
});

// Add the organization interceptor
addOrganizationInterceptor(orderApi);

// Helper function to get the latest orgId
const getOrgId = () => localStorage.getItem('clerk_active_org');

// Fetch orders
export const getOrders = async () => {
    try {
        const orgId = getOrgId();
        if (!orgId) throw new Error("Organization ID not found");

        const response = await orderApi.get(`${API_BASE_URL}/${orgId}/order`);
        return response.data;
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

// Create a new order
export const createOrder = async (data) => {
    try {
        const response = await orderApi.post(`${API_BASE_URL}/order`, data);
        return response;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

// Update an order
export const updateOrder = async (data, id) => {
    try {
        const response = await orderApi.put(`${API_BASE_URL}/order/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating order:", error);
        throw error;
    }
};

// Delete an order
export const deleteOrder = async (id) => {
    try {
        const response = await orderApi.delete(`${API_BASE_URL}/order/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting order:", error);
        throw error;
    }
};

// Update bill type for a specific order
export const updateBillTypePartWise = async (orderId, updateData) => {
    try {
        const orgId = getOrgId();
        if (!orgId) throw new Error("Organization ID not found");

        const response = await orderApi.put(`${API_BASE_URL}/${orgId}/order/${orderId}/bill-type`, updateData);
        return response.data;
    } catch (error) {
        console.error("Error updating bill type:", error);
        throw error;
    }
};
