import type { Gender } from "@/models/profile-model.ts";
import { apiClient } from "@/api/client.ts";
import type { DoctorProfileI } from "@/models/doctor-model.ts";
import type { AssessmentI, DoctorPatientI } from "@/models/assesment-model.ts";

export interface CreateDoctorProfileRequest {
    age: number;
    gender: Gender;
    bio?: string;
    avatar?: string;
    price: number;
    fullName: string;
}

export interface UpdateDoctorProfileRequest {
    age?: number;
    gender?: Gender;
    bio?: string;
    avatar?: string;
    price?: number;
    fullName?: string;
}

export interface PatientsStatsI {
    total: number;
    lastMonth: number;
}

export interface ReviewedStatsI {
    totalReviewed: number;
    reviewedLastWeek: number;
}

export interface ReviewI {
    reviewer_sub?: string;
    reviewer_name: string;
    rating: number;
    comment?: string;
    created_at: number;
}

export interface CreateReviewRequest {
    rating: number;
    comment?: string;
}

export interface DoctorProfileWithReviews {
    profile: DoctorProfileI;
    reviews: ReviewI[];
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

    /** * GET /api/doctor/{id}
     */
    async getById(id: string): Promise<DoctorProfileWithReviews> {
        const response = await apiClient.get<DoctorProfileWithReviews>(`/doctor/${id}`);
        return response.data;
    },

    /** * POST /api/doctor/{id}/reviews
     */
    async addReview(id: string, data: CreateReviewRequest): Promise<ReviewI> {
        const response = await apiClient.post<ReviewI>(`/doctor/${id}/reviews`, data);
        return response.data;
    },

    /** GET /api/doctors/patients */
    async getDoctorPatients(): Promise<DoctorPatientI[]> {
        const response = await apiClient.get("/doctor/patients");
        return response.data;
    },

    /** GET /api/doctor/patients/count */
    async getPatientsNumber(): Promise<PatientsStatsI> {
        const response = await apiClient.get<PatientsStatsI>("/doctor/patients/count");
        return response.data;
    },

    /** GET /api/doctor/assessments/pending */
    async getPendingAssessments(): Promise<AssessmentI[]> {
        const response = await apiClient.get<AssessmentI[]>("/doctor/assessments/pending");
        return response.data;
    },

    /** GET /api/doctor/assessments/reviewed-stats */
    async getReviewedStats(): Promise<{ data: ReviewedStatsI }> {
        return await apiClient.get<ReviewedStatsI>("/doctor/assessments/reviewed-stats");
    },
};