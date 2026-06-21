import { apiClient } from "@/api/client";
import type {Gender, ProfileI} from "@/models/profile-model.ts";

export interface CreateProfileRequest {
    age: number;
    gender: Gender;
}

export interface UpdateProfileRequest {
    age: number;
    gender: Gender;
}

export const profileService = {
    /**
     * GET /api/profile/me
     */
    async getMe(): Promise<ProfileI> {
        const response = await apiClient.get<ProfileI>("/profile/me");
        return response.data;
    },

    /**
     * GET /api/profile/{cognitoSub}
     */
    async getById(cognitoSub: string): Promise<ProfileI> {
        const response = await apiClient.get<ProfileI>(`/profile/${cognitoSub}`);
        return response.data;
    },
    /**
     * POST /api/profile
     */
    async create(data: CreateProfileRequest): Promise<ProfileI> {
        const response = await apiClient.post<ProfileI>("/profile", data);
        return response.data;
    },

    /**
     * PATCH /api/profile/{id}
     */
    async update(
        profileId: string,
        data: UpdateProfileRequest
    ): Promise<ProfileI> {
        const response = await apiClient.patch<ProfileI>(
            `/profile/${profileId}`,
            data
        );
        return response.data;
    },
};