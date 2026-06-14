import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, CheckCircle, UserRound, ChevronRight, Stethoscope } from "lucide-react";
import type { AssessmentI } from "@/models/assesment-model";
import { assessmentService } from "@/services/assessment-service.ts";
import { formatChartFullDate } from "@/utils/form-data.ts";

interface DoctorAssessmentsListProps {
    targetPerson?: string;
    onSelectAssessment?: (assessment: AssessmentI) => void;
}

export function DoctorAssessmentsList({ targetPerson = "Principal", onSelectAssessment }: DoctorAssessmentsListProps) {
    const { t } = useTranslation();
    const [assessments, setAssessments] = useState<AssessmentI[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setIsLoading(true);
                const response = await assessmentService.getDoctorReviews(targetPerson);
                const dataArray = Array.isArray(response) ? response : (response?.data || []);

                const sortedArray = [...dataArray].sort((a, b) => b.createdAt - a.createdAt);

                setAssessments(sortedArray);
            } catch (error) {
                console.error("Failed to fetch doctor reviews:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviews();
    }, [targetPerson]);

    if (isLoading) {
        return (
            <div className="space-y-3 p-2 animate-pulse">
                <div className="h-3 w-32 bg-secondary/10 rounded" />
                {[1, 2].map((n) => (
                    <div key={n} className="h-16 w-full bg-secondary/[0.02] border border-secondary/5 rounded-xl" />
                ))}
            </div>
        );
    }

    if (assessments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-secondary/[0.01] border border-dashed border-secondary/10 rounded-2xl my-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary mb-3">
                    <Stethoscope size={22} className="opacity-80" />
                </div>
                <p className="text-sm font-medium text-secondary/80">
                    {t("No pending medical reports found")}
                </p>
                <p className="text-xs text-secondary/40 max-w-xs mt-1 leading-relaxed">
                    {t("You don't have any reports waiting for a doctor's review right now.")}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 p-1">
            <div className="flex items-center justify-between px-1">
                <h4 className="text-xs text-secondary/40 flex items-center gap-2">
                    {t("In the event that major health risks are detected upon completing the deficiencies questionnaire, you have the option to forward your report to a physician for verification. This page tracks the status of all medical assessments submitted for review.")}
                </h4>
                <span className="text-[10px] font-mono text-center text-secondary/30 bg-secondary/5 px-4 py-0.5 rounded-md">
                    {assessments.length} {assessments.length === 1 ? t("report") : t("reports") }
                </span>
            </div>

            <div className="flex flex-col gap-2">
                {assessments.map((item) => {
                    const isReviewed = item.status === "DOCTOR_REVIEWED";
                    const isAssigned = !!item.doctorDetails;

                    return (
                        <button
                            key={item.assessmentId}
                            onClick={() => onSelectAssessment?.(item)}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/[0.02] border border-secondary/5 hover:border-primary/40 hover:bg-secondary/[0.04] transition-all duration-300 text-left group w-full relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-11 h-11 rounded-xl bg-secondary/5 border border-secondary/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-primary/30 transition-colors">
                                    {isAssigned && item.doctorDetails?.avatarUrl ? (
                                        <img
                                            src={item.doctorDetails.avatarUrl}
                                            alt={item.doctorDetails.fullName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <UserRound size={18} className="text-secondary/40 group-hover:text-primary transition-colors" />
                                    )}
                                </div>

                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-secondary tracking-wide group-hover:text-primary-foreground transition-colors">
                                        {item.doctorDetails?.fullName || t("Assigned Doctor")}
                                    </span>

                                    <div className="flex items-center gap-2 mt-1.5">
                                        {isReviewed ? (
                                            <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                                <CheckCircle size={10} />
                                                {t("Reviewed")}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                                                <Clock size={10} />
                                                {t("In Review")}
                                            </span>
                                        )}
                                        <span className="text-[10px] font-mono text-secondary/40">
                                            {formatChartFullDate(item.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-1.5 rounded-lg bg-secondary/5 border border-secondary/5 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-300 relative z-10 hover:cursor-pointer">
                                <ChevronRight size={14} className="text-secondary/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}