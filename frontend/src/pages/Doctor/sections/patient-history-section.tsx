import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Calendar,
    Activity,
    AlertTriangle,
    Stethoscope,
    Pill,
    Clock,
    CheckCircle,
    UserCircle,
    Loader2,
    X
} from "lucide-react";
import { assessmentService } from "@/services/assessment-service.ts";
import type { AssessmentI } from "@/models/assesment-model.ts";
import { formatDateMs } from "@/utils/form-data.ts";
import { SYMPTOM_MAPPER } from "@/utils/symptoms_wrap.ts";

const getStatusConfig = (status: string) => {
    const normalizedStatus = status?.toUpperCase()?.trim();
    switch (normalizedStatus) {
        case "COMPLETED":
            return {color: "bg-success/10 text-success border-success/20", icon: CheckCircle, label: "Complete"};
        case "RED_FLAG_TRIGGERED":
            return {
                color: "bg-destructive/10 text-destructive border-destructive/20",
                icon: AlertTriangle,
                label: "Red Flag"
            };
        case "PENDING_DOCTOR":
            return {color: "bg-info/10 text-info border-info/20", icon: Clock, label: "Pending Doctor"};
        case "DOCTOR_REVIEWED":
            return {color: "bg-primary/10 text-primary border-primary/20", icon: Stethoscope, label: "Doctor Reviewed"};
        default:
            return {
                color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                icon: CheckCircle,
                label: "No Action Needed"
            };
    }
};

interface PatientHistorySectionProps {
    targetPerson: string;
    cognitoSub: string;
    excludeAssessmentId?: string;
}

