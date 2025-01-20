import axios from "axios";
import { API_BASE_URL, addOrganizationInterceptor } from "./api";

// Create a new axios instance for order service
const orderApi = axios.create({
    baseURL: API_BASE_URL,
});

// Add the organization interceptor
addOrganizationInterceptor(orderApi);

export const getOrders = async () => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await orderApi.get(`${API_BASE_URL}/${orgId}/order`);
        return response.data;
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

export const createOrder = async (data) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await orderApi.post(`${API_BASE_URL}/${orgId}/order`, data);
        return response;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

export const updateOrder = async (data, id) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await orderApi.put(`${API_BASE_URL}/${orgId}/order/${id}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating order:", error);
        throw error;
    }
};

export const deleteOrder = async (id) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await orderApi.delete(`${API_BASE_URL}/${orgId}/order/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting order:", error);
        throw error;
    }
};

export const updateBillTypePartWise = async (orderId, updateData) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await orderApi.put(`${API_BASE_URL}/${orgId}/order/${orderId}/bill-type`, updateData);
        return response.data;
    } catch (error) {
        console.error("Error updating bill type:", error);
        throw error;
    }
};