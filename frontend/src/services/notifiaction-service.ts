import { apiClient } from "@/api/client.ts";

export type NotificationTypeEnum = | 'DOCTOR_PENDING_ASSESSMENT' | 'DOCTOR_NEW_REVIEW' | 'PATIENT_DOCTOR_NOTES' | 'RETAKE_QUIZ';

export interface NotificationI {
    pk: string;
    sk: string;
    cognito_sub: string;
    notificationId: string;
    notificationType: NotificationTypeEnum;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: number;
    metadata?: Record<string, any>;
}

export const notificationService = {
    /** GET /api/notifications */
    async getAll(): Promise<NotificationI[]> {
        const response = await apiClient.get<NotificationI[]>("/notifications");
        return response.data;
    },

    /** PATCH /api/notifications/{sk}/read */
    async markAsRead(sk: string): Promise<void> {
        const encodedSk = encodeURIComponent(sk);
        await apiClient.patch(`/notifications/${encodedSk}/read`);
    },

    /** PATCH /api/notifications/read-all */
    async markAllAsRead(): Promise<void> {
        await apiClient.patch("/notifications/read-all");
    }
};