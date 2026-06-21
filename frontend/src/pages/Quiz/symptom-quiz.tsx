import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle2, RefreshCw, Sparkles, UserCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { RecipientStep, type RecipientType } from "@/components/symptom-quiz/recipient-step.tsx";
import { AgeStep } from "@/components/symptom-quiz/age-step.tsx";
import { GenderStep } from "@/components/symptom-quiz/gender-step.tsx";
import BodySymptomSelector from "@/components/mannequin.tsx";

import { profileService } from "@/services/profile-service.ts";
import { Gender, type ProfileI } from "@/models/profile-model.ts";
import { toast } from "sonner";
import { assessmentService, type CreateAssessmentRequest } from "@/services/assessment-service.ts";
import AssessmentResultsPage from "@/pages/Assessment/assessment-results-page.tsx";
import { VisionStep, type AnalysisEntry } from "@/components/symptom-quiz/image-step.tsx";

export default function SymptomQuizWizard() {
    const { t } = useTranslation();

    const [searchParams] = useSearchParams();

    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

    const [recipientType, setRecipientType] = useState<RecipientType>(null);
    const [personName, setPersonName] = useState<string>("");

    const [age, setAge] = useState<number>(25);
    const [name, setName] = useState<string | null>(null);
    const [gender, setGender] = useState<"male" | "female" | null>(null);

    const [visionAnalyses, setVisionAnalyses] = useState<AnalysisEntry[]>([]);
    const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, number>>({});

    const [profile, setProfile] = useState<ProfileI | null>(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any | null>(null);

    const [includeVisionData, setIncludeVisionData] = useState<boolean>(false);

    useEffect(() => {
        const targetParam = searchParams.get("target");
        const ageParam = searchParams.get("age");
        const genderParam = searchParams.get("gender");
        const stepParam = searchParams.get("step");

        let hasPreloadedData = false;

        if (targetParam) {
            if (targetParam.toLowerCase() === "principal" || targetParam.toLowerCase() === "me") {
                setRecipientType("me");
            } else {
                setRecipientType("other");
                setPersonName(targetParam);
            }
            hasPreloadedData = true;
        }

        if (ageParam) {
            setAge(Number(ageParam));
            hasPreloadedData = true;
        }

        if (genderParam) {
            const mappedGender = (genderParam === "masculine" || genderParam === "male")
                ? "male"
                : "female";
            setGender(mappedGender);
            hasPreloadedData = true;
        }

        if (stepParam) {
            const targetStep = Number(stepParam) as 1 | 2 | 3 | 4 | 5 | 6;
            if ([1, 2, 3, 4, 5, 6].includes(targetStep)) {
                setStep(targetStep);
            }
        } else if (hasPreloadedData) {
            setStep(4);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const profileData = await profileService.getMe();
                if (profileData) {
                    setProfile(profileData);

                    if (!searchParams.get("age") && profileData.age) {
                        setAge(profileData.age);
                    }
                    if (profileData.fullName) {
                        setName(profileData.fullName);
                    }
                    if (!searchParams.get("gender")) {
                        if (profileData.gender === Gender.MASCULINE) setGender("male");
                        if (profileData.gender === Gender.FEMININE) setGender("female");
                    }
                }
            } catch (error) {
                console.error("Could not load profile for pre-filling:", error);
            }
        };

        fetchUserProfile();
    }, [searchParams]);

    const handleVisionNext = (detectedSymptoms?: Record<string, number>) => {
        if (detectedSymptoms) {
            setSelectedSymptoms(prev => ({ ...prev, ...detectedSymptoms }));
        }
        setIncludeVisionData(true);
        setStep(5);
    };

    const handleVisionSkip = () => {
        setIncludeVisionData(false);
        setStep(5);
    };

    const handleCompleteQuiz = () => {
        setStep(6);
    };

    const triggerAiAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const formattedSymptoms: Record<string, number> = {};
            Object.entries(selectedSymptoms).forEach(([key, value]) => {
                formattedSymptoms[key] = Number(value);
            });

            const targetPerson = recipientType === "me" ? "Principal" : (personName || "Unknown");
            const base64Images = includeVisionData ? visionAnalyses.map(analysis => analysis.imageSrc) : [];

            const assessmentId = searchParams.get("assessmentId");
            console.log("NBYUUU NEREGEEEE", assessmentId);

            const payload: CreateAssessmentRequest = {
                target_person: targetPerson,
                age: Number(age),
                fullName: name,
                gender: gender === "female" ? "feminine" : "masculine",
                symptoms: formattedSymptoms,
                images: base64Images,
                parentAssessmentId: assessmentId,

                ...(assessmentId && { parentAssessmentId: assessmentId })
            };

            const result = await assessmentService.create(payload);
            toast.success(t("Analysis complete!"));
            setAnalysisResult(result);

        } catch (error) {
            toast.error(t("Failed to analyze symptoms. Please try again."));
        } finally {
            setIsAnalyzing(false);
        }
    };
    const handleSendForAnalysisClick = () => {
        if (recipientType === "other") {
            triggerAiAnalysis();
            return;
        }

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
        1: { label: t("HIGH"), styles: "bg-destructive/10 text-destructive border border-destructive/20" },
        0.6: { label: t("MID"), styles: "bg-warning/10 text-warning border border-warning/20" },
        0.3: { label: t("LOW"), styles: "bg-info/10 text-info border border-info/20" },
        default: { label: t("LOW"), styles: "bg-info/10 text-info border border-info/20" }
    };

    if (analysisResult) {
        return <AssessmentResultsPage data={analysisResult} />;
    }

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
                        {t("STEP")} {step} / 6
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <RecipientStep key="recipient" recipientType={recipientType} setRecipientType={setRecipientType} personName={personName} setPersonName={setPersonName} onNext={() => setStep(2)} />
                    )}

                    {step === 2 && (
                        <AgeStep key="age" age={age} setAge={setAge} recipientType={recipientType} personName={personName} onNext={() => setStep(3)} />
                    )}

                    {step === 3 && (
                        <GenderStep
                            key="gender"
                            gender={gender === "male" ? "masculine" : gender === "female" ? "feminine" : null}
                            setGender={(v) => setGender(v === "masculine" ? "male" : "female")}
                            recipientType={recipientType}
                            profileGender={profile?.gender as "masculine" | "feminine" | null}
                            personName={personName}
                            onNext={() => setStep(4)}
                        />
                    )}

                    {step === 4 && (
                        <VisionStep
                            key="vision"
                            analyses={visionAnalyses}
                            setAnalyses={setVisionAnalyses}
                            onNext={handleVisionNext}
                            onSkip={handleVisionSkip}
                        />
                    )}

                    {step === 5 && gender && (
                        <BodySymptomSelector
                            key="selector"
                            age={age}
                            gender={gender}
                            selectedSymptoms={selectedSymptoms}
                            onChange={setSelectedSymptoms}
                            onComplete={handleCompleteQuiz}
                        />
                    )}

                    {step === 6 && (
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
                                    {recipientType === "me"
                                        ? t("Your data summary")
                                        : `${t("Data summary for")} ${personName}`
                                    }
                                </h3>
                                <p className="text-secondary/60 text-xs font-mono">
                                    {t("Collected data:")}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 bg-secondary/5 p-4 rounded-xl border border-secondary/10 font-mono text-xs">
                                <div>
                                    <span className="text-secondary/50">{t("Subject")}:</span>{" "}
                                    {recipientType === "me"
                                        ? t("For me")
                                        : `${t("For someone else")} (${personName})`
                                    }
                                </div>
                                <div />
                                <div><span className="text-secondary/50">{t("Age")}:</span> {age} {t("years")}</div>
                                <div><span className="text-secondary/50">{t("Gender")}:</span> {gender === 'male' ? t("Male") : t("Female")}</div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-primary/80 font-mono">
                                    {t("Selected symptoms & intensity")}
                                </h4>

                                {Object.keys(selectedSymptoms).length === 0 ? (
                                    <p className="text-sm text-secondary/40 italic">{t("No symptoms selected")}</p>
                                ) : (
                                    <div className="divide-y divide-secondary/10 border border-secondary/10 rounded-xl overflow-hidden bg-secondary/[0.02]">
                                        {Object.entries(selectedSymptoms).map(([symptom, intensity]) => {
                                            const config = INTENSITY_MAP[intensity] || INTENSITY_MAP.default;
                                            return (
                                                <div key={symptom} className="flex justify-between items-center p-4 hover:bg-secondary/[0.04] transition-colors">
                                                    <span className="font-medium text-sm">
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
                                disabled={isAnalyzing}
                                className="w-full bg-primary text-secondary font-bold uppercase tracking-wider py-4 rounded-xl hover:opacity-90 transition-opacity cursor-pointer text-sm disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <RefreshCw className="animate-spin w-4 h-4" />
                                        {t("Analyzing...")}
                                    </>
                                ) : (
                                    t("Send for analysis")
                                )}
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
                                    {t("Would you like to sync your profile with the data introduced in the quiz?")}
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