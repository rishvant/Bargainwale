import axios from "axios";
import { API_BASE_URL, addOrganizationInterceptor } from "./api";

// Create a new axios instance for booking service
const bookingApi = axios.create({
    baseURL: API_BASE_URL,
});

// Add the organization interceptor
addOrganizationInterceptor(bookingApi);

export const getBookings = async () => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await bookingApi.get(`${API_BASE_URL}/${orgId}/booking`);
        return response.data;
    } catch (error) {
        console.error("Error fetching bookings:", error);
        throw error;
    }
};

export const createBooking = async (data) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await bookingApi.post(`${API_BASE_URL}/${orgId}/booking`, data);
        return response;
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
};

export const deleteBooking = async (id) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await bookingApi.delete(`${API_BASE_URL}/${orgId}/booking/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting booking:", error);
        throw error;
    }
};

export const updateDiscount = async (id, data) => {
    try {
        const orgId = localStorage.getItem('clerk_active_org');
        const response = await bookingApi.put(`${API_BASE_URL}/${orgId}/booking/updateDiscount/${id}`, data);
        return response;
    } catch (error) {
        console.error("Error updating discount:", error);
        throw error;
    }
};