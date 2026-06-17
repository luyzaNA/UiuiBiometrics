import type {ProfileI} from "@/models/profile-model.ts";

export interface DoctorProfileI extends ProfileI {
    bio?: string;
    isDoctor: boolean;
    averageRating: number;
    totalReviews: number;
}
