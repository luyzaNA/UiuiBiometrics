import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, ChevronRight, ClipboardList, Stethoscope, AlertCircle, ArrowLeft } from "lucide-react";
import { doctorService } from "@/services/doctor-service";
import type { AssessmentI } from "@/models/assesment-model.ts";
import { formatChartFullDate } from "@/utils/form-data.ts";
import { useNavigate } from "react-router-dom";

export default function PendingAssessmentsList() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [assessments, setAssessments] = useState<AssessmentI[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                setIsLoading(true);
                const data = await doctorService.getPendingAssessments();
                const sortedData = data.sort((a, b) => a.createdAt - b.createdAt);
                setAssessments(sortedData);
            } catch (error) {
                console.error("Error fetching assessments:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssessments();
    }, []);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 relative p-4 sm:p-10 min-h-screen">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-secondary/60 hover:text-primary transition-colors mb-4 md:mt-6 w-fit hover:cursor-pointer"
            >
                <ArrowLeft size={16} />
                <span className="text-sm font-medium">{t("Back")}</span>
            </button>

            <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-secondary flex items-center gap-2">
                    <Stethoscope className="w-6 h-6 text-primary" />
                    {t("Pending reviews")}
                </h2>
                {!isLoading && assessments.length > 0 && (
                    <span className="bg-secondary/10 text-secondary font-medium px-3 py-1 rounded-full text-sm">
                        {assessments.length} {t("reports")}
                    </span>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-48 border border-secondary/10 rounded-2xl bg-background mt-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : assessments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-10 text-center border border-dashed border-secondary/20 rounded-2xl bg-background mt-6">
                    <div className="bg-primary/10 p-4 rounded-full mb-4 text-primary">
                        <ClipboardList className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">{t("No pending reports")}</h3>
                    <p className="text-sm text-secondary/70 mt-2">
                        {t("All patient assessments have been reviewed, or you do not have any patients to review.")}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-3 mt-6">
                    {assessments.map((assessment) => (
                        <div
                            key={assessment.assessmentId}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border border-secondary/15 rounded-xl hover:border-primary/40 hover:shadow-sm transition-all duration-200 cursor-pointer"
                            onClick={() => navigate(`/doctor/assessment/${assessment.cognitoSub}/${assessment.assessmentId}`)}
                        >
                            <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0">
                                    <span className="text-slate-300 font-medium text-sm">
                                        {assessment.targetPerson.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                                <div className="flex flex-col">
                                    <h3 className="font-medium text-foreground text-sm">
                                        {assessment.targetPerson}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-secondary/60 mt-0.5">
                                        <span>
                                            {assessment.age} {t("years")} • {assessment.gender}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-secondary/30"></span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatChartFullDate(assessment.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                {assessment.hasRedFlags && assessment.redFlagDetails?.length > 0 ? (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/20 text-red-400 rounded-md border border-red-900/30">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span className="text-xs font-medium max-w-[150px] truncate">
                                            {t(assessment.redFlagDetails[0])}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-md border border-slate-700 text-xs font-medium">
                                        {t("Standard Review")}
                                    </div>
                                )}
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-secondary/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}