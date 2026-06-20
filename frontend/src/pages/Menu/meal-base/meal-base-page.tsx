import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { menuService } from "@/services/menu-service.ts";
import { toast } from "sonner";
import MealBankProtocol from "@/pages/Menu/meal-base/section/meal-base-section.tsx";
import {MealsBasedMenuLoader} from "@/components/meal-based-menu-loader.tsx";

export default function MealBankCreatePage() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState<string>("");

    const [menuData, setMenuData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const [isActivating, setIsActivating] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const [showDeclineWarning, setShowDeclineWarning] = useState(false);
    const [showAcceptConfirmation, setShowAcceptConfirmation] = useState(false);

    const hasFetched = useRef(false);

    const state = location.state as {
        assessmentId: string,
        deficiencies: Array<{ nutrient: string; riskScore: number; status: string }>
    };

    const MIN_RISK_THRESHOLD = 30;
    const targetDeficiencies = state?.deficiencies?.filter(d => d.riskScore >= MIN_RISK_THRESHOLD) || [];

    useEffect(() => {
        if (!state?.assessmentId || !state?.deficiencies) {
            setError(t("Missing assessment data. Please try again."));
            setIsLoading(false);
            return;
        }

        const generateMealPlan = async () => {
            if (hasFetched.current) return;
            hasFetched.current = true;

            try {
                const formattedDeficiencies = state.deficiencies
                    .filter(d => d.riskScore >= MIN_RISK_THRESHOLD)
                    .map(d => ({
                        name: d.nutrient,
                        score: d.riskScore / 100
                    }));

                if (formattedDeficiencies.length === 0) {
                    setError(t("No significant deficiencies detected that require a dedicated meal plan."));
                    setIsLoading(false);
                    return;
                }

                const pipeline = [
                    { category: "breakfasts", message: t("Generating Breakfast Options..."), progress: 20 },
                    { category: "lunches", message: t("Generating Lunch Options..."), progress: 45 },
                    { category: "dinners", message: t("Generating Dinner Options..."), progress: 70 },
                    { category: "snacks", message: t("Generating Snack Options..."), progress: 90 }
                ];

                const stitchedMenuData: any = {
                    breakfasts: [],
                    lunches: [],
                    dinners: [],
                    snacks: [],
                };

                for (const step of pipeline) {
                    setLoadingMessage(step.message);
                    setLoadingProgress(step.progress);

                    const requestPayload = {
                        assessment_id: state.assessmentId,
                        deficiencies: formattedDeficiencies,
                        language: i18n.language || "en",
                        meal_category: step.category
                    };

                    const partialResponse = await menuService.generatePartialMealBank(requestPayload);

                    if (partialResponse) {
                        stitchedMenuData[step.category] = partialResponse[step.category] || partialResponse;
                    }
                }

                setLoadingMessage(t("Assembling and securing your personal plan..."));
                setLoadingProgress(98);

                const finalSavePayload = {
                    assessment_id: state.assessmentId,
                    deficiencies: formattedDeficiencies,
                    language: i18n.language || "en",
                    full_menu_data: stitchedMenuData
                };

                const response = await menuService.createMealBankMenu(finalSavePayload);
                setMenuData(response);
                setLoadingProgress(100);

            } catch (err) {
                setError(t("An error occurred while generating your meal plan."));
                hasFetched.current = false;
            } finally {
                setIsLoading(false);
            }
        };

        generateMealPlan();
    }, [state, t, i18n.language]);

    const handleAcceptChallenge = async () => {
        const id = menuData?.menuId || menuData?.menu_id;
        const target = menuData?.targetPerson || menuData?.target_person;

        if (!id || !target) {
            toast.error("Missing menu data to activate.");
            return;
        }

        setIsActivating(true);
        try {
            await menuService.activateMenu(id, target);

            setIsAccepted(true);
            setMenuData((prev: any) => ({ ...prev, status: "ACTIVE" }));

            toast.success(t("Challenge accepted! Your new plan is active and previous ones were moved to history."));
        } catch (err) {
            toast.error(t("Something went wrong. Please try again."));
        } finally {
            setIsActivating(false);
            setShowAcceptConfirmation(false);
        }
    };

    const handleFinalDecline = async () => {
        toast.info(t("Meal plan skipped. You can generate a new one after your next assessment."));
        navigate("/");
    };

    if (isLoading) {
        return (
            <MealsBasedMenuLoader
                isLoading={isLoading}
                loadingProgress={loadingProgress}
                loadingMessage={loadingMessage}
                targetDeficiencies={targetDeficiencies}
                t={t}
            />
        );
    }
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 animate-fadeIn bg-background">
                <p className="text-lg font-light text-foreground mb-6">{error}</p>
                <button
                    onClick={() => navigate("/")}
                    className="uppercase tracking-widest text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors border-b border-transparent hover:border-foreground pb-1"
                >
                    {t("Go to home page")}
                </button>
            </div>
        );
    }

    const showCommitmentBar = menuData?.status === "DRAFT" && !isAccepted;

    return (
        <div className={`relative ${showCommitmentBar ? "pb-40" : ""}`}>
            <MealBankProtocol
                menuData={menuData}
                showBack={true}
            />

            {showCommitmentBar && (
                <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-background/95 backdrop-blur-2xl border-t border-foreground/10 z-50 animate-fadeInUp shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    {showDeclineWarning ? (
                        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 animate-fadeIn">
                            <div className="flex gap-4 items-start sm:items-center text-left ">
                                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-1 sm:mt-0">
                                    <span className="text-destructive text-lg">⚠️</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">
                                        {t("Are you absolutely sure?")}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-lg">
                                        {t("If you decline, you will NOT be able to generate another meal plan for the deficiencies found in this assessment.")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex w-full sm:w-auto items-center gap-3">
                                <button
                                    onClick={() => setShowDeclineWarning(false)}
                                    className="flex-1 sm:flex-none px-6 py-3.5 bg-foreground/5 hover:bg-foreground/10 text-foreground font-semibold rounded-xl transition-all hover:cursor-pointer"
                                >
                                    {t("Go back")}
                                </button>
                                <button
                                    onClick={handleFinalDecline}
                                    className="flex-1 sm:flex-none px-6 py-3.5 bg-destructive hover:bg-destructive/90 text-secondary font-bold rounded-xl shadow-lg transition-all hover:cursor-pointer"
                                >
                                    {t("Yes, Decline")}
                                </button>
                            </div>
                        </div>
                    ) : showAcceptConfirmation ? (
                        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 animate-fadeIn">
                            <div className="flex gap-4 items-start sm:items-center text-left ">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1 sm:mt-0">
                                    <span className="text-primary text-lg">ℹ️</span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-foreground">
                                        {t("Replace active meal plan?")}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-lg">
                                        {t("By accepting this challenge, any currently active meal plan will be moved to history. Are you ready to start fresh?")}
                                    </p>
                                </div>
                            </div>
                            <div className="flex w-full sm:w-auto items-center gap-3">
                                <button
                                    onClick={() => setShowAcceptConfirmation(false)}
                                    disabled={isActivating}
                                    className="flex-1 sm:flex-none px-6 py-3.5 bg-foreground/5 hover:bg-foreground/10 text-foreground font-semibold rounded-xl transition-all hover:cursor-pointer disabled:opacity-50"
                                >
                                    {t("Cancel")}
                                </button>
                                <button
                                    onClick={handleAcceptChallenge}
                                    disabled={isActivating}
                                    className="flex-1 sm:flex-none px-6 py-3.5 bg-primary hover:bg-primary/90 text-secondary-foreground font-bold rounded-xl shadow-lg transition-all hover:cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {isActivating ? (
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin " />
                                    ) : (
                                        t("Yes, Activate")
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                            <div className="text-center sm:text-left">
                                <h3 className="text-lg font-bold text-foreground">
                                    {t("Ready to start your new diet?")}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t("Commit to this meal plan to optimize your biomarkers and track your progress.")}
                                </p>
                            </div>

                            <div className="flex w-full sm:w-auto flex-col sm:flex-row items-center gap-3">
                                <button
                                    onClick={() => setShowDeclineWarning(true)}
                                    disabled={isActivating}
                                    className="order-2 sm:order-1 w-full sm:w-auto px-6 py-3.5 text-muted-foreground hover:text-foreground font-semibold rounded-xl transition-colors disabled:opacity-50 hover:cursor-pointer"
                                >
                                    {t("I'll pass")}
                                </button>

                                <button
                                    onClick={() => setShowAcceptConfirmation(true)}
                                    disabled={isActivating}
                                    className="order-1 sm:order-2 w-full sm:w-auto px-8 py-3.5 bg-primary text-secondary-foreground font-bold rounded-xl shadow-[0_4px_14px_0_rgba(var(--primary),0.39)] hover:shadow-[0_6px_20px_rgba(var(--primary),0.23)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 flex items-center justify-center gap-2 hover:cursor-pointer"
                                >
                                    {t("I Accept The Challenge")}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}