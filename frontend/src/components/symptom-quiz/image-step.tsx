import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { UploadCloud, RefreshCw, Activity, ArrowRight, XCircle, ScanEye, Plus } from "lucide-react";
import { toast } from "sonner";
import { visionService } from "@/services/image-analyzer-service.ts";
import { SYMPTOM_MAPPER } from "@/utils/symptoms_wrap.ts";

export interface AnalysisEntry {
    id: string;
    imageSrc: string;
    detectedSymptoms: Record<string, number>;
}

export interface VisionStepProps {
    analyses: AnalysisEntry[];
    setAnalyses: React.Dispatch<React.SetStateAction<AnalysisEntry[]>>;
    onNext: (detectedSymptoms?: Record<string, number>) => void;
    onSkip: () => void;
}

export const VisionStep: React.FC<VisionStepProps> = ({ analyses, setAnalyses, onNext, onSkip }) => {
    const { t } = useTranslation();

    const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setCurrentImageBase64(reader.result as string);
        };
        reader.readAsDataURL(file);

        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleAnalyze = async () => {
        if (!currentImageBase64) return;
        setIsAnalyzing(true);
        try {
            const data = await visionService.analyzeImage({ image: currentImageBase64 });
            const rawDetected = data.data || data;

            const mappedSymptoms: Record<string, number> = {};
            Object.entries(rawDetected).forEach(([rawKey, intensity]) => {
                const standardizedKey = SYMPTOM_MAPPER[rawKey] || rawKey;
                mappedSymptoms[standardizedKey] = Number(intensity);
            });

            setAnalyses(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    imageSrc: currentImageBase64,
                    detectedSymptoms: mappedSymptoms
                }
            ]);

            setCurrentImageBase64(null);
            toast.success(t("Image analyzed successfully!"));
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || t("Failed to analyze image."));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleClearCurrentImage = () => {
        setCurrentImageBase64(null);
    };

    const handleRemoveAnalysis = (idToRemove: string) => {
        setAnalyses(prev => prev.filter(a => a.id !== idToRemove));
    };

    const handleSkipAction = () => {
        if (currentImageBase64) {
            setAnalyses(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    imageSrc: currentImageBase64,
                    detectedSymptoms: {}
                }
            ]);
        }

        setCurrentImageBase64(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        onSkip();
    };

    const handleApplyAndContinue = () => {
        const combinedSymptoms: Record<string, number> = {};

        analyses.forEach(analysis => {
            Object.entries(analysis.detectedSymptoms).forEach(([symptom, intensity]) => {
                if (!combinedSymptoms[symptom] || combinedSymptoms[symptom] < intensity) {
                    combinedSymptoms[symptom] = intensity;
                }
            });
        });

        if (currentImageBase64) {
            setAnalyses(prev => [
                ...prev,
                {
                    id: Date.now().toString(),
                    imageSrc: currentImageBase64,
                    detectedSymptoms: {}
                }
            ]);
        }

        onNext(combinedSymptoms);
    };

    const INTENSITY_MAP: Record<string | number, { label: string;}> = {
        1: { label: t("HIGH")},
        0.6: { label: t("MID")},
        0.3: { label: t("LOW")},
        default: { label: t("LOW")}
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto space-y-6 text-secondary"
        >
            <div className="space-y-2 text-center md:text-left">
                <h3 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3 justify-center md:justify-start">
                    <ScanEye className="text-primary w-8 h-8" />
                    {t("Visual Analysis")}
                </h3>
                <p className="text-secondary/60 text-xs font-mono">
                    {t("Upload photos of the affected areas to automatically detect symptoms. You can add multiple photos. This step is optional.")}
                </p>
            </div>

            <input
                type="file"
                accept="image/jpeg, image/png, image/webp, image/gif"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />

            <AnimatePresence>
                {analyses.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4 mt-6"
                    >
                        <h4 className="text-sm font-bold uppercase tracking-wider text-primary/80 font-mono border-b border-secondary/10 pb-2">
                            {t("Completed Analyses")}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analyses.map((analysis) => (
                                <motion.div
                                    key={analysis.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="p-3 bg-secondary/[0.02] border border-secondary/10 rounded-xl relative group flex gap-3"
                                >
                                    <button
                                        onClick={() => handleRemoveAnalysis(analysis.id)}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground p-2 md:p-1 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shadow-md z-10"
                                        title={t("Discard")}
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                    <img
                                        src={analysis.imageSrc}
                                        alt="Analyzed"
                                        className="w-16 h-16 object-cover rounded-lg border border-secondary/20 shrink-0"
                                    />

                                    <div className="flex flex-col justify-center overflow-hidden">
                                        {Object.keys(analysis.detectedSymptoms).length === 0 ? (
                                            <span className="text-[10px] text-secondary/40 italic">
                                                {t("No visible symptoms detected in this photo.")}
                                            </span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(analysis.detectedSymptoms).map(([symptom, intensity]) => {
                                                    const config = INTENSITY_MAP[intensity] || INTENSITY_MAP.default;

                                                    return (
                                                        <span
                                                            key={symptom}
                                                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/[0.05] border border-secondary/10"
                                                        >
                                                            <span className="text-[10px] font-medium text-secondary">
                                                                {t(symptom)}
                                                            </span>

                                                  <span
                                                      className={`text-[9px] font-bold uppercase px-1 ${
                                                          config.label === t("HIGH")
                                                              ? "text-destructive"
                                                              : config.label === t("MID")
                                                                  ? "text-warning"
                                                                  : "text-info"
                                                      }`}
                                                  >
                                                    {config.label}
                                                </span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="mt-8">
                {!currentImageBase64 ? (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-secondary/20 hover:border-primary/50 bg-secondary/[0.02] rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group"
                    >
                        <div className="flex gap-4 text-secondary/40 group-hover:text-primary transition-colors">
                            <UploadCloud className="w-8 h-8" />
                            {analyses.length > 0 && <Plus className="w-6 h-6 absolute ml-8 -mt-2 text-primary" />}
                        </div>
                        <span className="font-mono text-xs uppercase tracking-wider font-bold text-secondary/60 group-hover:text-primary transition-colors">
                            {analyses.length > 0 ? t("Upload another photo") : t("Upload a photo")}
                        </span>
                    </button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-primary/30 bg-primary/5 rounded-2xl"
                    >
                        <div className="relative w-full sm:w-32 sm:h-32 shrink-0">
                            <button
                                onClick={handleClearCurrentImage}
                                disabled={isAnalyzing}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground hover:cursor-pointer p-1.5 rounded-full z-10 transition-opacity disabled:opacity-50 shadow-md"
                                title={t("Discard current photo")}
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                            <img
                                src={currentImageBase64}
                                alt="Preview"
                                className="w-full h-48 sm:h-full object-cover rounded-xl border border-primary/20 bg-secondary-foreground/50 shadow-sm"
                            />
                        </div>

                        <div className="flex-1 w-full">
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full bg-primary text-secondary rounded-xl font-bold uppercase tracking-wider font-mono text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 py-4 shadow-lg shadow-primary/20"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <RefreshCw size={16} className="animate-spin" />
                                        {t("Analyzing...")}
                                    </>
                                ) : (
                                    <>
                                        <Activity size={16} />
                                        {t("Analyze This Photo")}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-8">
                {analyses.length === 0 && !currentImageBase64 ? (
                    <button
                        onClick={handleSkipAction}
                        className="w-full py-4 uppercase tracking-wider font-mono text-xs font-bold text-secondary/40 hover:text-secondary transition-colors cursor-pointer"
                    >
                        {t("Skip this step")}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleSkipAction}
                            className="flex-1 px-4 py-4 border border-secondary/10 hover:bg-secondary/5 rounded-xl font-bold uppercase tracking-wider font-mono text-xs transition-colors cursor-pointer text-center"
                        >
                            {analyses.length > 0 ? t("Continue without detected symptoms") : t("Skip")}
                        </button>

                        <button
                            onClick={handleApplyAndContinue}
                            disabled={analyses.length === 0 || isAnalyzing}
                            className="flex-[2] bg-secondary-foreground border border-primary text-primary rounded-xl font-bold uppercase tracking-wider font-mono text-xs flex items-center justify-center gap-2 hover:bg-primary hover:text-secondary transition-all cursor-pointer py-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-primary"
                        >
                            {t("Apply Symptoms & Continue")}
                            <ArrowRight size={16} />
                        </button>
                    </>
                )}
            </div>
        </motion.div>
    );
};