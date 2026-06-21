import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    ArrowLeft,
    User,
    Activity,
    AlertTriangle,
    ShieldAlert,
    Clock,
    ChevronDown,
    ChevronUp,
    Send,
    ClipboardList,
    Loader2
} from "lucide-react";
import type { AssessmentI } from "@/models/assesment-model.ts";
import { formatDateMs } from "@/utils/form-data.ts";
import { assessmentService } from "@/services/assessment-service.ts";
import { SYMPTOM_MAPPER } from "@/utils/symptoms_wrap.ts";
import { PatientHistorySection } from "@/pages/Doctor/sections/patient-history-section.tsx";
import { toast } from "sonner";

import { PatientHistorySummary } from "@/pages/Doctor/sections/patient-history-summary-section.tsx";
import {profileService} from "@/services/profile-service.ts";

export default function AssessmentDetailsPage() {
    const { cognitoSub, id } = useParams<{ cognitoSub: string; id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [assessment, setAssessment] = useState<AssessmentI | null>(null);
    const [patientFullName, setPatientFullName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);
    const [notes, setNotes] = useState("");
    const [isSendingNotes, setIsSendingNotes] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id || !cognitoSub) return;
            try {
                setIsLoading(true);
                const data = await assessmentService.getById(cognitoSub, id);
                setAssessment(data);

                const patientData = await profileService.getById(cognitoSub);

                if (patientData?.fullName)
                    setPatientFullName(patientData.fullName);

                if (data.doctorNotes) {
                    setNotes(data.doctorNotes);
                }
            } catch (error) {
                console.error("Eroare la aducerea detaliilor:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetails();
    }, [id, cognitoSub]);

    const handleSendNotes = async () => {
        if (!id || !cognitoSub || !notes.trim()) return;

        try {
            setIsSendingNotes(true);
            await assessmentService.updateDoctorNotes(cognitoSub, id, notes);
            toast.success(t("Recommendations sent!"));

            navigate(-1);
        } catch (error) {
            console.error("Eroare la trimiterea notițelor:", error);
        } finally {
            setIsSendingNotes(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!assessment) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <p className="text-secondary/70 mb-4">{t("Assessment not found")}</p>
                <button onClick={() => navigate(-1)} className="text-primary hover:underline">
                    {t("Go back")}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in duration-300 min-h-screen">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-secondary/60 hover:text-primary transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("Back to list")}</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {t("Assessment Details")}
                    </h1>
                </div>
                <div className="px-4 py-2 bg-secondary/10 rounded-lg text-sm font-medium">
                    {t("Status")}: <span className="text-primary">{t(assessment.status)}</span>
                </div>
            </div>

            <div className="bg-background border border-secondary/10 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b border-secondary/10 pb-2">
                    <User className="w-5 h-5 text-primary" />
                    {t("Patient Info")}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-secondary/60 uppercase">{t("Name")}</p>
                        <p className="font-medium">
                            {assessment.targetPerson === "Principal"
                                ? (patientFullName || t("Principal"))
                                : assessment.targetPerson}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-secondary/60 uppercase">{t("Age")}</p>
                        <p className="font-medium">{assessment.age} {t("years")}</p>
                    </div>
                    <div>
                        <p className="text-xs text-secondary/60 uppercase">{t("Gender")}</p>
                        <p className="font-medium capitalize">{assessment.gender === "female" ? t("woman") : t("man")}</p>
                    </div>
                    <div>
                        <p className="text-xs text-secondary/60 uppercase">{t("Date")}</p>
                        <p className="font-medium">{formatDateMs(assessment.createdAt)}</p>
                    </div>
                </div>
            </div>

            {assessment.hasRedFlags && assessment.redFlagDetails && assessment.redFlagDetails.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-destructive flex items-center gap-2 mb-4">
                        <ShieldAlert className="w-5 h-5" />
                        {t("Red Flags Detected")}
                    </h2>
                    <ul className="list-disc list-inside space-y-1 text-destructive/80">
                        {assessment.redFlagDetails.map((flag, idx) => (
                            <li key={idx} className="text-sm font-medium">{t(flag)}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-background border border-secondary/10 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b border-secondary/10 pb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        {t("Reported Symptoms")}
                    </h2>
                    {assessment.symptoms && Object.keys(assessment.symptoms).length > 0 ? (
                        <ul className="space-y-2">
                            {Object.entries(assessment.symptoms).map(([symptom, severity]) => {
                                const correctSymptomKey = SYMPTOM_MAPPER[symptom] || symptom;
                                return (
                                    <li key={symptom} className="flex justify-between items-center text-sm">
                                        <span>{t(correctSymptomKey)}</span>
                                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">
                                            {severity * 10}/10
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="text-sm text-secondary/60">{t("No symptoms reported.")}</p>
                    )}
                </div>

                <div className="bg-background border border-secondary/10 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b border-secondary/10 pb-2">
                        <Activity className="w-5 h-5 text-blue-500" />
                        {t("Predicted Deficiencies")}
                    </h2>
                    {assessment.predictedDeficiencies && Object.keys(assessment.predictedDeficiencies).length > 0 ? (
                        <ul className="space-y-2">
                            {Object.entries(assessment.predictedDeficiencies)
                                .sort(([, valA], [, valB]) => (valB as number) - (valA as number))
                                .map(([deficiency, probability]) => (
                                    <li key={deficiency} className="flex justify-between items-center text-sm">
                                        <span className="capitalize">{t(deficiency)}</span>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">
                                            {Math.round((probability as number) * 100)}%
                                        </span>
                                    </li>
                                ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-secondary/60">{t("Calculation stopped due to a priority medical alert.")}</p>
                    )}
                </div>
            </div>

            <div className="bg-background border border-secondary/10 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 border-b border-secondary/10 pb-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    {t("Doctor's Recommendations")}
                </h2>
                <textarea
                    className="w-full rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-3 text-sm placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                    placeholder={t("Enter your recommendations for the patient...")}
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex justify-end mt-3">
                    <button
                        onClick={handleSendNotes}
                        disabled={!notes.trim() || isSendingNotes}
                        className="flex items-center gap-2 bg-primary/80 text-secondary px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
                    >
                        {isSendingNotes ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send size={16} />
                        )}
                        {isSendingNotes ? t("Sending...") : t("Send to patient")}
                    </button>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-secondary/10 text-center">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-secondary/5 hover:bg-secondary/10 border border-secondary/20 text-secondary font-medium rounded-xl transition-all hover:cursor-pointer"
                >
                    <Clock size={18} />
                    {showHistory ? t("Hide Patient History") : t("View Patient History")}
                    {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
            </div>

            {showHistory && (
                <div className="mt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                    <h3 className="text-xl font-bold text-foreground mb-4">{t("Past Assessments")}</h3>

                    <PatientHistorySummary
                        targetPerson={assessment.targetPerson}
                        cognitoSub={cognitoSub!}
                    />

                    <PatientHistorySection
                        targetPerson={assessment.targetPerson}
                        cognitoSub={cognitoSub!}
                        excludeAssessmentId={id!}
                    />
                </div>
            )}
        </div>
    );
}