import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type Intensity } from "@/utils/normalize-body-part.ts";

export function SymptomRow({ label, value, onSelect, onRemove }: { label: string, value?: Intensity, onSelect: (v: Intensity) => void, onRemove: () => void }) {
    const { t } = useTranslation();
    return (
        <motion.div layout className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${value ? "bg-primary/5 border-primary/30" : "bg-secondary-foreground border-secondary/5"}`}>
            <span className={`text-xs font-bold uppercase tracking-wider ${value ? 'text-primary' : 'text-secondary/70'}`}>
                {label.replaceAll("_", " ")}
            </span>
            <div className="flex items-center gap-2">
                {[0.3, 0.6, 1].map((lvl) => (
                    <button key={lvl} onClick={() => onSelect(lvl as Intensity)}
                            className={`px-3 py-1.5 rounded-md text-[9px] font-black tracking-widest transition-all ${value === lvl ? "bg-primary text-secondary-foreground" : "bg-secondary/5 text-secondary/40 hover:bg-secondary/10"}`}>
                        {lvl === 1 ? t("HIGH") : lvl === 0.6 ? t("MID") : t("LOW")}
                    </button>
                ))}
                {value && <button onClick={onRemove} className="ml-2 text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"><X className="w-4 h-4" /></button>}
            </div>
        </motion.div>
    );
}