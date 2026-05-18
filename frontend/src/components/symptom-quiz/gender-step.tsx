import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GenderStepProps {
    gender: "male" | "female" | null;
    setGender: (gender: "male" | "female") => void;
    onNext: () => void;
}

export function GenderStep({ gender, setGender, onNext }: GenderStepProps) {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex flex-col items-center justify-center max-w-2xl mx-auto space-y-10 py-8"
        >
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-black text-secondary uppercase tracking-tight">
                    {t("Select your gender")}
                </h3>
                <p className="text-secondary/60 text-xs font-mono">
                    {t("The 2D model is calibrated based on the selected")}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                <div
                    onClick={() => setGender("male")}
                    className={`relative cursor-pointer group p-8 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-4 ${
                        gender === "male"
                            ? "bg-primary/15 border-primary shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                            : "bg-secondary/[0.02] border-secondary/10 hover:border-primary/40"
                    }`}
                >
                    <div className="text-4xl">🚹</div>
                    <span className="font-black tracking-widest text-sm text-secondary uppercase">{t("MALE")}</span>
                    {gender === "male" && (
                        <div className="absolute top-4 right-4 bg-primary p-1 rounded-full text-secondary-foreground">
                            <Check className="w-3 h-3" />
                        </div>
                    )}
                </div>
                <div
                    onClick={() => setGender("female")}
                    className={`relative cursor-pointer group p-8 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-4 ${
                        gender === "female"
                            ? "bg-primary/15 border-primary shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                            : "bg-secondary/[0.02] border-secondary/10 hover:border-primary/40"
                    }`}
                >
                    <div className="text-4xl">🚺</div>
                    <span className="font-black tracking-widest text-sm text-secondary uppercase">{t("FEMALE")}</span>
                    {gender === "female" && (
                        <div className="absolute top-4 right-4 bg-primary p-1 rounded-full text-secondary-foreground">
                            <Check className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={onNext}
                disabled={!gender}
                className={`group flex items-center gap-2 font-black tracking-widest text-xs px-8 py-4 rounded-2xl transition-all duration-300 ${
                    gender
                        ? "bg-primary text-secondary-foreground shadow-[0_0_25px_rgba(168,85,247,0.4)] cursor-pointer"
                        : "bg-secondary/10 text-secondary/30 cursor-not-allowed"
                }`}
            >
                {t("NEXT STEP")}
            </button>
        </motion.div>
    );
}