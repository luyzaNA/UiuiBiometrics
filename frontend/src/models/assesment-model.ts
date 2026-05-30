export const AssessmentStatus = {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    RED_FLAG_TRIGGERED: "RED_FLAG_TRIGGERED"
} as const;

export type AssessmentStatusType = typeof AssessmentStatus[keyof typeof AssessmentStatus];

export interface AssessmentI {
    assessmentId: string;
    cognitoSub?: string;
    targetPerson: string;
    age: number;
    gender: string;
    symptoms: Record<string, number>;
    predictedDeficiencies: Record<string, number>;
    status: AssessmentStatusType;
    hasRedFlags: boolean;
    redFlagDetails: string[];
    createdAt: number;
    updatedAt: number;
    wellnessScore: number;
    imageUrls?: string[];
    imageKeys?: string[];
}