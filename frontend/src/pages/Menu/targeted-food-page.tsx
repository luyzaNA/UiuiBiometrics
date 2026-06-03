import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { type CreateFoodMenuRequest, foodBasedMenuService } from "@/services/food-based-menu-service";
import TargetedFoodsProtocol from "@/pages/Menu/section/targeted-food-section.tsx";
import { toast } from "sonner";

export default function TargetedFoodsPage() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
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

    const targetDeficiencies = state?.deficiencies?.filter(d => d.riskScore >= 50) || [];

    useEffect(() => {
        if (!state?.assessmentId || !state?.deficiencies) {
            setError(t("Missing assessment data. Please try again."));
            setIsLoading(false);
            return;
        }

        const generateMenu = async () => {
            if (hasFetched.current) return;
            hasFetched.current = true;

            try {
                const formattedDeficiencies = state.deficiencies
                    .filter(d => d.riskScore >= 50)
                    .map(d => ({
                        name: d.nutrient,
                        score: d.riskScore / 100
                    }));

                if (formattedDeficiencies.length === 0) {
                    setError(t("No significant deficiencies detected that require a dedicated protocol."));
                    setIsLoading(false);
                    return;
                }

                const requestPayload: CreateFoodMenuRequest & { language?: string } = {
                    assessment_id: state.assessmentId,
                    deficiencies: formattedDeficiencies,
                    language: i18n.language || "en"
                };

                const response = await foodBasedMenuService.createFoodMenu(requestPayload);
                setMenuData(response);
            } catch (err) {
                console.error("Failed to generate food");
                setError(t("An error occurred while generating your menu."));
                hasFetched.current = false;
            } finally {
                setIsLoading(false);
            }
        };

        generateMenu();
    }, [state, t, i18n.language]);

    const handleAcceptChallenge = async () => {
        if (!menuData?.menuId) return;

        setIsActivating(true);
        try {
            await foodBasedMenuService.activateMenu(menuData.menuId);
            setIsAccepted(true);
            setMenuData((prev: any) => ({ ...prev, status: "ACTIVE" }));

            toast.success(t("Challenge accepted! Your new protocol is active and previous ones were moved to history."));

        } catch (err) {
            toast.error(t("Something went wrong. Please try again."));
        } finally {
            setIsActivating(false);
            setShowAcceptConfirmation(false);
        }
    };

    const handleFinalDecline = async () => {
        toast.info(t("Menu skipped. You can generate a new one after your next assessment."));
        navigate("/");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 animate-fadeIn bg-background">
                <div className="w-12 h-12 border-t-2 border-primary rounded-full animate-spin mb-8" />
                <h2 className="text-xl font-light tracking-wide text-foreground mb-3">
                    {t("We're busy selecting the perfect foods to support your energy and well-being. This will just take a moment!")}
                </h2>
                <div className="flex gap-3 justify-center items-center opacity-60 text-sm font-medium tracking-widest uppercase">
                    {targetDeficiencies.map((def, idx) => (
                        <span key={def.nutrient} className="flex items-center gap-3">
                            {idx > 0 && <span className="w-1 h-1 bg-foreground/30 rounded-full" />}
                            {t(def.nutrient)}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 animate-fadeIn bg-background">
                <p className="text-lg font-light text-foreground mb-6">{t("Something went wrong. Please try again.")}</p>
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
            <TargetedFoodsProtocol
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
                                        {t("If you decline, you will NOT be able to generate another protocol for the deficiencies found in this assessment.")}
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
                                        {t("Replace active protocol?")}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-lg">
                                        {t("By accepting this challenge, any currently active protocol will be moved to history. Are you ready to start fresh?")}
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
                                    {t("Ready to accept the challenge?")}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {t("Commit to this protocol to optimize your biomarkers and track your progress.")}
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