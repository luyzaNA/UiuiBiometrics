import { apiClient } from "@/api/client";

export interface CreateAssessmentRequest {
    target_person: string;
    age: number;
    gender: string;
    symptoms: Record<string, number>;
}

export const assessmentService = {
    /**
     * POST /api/assessments
     */
    async create(data: CreateAssessmentRequest): Promise<any> {
        const response = await apiClient.post<any>("/assessments", data);
        return response.data;
    },

    /**
     * GET /api/assessments/{id}
     */
    async getById(assessmentId: string): Promise<any> {
        const response = await apiClient.get<any>(`/assessments/${assessmentId}`);
        return response.data;
    }
};