import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { AgeStep } from "@/components/symptom-quiz/age-step.tsx";
import { GenderStep } from "@/components/symptom-quiz/gender-step.tsx";
import BodySymptomSelector from "@/components/mannequin.tsx";

export default function SymptomQuizWizard() {
    const { t } = useTranslation();
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [age, setAge] = useState<number>(25);
    const [gender, setGender] = useState<"male" | "female" | null>(null);
    const [finalSymptoms, setFinalSymptoms] = useState<Record<string, string | number>>({});

    const handleCompleteQuiz = (symptoms: Record<string, string | number>) => {
        setFinalSymptoms(symptoms);
        setStep(4);
        console.log(symptoms);

        const payload = { age, gender, symptoms };
        console.log("Payload:", payload);
    };
    const INTENSITY_MAP: Record<string | number, { label: string; styles: string }> = {
        1: {
            label: t("HIGH"),
            styles: "bg-destructive/10 text-destructive border border-destructive/20"
        },
        0.6: {
            label: t("MID"),
            styles: "bg-warning/10 text-warning border border-warning/20"
        },
        default: {
            label: t("LOW"),
            styles: "bg-info/10 text-info border border-info/20"
        }
    };
    return (
        <section className="relative w-full min-h-screen bg-secondary-foreground py-12 px-6 font-sans rounded-3xl border border-secondary/10 cursor-default">
            <div
                className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: `linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)`, backgroundSize: '40px 40px' }}
            />

            <div className="relative z-10 max-w-7xl mx-auto" onClick={(e) => e.stopPropagation()}>

                <div className="flex items-center justify-between mb-8 border-b border-secondary/5 pb-4">
                    {step > 1 && (
                        <button
                            onClick={() => setStep((prev) => (prev - 1) as any)}
                            className="flex items-center gap-2 text-xs font-mono text-secondary/60 hover:text-primary transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" /> {t("BACK")}
                        </button>
                    )}
                    <div className="ml-auto text-[10px] font-mono tracking-widest text-primary/60 uppercase">
                        {t("STEP")} {step} / {step === 4 ? "4" : "3"}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <AgeStep key="age" age={age} setAge={setAge} onNext={() => setStep(2)} />
                    )}

                    {step === 2 && (
                        <GenderStep key="gender" gender={gender} setGender={setGender} onNext={() => setStep(3)} />
                    )}

                    {step === 3 && gender && (
                        <BodySymptomSelector
                            key="selector"
                            age={age}
                            gender={gender}
                            onComplete={handleCompleteQuiz}
                        />
                    )}

                    {step === 4 && (
                        <motion.div
                            key="summary"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-2xl mx-auto space-y-6 text-secondary"
                        >
                            <div className="space-y-2 text-center md:text-left">
                                <h3 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3 justify-center md:justify-start">
                                    <CheckCircle2 className="text-primary w-8 h-8" />
                                    {t("Your data summary")}
                                </h3>
                                <p className="text-secondary/60 text-xs font-mono">
                                    {t("Collected data:")}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-secondary/5 p-4 rounded-xl border border-secondary/10 font-mono text-xs">
                                <div><span className="text-secondary/50">{t("Age")}:</span> {age} ani</div>
                                <div><span className="text-secondary/50">{t("Gender")}:</span> {gender === 'male' ? t("Male") : t("Female")}</div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-primary/80 font-mono">
                                    {t("Selected symptoms & intensity")}
                                </h4>

                                {Object.keys(finalSymptoms).length === 0 ? (
                                    <p className="text-sm text-secondary/40 italic">{t("No symptoms selected")}</p>
                                ) : (
                                    <div className="divide-y divide-secondary/10 border border-secondary/10 rounded-xl overflow-hidden bg-secondary/[0.02]">
                                        {Object.entries(finalSymptoms).map(([symptom, intensity]) => {
                                            const config = INTENSITY_MAP[intensity] || INTENSITY_MAP.default;
                                            return (
                                                <div key={symptom} className="flex justify-between items-center p-4 hover:bg-secondary/[0.04] transition-colors">
                                                <span className="font-medium text-sm capitalize">
                                                    {t(symptom)}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${config.styles}`}>
                                                    {t(config.label)}
                                                </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => alert("Datele au fost trimise cu succes!")}
                                className="w-full bg-primary text-secondary font-bold uppercase tracking-wider py-4 rounded-xl hover:opacity-90 transition-opacity cursor-pointer text-sm"
                            >
                                {t("Send for analysis")}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}