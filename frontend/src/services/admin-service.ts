import { apiClient } from "@/api/client.ts";

export interface AdminUserI {
    id: string;
    email: string;
    status: string;
    enabled: boolean;
    createdAt: string;
    provider: string;
    roles: string[];
}

export interface UpdateUserRoleRequest {
    group_name: "admin" | "doctor";
    action: "add" | "remove";
}

export interface AdminUsersResponse {
    users: AdminUserI[];
    pagination_token?: string;
}

export interface AdminUserStatsResponse {
    totalUsers: number;
    doctorUsers: number;
}

export const adminService = {
    /** GET /api/admin/users */
    async getUsers(): Promise<AdminUsersResponse> {
        const response = await apiClient.get<AdminUsersResponse>("/admin/users");
        return response.data;
    },

    /** GET /api/admin/users/stats */
    async getUserStats(): Promise<AdminUserStatsResponse> {
        const response = await apiClient.get<AdminUserStatsResponse>("/admin/users/stats");
        return response.data;
    },

    /** POST /api/admin/users/{username}/roles */
    async updateUserRole(username: string, data: UpdateUserRoleRequest): Promise<void> {
        await apiClient.post(`/admin/users/${username}/roles`, data);
    }
};