export function PatientHistorySection({ targetPerson, cognitoSub, excludeAssessmentId }: PatientHistorySectionProps) {
    const { t } = useTranslation();
    const [assessments, setAssessments] = useState<AssessmentI[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!targetPerson || !cognitoSub) return;

            try {
                setIsLoading(true);
                const response = await assessmentService.getPatientHistory(targetPerson, cognitoSub);
                const data = response.data || response;

                let sortedData = Array.isArray(data)
                    ? [...data].sort((a, b) => b.updatedAt - a.updatedAt)
                    : [];

                if (excludeAssessmentId) {
                    sortedData = sortedData.filter(a => a.assessmentId !== excludeAssessmentId);
                }

                setAssessments(sortedData);
            } catch (error) {
                console.error("Eroare la aducerea istoricului:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [targetPerson, cognitoSub, excludeAssessmentId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-secondary/40">
                <Loader2 className="animate-spin mb-4 text-primary" size={32} />
                <p className="text-sm font-bold uppercase tracking-widest">{t("Loading history...")}</p>
            </div>
        );
    }

    if (assessments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-secondary/[0.02] border border-dashed border-secondary/10 rounded-2xl">
                <Activity size={32} className="text-secondary/20 mb-4" />
                <p className="text-sm font-medium text-secondary/80">
                    {t("No medical assessments found for this patient.")}
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                {assessments.map((assessment) => {
                    const StatusIcon = getStatusConfig(assessment.status).icon;
                    const statusColor = getStatusConfig(assessment.status).color;
                    const statusLabel = getStatusConfig(assessment.status).label;

                    return (
                        <div key={assessment.assessmentId} className="bg-secondary/[0.02] border border-secondary/10 rounded-2xl p-5 md:p-6 shadow-sm overflow-hidden relative">

                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none" />

                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-secondary/10 pb-4 mb-4 relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar size={16} className="text-primary" />
                                        <span className="font-semibold text-secondary">
                                            {formatDateMs(assessment.createdAt)}
                                        </span>
                                        <span className="text-xs text-secondary/40">
                                            ({assessment.age} {t("years")}, {assessment.gender === "feminine" ? t("woman") : t("man")})
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide ${statusColor}`}>
                                        <StatusIcon size={14} />
                                        {t(statusLabel)}
                                    </div>
                                    {assessment.wellnessScore > 0 && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] uppercase font-bold text-secondary/40">{t("Wellness score")}</span>
                                            <span className="text-xl font-bold text-primary">{assessment.wellnessScore.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-secondary flex items-center gap-2">
                                        <Activity size={16} className="text-primary/70" />
                                        {t("Reported Symptoms")}
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.entries(assessment.symptoms)
                                            .sort((a, b) => Number(b[1]) - Number(a[1]))
                                            .map(([symptom, value]) => {
                                                const correctSymptomKey = SYMPTOM_MAPPER[symptom] || symptom;

                                                return (
                                                    <div key={symptom} className="flex flex-col gap-1">
                                                        <div className="flex justify-between text-xs text-secondary/70">
                                                            <span>{t(correctSymptomKey)}</span>
                                                            <span>{(value * 10).toFixed(0)}/10</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-secondary/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary/70 rounded-full"
                                                                style={{ width: `${value * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }

                                        {Object.keys(assessment.symptoms).length === 0 && (
                                            <p className="text-xs text-secondary/40 italic">{t("No symptoms recorded.")}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-secondary flex items-center gap-2">
                                        <Pill size={16} className="text-primary/70" />
                                        {t("Predicted Deficiencies")}
                                    </h4>
                                    <div className="space-y-2">
                                        {(() => {
                                            const filteredDeficiencies = Object.entries(assessment.predictedDeficiencies || {})
                                                .filter(([, val]) => val > 0.3)
                                                .sort(([, a], [, b]) => b - a);

                                            if (filteredDeficiencies.length > 0) {
                                                return filteredDeficiencies.map(([def, val]) => (
                                                    <div key={def} className="flex flex-col gap-1">
                                                        <div className="flex justify-between text-xs text-secondary/70">
                                                            <span className="capitalize">{t(def)}</span>
                                                            <span>{(val * 100).toFixed(1)}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-secondary/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-warning/70 rounded-full"
                                                                style={{ width: `${val * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ));
                                            }

                                            if (assessment.hasRedFlags) {
                                                return (
                                                    <p className="text-xs text-destructive/50 italic p-2">
                                                        {t("*Calculation stopped due to a priority medical alert.")}
                                                    </p>
                                                );
                                            }

                                            return (
                                                <p className="text-xs text-secondary/50 italic p-2 bg-secondary/5 rounded-lg border border-secondary/5">
                                                    {t("No likely deficiencies detected (over 30%).")}
                                                </p>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            {assessment.hasRedFlags && assessment.redFlagDetails && assessment.redFlagDetails.length > 0 && (
                                <div className="mt-6 bg-destructive/5 border border-destructive/10 rounded-xl p-4">
                                    <h4 className="text-sm font-bold text-destructive flex items-center gap-2 mb-2">
                                        <AlertTriangle size={16} /> {t("Warnings")}
                                    </h4>
                                    <ul className="list-disc list-inside text-xs text-destructive/80 space-y-1">
                                        {assessment.redFlagDetails.map((flag, idx) => (
                                            <li key={idx}>{t(flag)}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {assessment.doctorDetails && (
                                <div className="mt-6 bg-primary/5 border border-primary/10 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        {assessment.doctorDetails.avatarUrl ? (
                                            <img src={assessment.doctorDetails.avatarUrl} alt="Doctor" className="w-8 h-8 rounded-full object-cover border border-primary/30" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                <UserCircle size={16} />
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-sm font-bold text-primary">
                                                {assessment.doctorDetails.fullName}
                                            </h4>
                                            <p className="text-[10px] text-primary/70 uppercase font-bold tracking-wider">{t("Medical Notes")}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-secondary/80 bg-primary/10 p-3 rounded-lg">
                                        {assessment.doctorNotes || t("The doctor did not leave any additional notes.")}
                                    </p>
                                </div>
                            )}

                            {assessment.imageUrls && assessment.imageUrls.length > 0 && (
                                <div className="mt-6 border-t border-secondary/10 pt-4">
                                    <h4 className="text-xs font-bold text-secondary/60 mb-3 uppercase tracking-widest">
                                        {t("Attached Images")} ({assessment.imageUrls.length})
                                    </h4>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {assessment.imageUrls.map((url, idx) => (
                                            <img
                                                key={idx}
                                                src={url}
                                                alt={`${t("Attachment")} ${idx + 1}`}
                                                className="h-20 w-20 object-cover rounded-lg border border-secondary/10 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => setSelectedImage(url)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>

            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-secondary-foreground/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-5xl max-h-[90vh] w-full flex justify-center">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-12 right-0 p-2 text-secondary/70 hover:text-secondary transition-colors bg-secondary-foreground/20 rounded-full hover:bg-secondary-foreground/40"
                        >
                            <X size={28} />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Enlarged view"
                            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </>
    );
}