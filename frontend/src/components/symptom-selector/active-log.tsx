import { Database, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type Intensity } from "@/utils/normalize-body-part.ts";

interface ActiveLogProps {
    values: Record<string, Intensity>;
    activeSymptomsCount: number;
    handleRemove: (symptom: string) => void;
}

export function ActiveLog({ values, activeSymptomsCount, handleRemove }: ActiveLogProps) {
    const { t } = useTranslation();
    return (
        <div className="bg-gradient-to-br from-primary/10 to-transparent border border-secondary/20 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-primary" />
                    <h3 className="text-secondary font-bold text-[10px] tracking-widest uppercase opacity-70">{t("Active selections")}</h3>
                </div>
                <span className="text-primary font-mono text-[10px] font-black tracking-tighter">{activeSymptomsCount} {t("ACTIVE_SYMPTOMS")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {Object.entries(values).map(([symptom, val]) => (
                    <div key={symptom} className="bg-secondary-foreground border border-primary/20 flex items-center gap-2 px-3 py-1.5 rounded-lg group">
                        <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">{t(symptom).replaceAll("_", " ")}</span>
                        <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 rounded">{val === 1 ? t("HIGH") : val === 0.6 ? t("MID") : t("LOW")}</span>
                        <button onClick={() => handleRemove(symptom)} className="text-destructive/40 hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                    </div>
                ))}
            </div>
        </div>
    );
}