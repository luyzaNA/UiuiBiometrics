import { motion } from "framer-motion";
import { User, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AgeStepProps {
    age: number;
    setAge: (age: number) => void;
    onNext: () => void;
}

export function AgeStep({ age, setAge, onNext }: AgeStepProps) {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center max-w-2xl mx-auto space-y-10 py-8"
        >
            <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-8 py-12">
                <div className="p-4 bg-primary/10 rounded-full border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    <User className="w-8 h-8 text-primary" />
                </div>

                <div className="space-y-2">
                    <h3 className="text-3xl font-black text-secondary uppercase tracking-tight">
                        {t("How old are you?")}
                    </h3>
                    <p className="text-secondary/60 text-xs font-mono">
                        {t("Age helps us correctly calibrate the algorithms for deficiencies.")}
                    </p>
                </div>

                <div className="w-full space-y-4 bg-secondary/[0.02] border border-secondary/10 p-6 rounded-3xl backdrop-blur-sm">
                    <div className="text-5xl font-black text-primary font-mono tracking-tighter">
                        {age} <span className="text-xs uppercase text-secondary/40 font-sans tracking-widest">{t("years")}</span>
                    </div>

                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full h-2 bg-secondary/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                    />

                    <div className="flex justify-between text-[10px] font-mono text-secondary/40">
                        <span>{t("1 YEAR")}</span>
                        <span>{t("50 YEARS")}</span>
                        <span>{t("100 YEARS")}</span>
                    </div>
                </div>

                <button
                    onClick={onNext}
                    className="group flex items-center gap-2 bg-primary text-secondary-foreground font-black tracking-widest text-xs px-8 py-4 rounded-2xl shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all duration-300 cursor-pointer"
                >
                    {t("CONTINUE")}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
}