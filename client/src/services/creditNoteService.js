import axios from "axios";
import { API_BASE_URL } from "./api";

const orgId = localStorage.getItem("organizationId");

export const getCN = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/creditNote/${orgId}`);
        return response;
    } catch (error) {
        console.log(error);
    }
};

export const createCN = async (data) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/createCreditnote`, data);
        return response;
    } catch (error) {
        console.log(error);
    }
};

export const updateSales = async (data, id) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/sale/${id}`, data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
};

export const updateCNStatus = async (creditNoteId) => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/creditNote/${creditNoteId}/settle`);
        return response;
    } catch (error) {
        console.log(error);
        throw error;
    }
};