import { motion } from "framer-motion";
import { User, ArrowRight, PenLine } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AgeStepProps {
    age: number;
    setAge: (age: number) => void;
    recipientType: "me" | "other" | null;
    personName: string;
    onNext: () => void;
}

export function AgeStep({ age, setAge, recipientType, personName, onNext }: AgeStepProps) {
    const { t } = useTranslation();

    const getTitle = () => {
        if (recipientType === "me") return t("How old are you?");
        if (personName) return `${t("How old is")} ${personName}?`;
        return t("How old is this person?");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val <= 100) {
            setAge(val);
        } else if (e.target.value === "") {
            setAge(0);
        }
    };

    const handleInputBlur = () => {
        if (age < 1 || isNaN(age)) {
            setAge(1);
        }
    };

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

                <div className="space-y-2 text-center">
                    <h3 className="text-3xl font-black text-secondary uppercase tracking-tight">
                        {getTitle()}
                    </h3>
                    <p className="text-secondary/60 text-xs font-mono">
                        {t("Age helps us correctly calibrate the algorithms for deficiencies.")}
                    </p>
                </div>

                <div className="w-full space-y-8 bg-secondary/[0.02] border border-secondary/10 p-6 rounded-3xl backdrop-blur-sm">

                    <div className="text-5xl font-black text-primary font-mono tracking-tighter text-center">
                        {age === 0 ? "-" : age} <span className="text-xs uppercase text-secondary/40 font-sans tracking-widest">{t("years")}</span>
                    </div>

                    <div className="flex items-center gap-4">

                        <div className="flex-1 space-y-2">
                            <input
                                type="range"
                                min="1"
                                max="100"
                                value={age}
                                onChange={(e) => setAge(Number(e.target.value))}
                                className="w-full h-2 bg-secondary/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                            />
                            <div className="flex justify-between text-[10px] font-mono text-secondary/40 px-1">
                                <span>{t("1")}</span>
                                <span>{t("50")}</span>
                                <span>{t("100")}</span>
                            </div>
                        </div>

                        <div className="w-20 relative group">
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={age === 0 ? "" : age}
                                onChange={handleInputChange}
                                onBlur={handleInputBlur}
                                placeholder="Age"
                                className="w-full bg-background border-2 border-secondary/20 text-secondary text-center font-bold text-lg py-2 rounded-xl focus:outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <PenLine className="absolute -top-2 -right-2 w-4 h-4 text-primary bg-background rounded-full p-0.5 opacity-50 group-focus-within:opacity-0 transition-opacity pointer-events-none" />
                        </div>

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