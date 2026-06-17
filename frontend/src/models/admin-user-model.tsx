export interface AdminUserI {
    id: string;
    email: string;
    createdAt: number | string;
    roles: string[];
}