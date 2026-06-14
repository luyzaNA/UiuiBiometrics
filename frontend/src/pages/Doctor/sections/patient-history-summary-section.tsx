import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2, BrainCircuit, Activity, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { assessmentService } from "@/services/assessment-service.ts";

interface AISummary {
    clinicalOverview: { en: string; ro: string };
    symptomEvolution: { en: string; ro: string };
    deficiencyTrends: { en: string; ro: string };
    physicianConsensus: { en: string; ro: string };
    clinicalRecommendations: Array<{ en: string; ro: string }>;
}

export function PatientHistorySummary({ cognitoSub, targetPerson }: { cognitoSub: string; targetPerson: string }) {
    const { t, i18n } = useTranslation();
    const lang = (i18n.language === "ro" ? "ro" : "en") as "en" | "ro";

    const [summary, setSummary] = useState<AISummary | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateSummary = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await assessmentService.getHistorySummary(cognitoSub, targetPerson);
            setSummary(response.data || response);
        } catch (err) {
            console.error(err);
            setError(t("Failed to generate summary. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-4 my-6 border-b border-secondary/10 pb-6">

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl hidden sm:flex shrink-0">
                        <BrainCircuit className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-foreground">
                            {t("AI History Analysis")}
                        </h4>
                        <p className="text-sm text-secondary/60 mt-1 max-w-xl">
                            {t("Get an intelligent overview of the patient's past assessments. The AI analyzes symptom evolution, deficiency trends, and highlights critical insights.")}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleGenerateSummary}
                    disabled={isLoading}
                    className="shrink-0 w-full md:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-secondary font-bold py-3 px-6 rounded-xl shadow-[0_10px_20px_rgba(232,157,245,0.2)] transition-all disabled:opacity-70 disabled:cursor-not-allowed hover:cursor-pointer"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {isLoading ? t("Analyzing history...") : summary ? t("Regenerate Summary") : t("AI Clinical Summary")}
                </button>
            </div>

            {error && (
                <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
                    {error}
                </div>
            )}

            <AnimatePresence>
                {summary && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-navbar backdrop-blur-xl border border-primary/20 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-6 mt-4"
                    >
                        <div className="flex items-center gap-3 border-b border-secondary/10 pb-4">
                            <div className="p-2.5 bg-primary/10 rounded-xl">
                                <BrainCircuit className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-secondary-foreground">{t("AI Assistant Summary")}</h3>
                                <p className="text-xs text-muted-foreground uppercase tracking-widest">{targetPerson}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="flex flex-col gap-2">
                                <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> {t("Clinical Overview")}
                                </h4>
                                <p className="text-sm text-secondary-foreground/80 leading-relaxed">
                                    {summary.clinicalOverview?.[lang] || "N/A"}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> {t("Symptom Evolution")}
                                </h4>
                                <p className="text-sm text-secondary-foreground/80 leading-relaxed">
                                    {summary.symptomEvolution?.[lang] || "N/A"}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                                    <Activity className="w-4 h-4" /> {t("Deficiency Trends")}
                                </h4>
                                <p className="text-sm text-secondary-foreground/80 leading-relaxed">
                                    {summary.deficiencyTrends?.[lang] || "N/A"}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                                    <BrainCircuit className="w-4 h-4" /> {t("Physician Consensus")}
                                </h4>
                                <p className="text-sm text-secondary-foreground/80 leading-relaxed">
                                    {summary.physicianConsensus?.[lang] || "N/A"}
                                </p>
                            </div>

                        </div>
                        {summary.clinicalRecommendations && summary.clinicalRecommendations.length > 0 && (
                            <div className="mt-2 bg-secondary/5 rounded-2xl p-5 border border-secondary/10">
                                <h4 className="text-sm font-bold text-secondary-foreground mb-3 flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-primary" /> {t("Actionable Recommendations")}
                                </h4>
                                <ul className="flex flex-col gap-2">
                                    {summary.clinicalRecommendations.map((rec, idx) => (
                                        <li key={idx} className="text-sm text-secondary-foreground/80 flex items-start gap-2">
                                            <span className="text-primary mt-0.5">•</span>
                                            <span>{rec[lang]}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}