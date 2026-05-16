export interface UserI {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    groups: string[];
    isAdmin: boolean;
    accessToken: string;
    auth_time: number;
    picture?: string;
}