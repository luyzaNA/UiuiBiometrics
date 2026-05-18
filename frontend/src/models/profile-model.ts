export const Gender = {
    FEMININE: "feminine",
    MASCULINE: "masculine",
} as const;

export type Gender = typeof Gender[keyof typeof Gender];

export interface ProfileI {
    profileId: string;
    cognitoSub: string;
    age: number;
    gender: Gender;
    createdAt: number;
    updatedAt: number;
    avatarUrl?: string
}
