import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type Intensity } from "@/utils/normalize-body-part.ts";

export function SymptomRow({ label, value, onSelect, onRemove }: { label: string, value?: Intensity, onSelect: (v: Intensity) => void, onRemove: () => void }) {
    const { t } = useTranslation();

    return (
        <motion.div
            layout
            className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 justify-between p-4 rounded-xl border transition-all duration-300 ${
                value ? "bg-primary/5 border-primary/30" : "bg-secondary-foreground border-secondary/5"
            }`}
        >
            <span className={`text-xs font-bold uppercase tracking-wider ${value ? 'text-primary' : 'text-secondary/70'}`}>
                {label.replaceAll("_", " ")}
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex flex-1 sm:flex-initial items-center gap-1.5 sm:gap-2">
                    {[0.3, 0.6, 1].map((lvl) => (
                        <button
                            key={lvl}
                            onClick={() => onSelect(lvl as Intensity)}
                            className={`flex-1 sm:flex-none px-2 sm:px-3 py-2.5 sm:py-1.5 rounded-md text-[10px] sm:text-[9px] font-black tracking-widest transition-all ${
                                value === lvl
                                    ? "bg-primary text-secondary-foreground shadow-sm"
                                    : "bg-secondary/5 text-secondary/40 hover:bg-secondary/10"
                            }`}
                        >
                            {lvl === 1 ? t("HIGH") : lvl === 0.6 ? t("MID") : t("LOW")}
                        </button>
                    ))}
                </div>

                {value && (
                    <button
                        onClick={onRemove}
                        className="flex-shrink-0 text-destructive hover:bg-destructive/10 p-2 sm:p-1 rounded-md transition-colors"
                        aria-label="Remove symptom"
                    >
                        <X className="w-4 h-4 sm:w-4 sm:h-4" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}