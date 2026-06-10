export const AssessmentStatus = {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    RED_FLAG_TRIGGERED: "RED_FLAG_TRIGGERED",
    PENDING_DOCTOR: "PENDING_DOCTOR",
    DOCTOR_REVIEWED: "DOCTOR_REVIEWED"
} as const;

export type AssessmentStatusType = typeof AssessmentStatus[keyof typeof AssessmentStatus];

export interface DoctorDetailsI {
    name: string;
    avatarUrl: string;
    bio: string;
    price: number;
}

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

    doctorId?: string;
    doctorDetails?: DoctorDetailsI | null;
    doctorNotes?: string;
}