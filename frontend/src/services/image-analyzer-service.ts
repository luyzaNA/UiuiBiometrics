import { apiClient } from "@/api/client";

export interface VisionAnalyzeRequest {
    image: string;
}

export const visionService = {
    /**
     * POST /api/analyze
     */
    async analyzeImage(data: VisionAnalyzeRequest): Promise<any> {
        const response = await apiClient.post<any>("/analyze", data);
        return response.data;
    }
};