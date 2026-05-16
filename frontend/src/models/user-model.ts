export interface UserI {
    id: string;
    email: string;
    familyName: string;
    givenName: string;
    groups: string[];
    isAdmin: boolean;
    accessToken: string;
    auth_time: number;
    picture?: string;
    nameInitial: string;
}