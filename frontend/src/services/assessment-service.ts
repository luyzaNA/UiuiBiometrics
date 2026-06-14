import { apiClient } from "@/api/client";
import type {AssessmentI} from "@/models/assesment-model.ts";

export interface CreateAssessmentRequest {
    target_person: string;
    age: number;
    gender: string;
    symptoms: Record<string, number>;
    images?: string[];
    fullName: string;
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
     * GET /api/assessments/{cognitoSub}/{assessmentId}
     */
    async getById(cognitoSub: string, assessmentId: string): Promise<any> {
        const response = await apiClient.get<any>(`/assessments/${cognitoSub}/${assessmentId}`);
        return response.data;
    },

    /**
     * GET /api/assessments
     */
    async getAll(): Promise<{ data: AssessmentI[] }> {
        const response = await apiClient.get<{ data: AssessmentI[] }>("/assessments");
        return response.data;
    },
    /**
     * PUT /api/assessments/{id}/send-to-doctor
     */
    async sendToDoctor(assessmentId: string, doctorId: string = "UNASSIGNED"): Promise<any> {
        const response = await apiClient.put<any>(`/assessments/${assessmentId}/send-to-doctor`, {
            doctor_id: doctorId
        });
        return response.data;
    },
    /**
     * GET /api/assessments/doctor-reviews?target_person={targetPerson}
     */
    async getDoctorReviews(targetPerson?: string): Promise<{ data: AssessmentI[] }> {
        const params = targetPerson ? { target_person: targetPerson } : {};
        const response = await apiClient.get<{ data: AssessmentI[] }>("/assessments/doctor-reviews", {
            params
        });
        return response.data;
    },
    /**
     * GET /api/assessments/history
     */
    async getPatientHistory(targetPerson: string, cognitoSub:string): Promise<any> {
        const response = await apiClient.get<any>("/assessments/history", {
            params: {
                target_person: targetPerson,
                cognito_sub: cognitoSub
            }
        });
        return response.data;
    },
    /**
     * PUT /api/assessments/{cognitoSub}/{assessmentId}/doctor-notes
     */
    async updateDoctorNotes(cognitoSub: string, assessmentId: string, doctorNotes: string): Promise<any> {
        const response = await apiClient.put<any>(`/assessments/${cognitoSub}/${assessmentId}/doctor-notes`, {
            doctor_notes: doctorNotes
        });
        return response.data;
    }
};