import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle2, RefreshCw, Sparkles, UserCheck } from "lucide-react";

import { AgeStep } from "@/components/symptom-quiz/age-step.tsx";
import { GenderStep } from "@/components/symptom-quiz/gender-step.tsx";
import BodySymptomSelector from "@/components/mannequin.tsx";

import { profileService } from "@/services/profile-service.ts";
import { Gender, type ProfileI } from "@/models/profile-model.ts";
import { toast } from "sonner";

export default function SymptomQuizWizard() {
    const { t } = useTranslation();
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [age, setAge] = useState<number>(25);
    const [gender, setGender] = useState<"male" | "female" | null>(null);
    const [finalSymptoms, setFinalSymptoms] = useState<Record<string, string | number>>({});

    const [profile, setProfile] = useState<ProfileI | null>(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const profileData = await profileService.getMe();
                if (profileData) {
                    setProfile(profileData);
                    if (profileData.age) setAge(profileData.age);

                    if (profileData.gender === Gender.MASCULINE) setGender("male");
                    if (profileData.gender === Gender.FEMININE) setGender("female");
                }
            } catch (error) {
                console.error("Could not load profile for pre-filling:", error);
            }
        };

        fetchUserProfile();
    }, []);

    const handleCompleteQuiz = (symptoms: Record<string, string | number>) => {
        setFinalSymptoms(symptoms);
        setStep(4);
        console.log(symptoms);
    };

    const triggerAiAnalysis = () => {
        const payload = { age, gender, symptoms: finalSymptoms };
        console.log("Payload sent to AI algorithm:", payload);
        toast.success(t("Data sent successfully for analysis!"));
    };

    const handleSendForAnalysisClick = () => {
        const currentDbGender = gender === "male" ? Gender.MASCULINE : Gender.FEMININE;

        const isDataIdentical = profile && profile.age === age && profile.gender === currentDbGender;

        if (isDataIdentical) {
            triggerAiAnalysis();
        } else {
            setShowUpdateModal(true);
        }
    };

    const handleUpdateProfileAndSend = async () => {
        try {
            setIsSavingProfile(true);

            const dbGender = gender === "male" ? Gender.MASCULINE : Gender.FEMININE;
            const payload = {
                age: Number(age),
                gender: dbGender
            };

            let savedProfile;
            if (profile?.profileId) {
                savedProfile = await profileService.update(profile.profileId, payload);
            } else {
                savedProfile = await profileService.create(payload);
            }

            setProfile(savedProfile);
            toast.success(t("Profile updated successfully!"));

            setShowUpdateModal(false);

            await new Promise((resolve) => setTimeout(resolve, 1500));

            triggerAiAnalysis();
        } catch (error) {
            toast.error(t("Failed to update profile. Your data will still be analyzed."));
            setShowUpdateModal(false);

            await new Promise((resolve) => setTimeout(resolve, 1500));

            triggerAiAnalysis();
        } finally {
            setIsSavingProfile(false);
        }
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
                                <div><span className="text-secondary/50">{t("Age")}:</span> {age} {t("years")}</div>
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
                                onClick={handleSendForAnalysisClick}
                                className="w-full bg-primary text-secondary font-bold uppercase tracking-wider py-4 rounded-xl hover:opacity-90 transition-opacity cursor-pointer text-sm"
                            >
                                {t("Send for analysis")}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showUpdateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-secondary-foreground/60">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="w-full max-w-md bg-secondary-foreground border border-secondary/10 p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-6 text-secondary"
                        >
                            <div className="space-y-2 text-center">
                                <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2 border border-primary/20">
                                    <UserCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-wide">
                                    {t("Update profile details?")}
                                </h3>
                                <p className="text-secondary/60 text-xs font-mono">
                                    {t(("Would you like to sync your profile with the data introduced in the quiz?"))}
                                </p>
                            </div>

                            <div className="bg-secondary/[0.02] border border-secondary/10 p-4 rounded-xl font-mono text-xs space-y-1">
                                <div><span className="text-secondary/40">{t("Age")}:</span> {age} {t("years")}</div>
                                <div><span className="text-secondary/40">{t("Gender")}:</span> {gender === 'male' ? t("Male") : t("Female")}</div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="button"
                                    disabled={isSavingProfile}
                                    onClick={() => {
                                        setShowUpdateModal(false);
                                        triggerAiAnalysis();
                                    }}
                                    className="flex-1 px-4 py-3 border border-secondary/10 hover:bg-secondary/5 rounded-xl font-bold uppercase tracking-wider font-mono text-[11px] transition-colors cursor-pointer text-center disabled:opacity-40"
                                >
                                    {t("Only Analyze")}
                                </button>

                                <button
                                    type="button"
                                    disabled={isSavingProfile}
                                    onClick={handleUpdateProfileAndSend}
                                    className="flex-1 px-4 py-3 bg-primary text-secondary rounded-xl font-bold uppercase tracking-wider font-mono text-[11px] flex items-center justify-center gap-2 transition-all hover:opacity-90 cursor-pointer text-center disabled:opacity-50"
                                >
                                    {isSavingProfile ? (
                                        <RefreshCw size={12} className="animate-spin" />
                                    ) : (
                                        <Sparkles size={12} />
                                    )}
                                    {isSavingProfile ? t("Updating...") : t("Sync & Analyze")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
}