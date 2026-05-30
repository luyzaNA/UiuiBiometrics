import { useTranslation } from "react-i18next";
import {Activity, Heart} from "lucide-react";
import { MedicalAlert } from "@/components/medical-alert.tsx";
import PlanSelectionSection from "@/pages/Assessment/sections/plan-selection-section.tsx";
import {SYMPTOM_MAPPER} from "@/utils/symptoms_wrap.ts";
import {useUser} from "@/hooks/use-user.ts";

interface AssessmentResultsProps {
    data: {
        targetPerson?: string;
        age?: number;
        gender?: string;
        symptoms?: Record<string, number>;
        hasRedFlags?: boolean;
        redFlagDetails?: string[];
        predictedDeficiencies?: Record<string, number>;
        status?: string;
    };
}

export default function AssessmentResultsPage({ data }: AssessmentResultsProps) {
    const { t } = useTranslation();
    const userName:string = useUser().user.givenName;

    const target_person = data?.targetPerson || "Principal";
    const hasRedFlags = data?.hasRedFlags || false;
    const red_flags = data?.redFlagDetails || [];
    const symptoms = data?.symptoms || {};

    const rawDeficiencies = data?.predictedDeficiencies || {};
    const deficiencies = Object.entries(rawDeficiencies)
        .map(([nutrient, value]) => {
            const riskScore = Math.round((value as number) * 100);

            let status: "optimal" | "low" | "moderate" | "high" = "optimal";

            if (riskScore > 50) {
                status = "high";
            } else if (riskScore >= 31) {
                status = "moderate";
            } else if (riskScore >= 16) {
                status = "low";
            }

            return {
                nutrient,
                riskScore,
                status
            };
        })
        .sort((a, b) => b.riskScore - a.riskScore);

    if (hasRedFlags || red_flags.length > 0) {
        return <MedicalAlert redFlags={red_flags} />;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-5 animate-fadeIn">
            <div className="border-b border-secondary-foreground/10 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    {t("Analysis completed")}
                </span>
                <h1 className="text-2xl md:text-3xl font-black mt-3 tracking-tight text-secondary">
                    <p>
                        {t("What your body is telling you, ")} {target_person === "Principal" ? userName : target_person}
                    </p>
                </h1>
                <p className="text-secondary/60 mt-1 text-sm font-medium max-w-3xl leading-relaxed">
                    {t("Based on the symptoms you entered, here is a snapshot of your current nutritional state.")}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-1 bg-secondary p-5 rounded-2xl border border-secondary-foreground/10 shadow-sm space-y-3 h-fit">
                    <div className="flex items-center gap-2 text-secondary-foreground font-bold text-base">
                        <Activity className="text-primary" size={18} />
                        <h4>{t("What you observed:")}</h4>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {Object.keys(symptoms).length === 0 ? (
                            <p className="text-xs text-secondary-foreground/40 italic">
                                {t("No symptoms were processed.")}
                            </p>
                        ) : (
                            Object.entries(symptoms).map(([rawSymptom, intensity]) => {
                                const correctSymptomKey = SYMPTOM_MAPPER[rawSymptom] || rawSymptom;

                                return (
                                    <div key={correctSymptomKey} className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-secondary-foreground/5 border border-secondary-foreground/10 rounded-md text-sm">
                                        <span className="font-semibold text-secondary-foreground  text-xs">
                                            {t(correctSymptomKey)}
                                        </span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase">
                                          {intensity === 1 ? t("HIGH") : intensity === 0.6 ? t("MID") : t("LOW")}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-secondary p-6 rounded-2xl border border-secondary-foreground/10 shadow-sm space-y-5">
                        <div className="flex flex-col gap-1 border-b border-secondary-foreground/5 pb-3">
                            <div className="flex items-center gap-2 text-secondary-foreground font-bold text-lg">
                                <Heart className="text-primary" size={20} />
                                <h4>{t("Your micronutrient map")}</h4>
                            </div>
                            <p className="text-[11px] sm:text-xs text-secondary-foreground/50 font-medium leading-normal">
                                {t("The percentage indicates the estimated risk level of having a deficiency for each specific micronutrient.")}
                            </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 pt-1">
                        {deficiencies.length === 0 ? (
                            <p className="text-sm text-secondary-foreground/50 italic col-span-full">
                                {t("No major vulnerabilities detected.")}
                            </p>
                        ) : (
                            deficiencies.map((item, idx) => {
                                const isHigh = item.status === "high";
                                const isModerate = item.status === "moderate";
                                const isLow = item.status === "low";

                                const barColor = isHigh ? "bg-destructive" :
                                    isModerate ? "bg-chart-4" :
                                        isLow ? "bg-warning" :
                                            "bg-primary";

                                const textColor = isHigh ? "text-destructive/80" :
                                    isModerate ? "text-chart-4/80" :
                                        isLow ? "text-warning/80" :
                                            "text-primary/80";

                                const bgColor = isHigh ? "bg-destructive/10" :
                                    isModerate ? "bg-chart-4/10" :
                                        isLow ? "bg-warning/10" :
                                            "bg-primary/10";

                                const statusText = isHigh
                                    ? t("High risk")
                                    : isModerate
                                        ? t("Moderate")
                                        : isLow
                                            ? t("Monitoring")
                                            : t("Optimal");

                                return (
                                    <div key={item.nutrient || idx} className="flex flex-col gap-2">
                                        <div className="flex justify-between items-end gap-1.5">
                                            <div className="flex flex-col items-start gap-1 min-w-0">
                                          <span
                                              className="font-bold text-secondary-foreground text-[13px] sm:text-sm capitalize leading-none truncate w-full"
                                              title={t(item.nutrient)}
                                          >
                                            {t(item.nutrient)}
                                        </span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider leading-none shrink-0 ${bgColor} ${textColor}`}>
                                                    {statusText}
                                                </span>
                                            </div>
                                            <span className="font-bold text-secondary-foreground/70 text-xs font-mono leading-none shrink-0 mb-0.5">
                                                {item.riskScore}%
                                            </span>
                                        </div>

                                        <div className="w-full h-1.5 bg-secondary-foreground/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${barColor} transition-all duration-1000`}
                                                style={{ width: `${item.riskScore}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {deficiencies.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-secondary-foreground/5 space-y-4">
                            <h5 className="text-xs font-black uppercase tracking-wider text-secondary-foreground/70">
                                {t("Risk Level Guide")}
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                                <div className="flex gap-2.5 items-start">
                                    <span className="w-2 h-2 rounded-full bg-destructive shrink-0 mt-1 shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
                                    <div>
                                        <span className="font-bold text-destructive/80 block uppercase tracking-wide text-[10px]">{t("High Risk")}</span>
                                        <p className="text-secondary-foreground/60 leading-normal mt-0.5">
                                            {t("Strong indication of deficiency. Immediate dietary action or professional guidance is recommended.")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2.5 items-start">
                                    <span className="w-2 h-2 rounded-full bg-chart-4 shrink-0 mt-1 shadow-[0_0_4px_rgba(249,115,22,0.5)]" />
                                    <div>
                                        <span className="font-bold text-chart-4/80 block uppercase tracking-wide text-[10px]">{t("Moderate")}</span>
                                        <p className="text-secondary-foreground/60 leading-normal mt-0.5">
                                            {t("Mild nutritional imbalance detected. Good to address with targeted foods before it drops further.")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2.5 items-start">
                                    <span className="w-2 h-2 rounded-full bg-warning shrink-0 mt-1 shadow-[0_0_4px_rgba(234,179,8,0.5)]" />
                                    <div>
                                        <span className="font-bold text-warninf/80 block uppercase tracking-wide text-[10px]">{t("Monitoring")}</span>
                                        <p className="text-secondary-foreground/60 leading-normal mt-0.5">
                                            {t("Stable but close to borderline levels. Keep consistent with your nutrition to maintain this baseline.")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2.5 items-start">
                                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1 shadow-[0_0_4px_var(--primary)]" />
                                    <div>
                                        <span className="font-bold text-primary block uppercase tracking-wide text-[10px]">{t("Optimal")}</span>
                                        <p className="text-secondary-foreground/60 leading-normal mt-0.5">
                                            {t("Excellent balance. Your current symptom profile does not indicate any vulnerability here.")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 p-3 bg-secondary-foreground/[0.02] border border-secondary-foreground/5 rounded-xl text-[11px] text-secondary-foreground/50 leading-relaxed italic">
                            <span className="font-bold not-italic text-secondary-foreground/70 block mb-0.5">
                                {t("Medical Disclaimer:")}
                            </span>
                                {t("This analysis is for informational guidance only and based on AI pattern matching of your symptoms. It does not replace a formal medical diagnosis. Any clinical decisions, laboratory testing, or treatment plans should strictly be evaluated and approved by a qualified physician.")}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <PlanSelectionSection></PlanSelectionSection>
        </div>
    );
}