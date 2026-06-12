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
    avatarUrl?: string;
    bio: string;
    price: number;
    doctorId: string;
}

export interface DoctorPatientI {
    cognitoSub: string;
    targetPerson: string;
    age: number;
    gender: string;
    lastAssessmentAt: number;
    latestStatus: AssessmentStatusType;
    latestAssessmentId: string;
    email?: string;
    avatarUrl?: string;
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

    doctorDetails?: DoctorDetailsI | null;
    doctorNotes?: string;
}