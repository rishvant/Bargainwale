import axios from "axios";
import { API_BASE_URL } from "./api";

const orgId = localStorage.getItem("organizationId");

export const getPurchases = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${orgId}/purchase`);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const createPurchase = async (data) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/purchase`, data);
        return response;
    } catch (error) {
        throw error;
    }
};

export const updatePurchase = async (data, id) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/purchase/${id}`, data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};