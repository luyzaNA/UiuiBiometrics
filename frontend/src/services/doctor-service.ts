import type { Gender } from "@/models/profile-model.ts";
import {apiClient} from "@/api/client.ts";
import type {DoctorProfileI} from "@/models/doctor-model.ts";
import type {DoctorPatientI} from "@/models/assesment-model.ts";

export interface CreateDoctorProfileRequest {
    age: number;
    gender: Gender;
    bio?: string;
    avatar?: string;
    price: number;
    name: string;
}

export interface UpdateDoctorProfileRequest {
    age?: number;
    gender?: Gender;
    bio?: string;
    avatar?: string;
    price?: number;
    name?: string;
}

export const doctorService = {
    /** GET /api/doctor/profile/me */
    async getMe(): Promise<DoctorProfileI> {
        const response = await apiClient.get<DoctorProfileI>("/doctor/profile/me");
        return response.data;
    },

    /** POST /api/doctor/profile */
    async create(data: CreateDoctorProfileRequest): Promise<DoctorProfileI> {
        const response = await apiClient.post<DoctorProfileI>("/doctor/profile", data);
        return response.data;
    },

    /** PUT /api/doctor/profile/{id} */
    async update(data: UpdateDoctorProfileRequest): Promise<DoctorProfileI> {
        const response = await apiClient.put<DoctorProfileI>(`/doctor/profile`, data);
        return response.data;
    },

    /** GET /api/doctor */
    async getAll(): Promise<DoctorProfileI[]> {
        const response = await apiClient.get<DoctorProfileI[]>("/doctor");
        return response.data;
    },

    /** GET /api/doctor/{id} */
    async getById(id: string): Promise<DoctorProfileI> {
        const response = await apiClient.get<DoctorProfileI>(`/doctor/${id}`);
        return response.data;
    },
    /**
     * GET /api/doctors/patients
     */
    async getDoctorPatients(): Promise<DoctorPatientI[]> {
        const response = await apiClient.get("/doctor/patients");
        return response.data;
    }
};