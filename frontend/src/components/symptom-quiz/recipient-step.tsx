import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Users, Check, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { assessmentService } from "@/services/assessment-service.ts";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";

export type RecipientType = "me" | "other" | null;

interface RecipientStepProps {
    recipientType: RecipientType;
    setRecipientType: (type: "me" | "other") => void;
    personName: string;
    setPersonName: (name: string) => void;
    onNext: () => void;
}

export function RecipientStep({
                                  recipientType,
                                  setRecipientType,
                                  personName,
                                  setPersonName,
                                  onNext
                              }: RecipientStepProps) {
    const { t } = useTranslation();

    const [existingPersons, setExistingPersons] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchExistingPersons = async () => {
            try {
                setIsLoading(true);
                const response = await assessmentService.getAll();

                const assessmentsArray = Array.isArray(response) ? response : (response?.data || []);

                const names = Array.from(new Set(assessmentsArray.map((a: any) => a.targetPerson)))
                    .filter((name: string) =>
                        name &&
                        name.toLowerCase() !== "principal" &&
                        name.toLowerCase() !== "me"
                    );

                setExistingPersons(names);
            } catch (error) {
                console.error("Failed to fetch assessment history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchExistingPersons();
    }, []);

    const isNextDisabled =
        !recipientType ||
        (recipientType === "other" && !personName.trim());

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center max-w-2xl mx-auto space-y-10 py-8"
        >
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-black text-secondary uppercase tracking-tight">
                    {t("Who are you taking the test for?")}
                </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-md">
                <div
                    onClick={() => {
                        setRecipientType("me");
                        setPersonName("");
                    }}
                    className={`relative cursor-pointer group p-8 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-4 ${
                        recipientType === "me"
                            ? "bg-primary/15 border-primary shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                            : "bg-secondary/[0.02] border-secondary/10 hover:border-primary/40"
                    }`}
                >
                    <div className="p-4 bg-secondary-foreground/5 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <User className={`w-8 h-8 ${recipientType === "me" ? "text-primary" : "text-secondary/60"}`} />
                    </div>
                    <span className="font-black tracking-widest text-sm text-secondary uppercase">{t("For me")}</span>
                    {recipientType === "me" && (
                        <div className="absolute top-4 right-4 bg-primary p-1 rounded-full text-secondary-foreground">
                            <Check className="w-3 h-3" />
                        </div>
                    )}
                </div>

                <div
                    onClick={() => setRecipientType("other")}
                    className={`relative cursor-pointer group p-8 rounded-3xl border-2 transition-all duration-300 flex flex-col items-center gap-4 ${
                        recipientType === "other"
                            ? "bg-primary/15 border-primary shadow-[0_0_30px_rgba(168,85,247,0.2)]"
                            : "bg-secondary/[0.02] border-secondary/10 hover:border-primary/40"
                    }`}
                >
                    <div className="p-4 bg-secondary-foreground/5 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <Users className={`w-8 h-8 ${recipientType === "other" ? "text-primary" : "text-secondary/60"}`} />
                    </div>
                    <span className="font-black tracking-widest text-sm text-secondary uppercase">{t("For someone else")}</span>
                    {recipientType === "other" && (
                        <div className="absolute top-4 right-4 bg-primary p-1 rounded-full text-secondary-foreground">
                            <Check className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {recipientType === "other" && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full max-w-md flex flex-col gap-4 bg-secondary/[0.02] border border-secondary/10 p-6 rounded-3xl backdrop-blur-sm overflow-hidden"
                    >
                        {isLoading ? (
                            <div className="text-center text-xs font-mono text-secondary/40 py-2">
                                {t("Loading...")}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2 w-full">

                                    <span className="text-primary text-[8px] lowercase font-normal italic">
                                        {t("*required")}
                                    </span>

                                <div className="flex flex-col sm:flex-row gap-4 w-full">
                                    {existingPersons.length > 0 && (
                                        <div className="flex-1 flex flex-col gap-2">
                                            <label className="text-[10px] font-mono font-black tracking-widest text-secondary/40 uppercase min-h-[16px] flex items-center">
                                                {t("Existing Profile")}
                                            </label>

                                            <Select
                                                value={existingPersons.includes(personName) ? personName : undefined}
                                                onValueChange={(value) => setPersonName(value)}
                                            >
                                                <SelectTrigger className="w-full px-4 py-6 bg-secondary-foreground/20 border border-secondary/10 rounded-xl font-mono text-xs text-secondary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors">
                                                    <SelectValue placeholder={t("Select...")} />
                                                </SelectTrigger>
                                                <SelectContent className="z-[150]">
                                                    {existingPersons.map((name) => (
                                                        <SelectItem key={name} value={name}>
                                                            {name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="flex-1 flex flex-col gap-2">
                                        <label className="text-[10px] font-mono font-black tracking-widest text-secondary/40 uppercase min-h-[16px] flex items-center w-full">
                                            {t("Name / Pseudonym")}
                                        </label>
                                        <input
                                            type="text"
                                            value={personName}
                                            onChange={(e) => setPersonName(e.target.value)}
                                            placeholder={t("e.g., Andrew, Jane, etc.")}
                                            className="w-full px-4 py-3 bg-secondary-foreground/20 border border-secondary/10 rounded-xl font-mono text-xs text-secondary focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                onClick={onNext}
                disabled={isNextDisabled}
                className={`group flex items-center gap-2 font-black tracking-widest text-xs px-8 py-4 rounded-2xl transition-all duration-300 ${
                    !isNextDisabled
                        ? "bg-primary text-secondary-foreground shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] cursor-pointer"
                        : "bg-secondary/10 text-secondary/30 cursor-not-allowed"
                }`}
            >
                {t("CONTINUE")}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </motion.div>
    );
}