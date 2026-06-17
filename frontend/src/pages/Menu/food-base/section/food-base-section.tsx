import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";

interface TargetedFoodsProtocolProps {
    menuData: any;
    showBack?: boolean;
}

export default function TargetedFoodsProtocol({ menuData, showBack = true }: TargetedFoodsProtocolProps) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const currentLanguage = i18n.language.startsWith("ro") ? "ro" : "en";

    const getLocalizedText = (value: any): string => {
        if (!value) return "";
        if (typeof value === "string") return value;
        return value[currentLanguage] || value.en || "";
    };

    if (!menuData) return null;

    const reviewDays = menuData?.reviewAfterDays || menuData?.review_after_days || 30;
    const deficiencyTargets = menuData?.deficiencyTargets || menuData?.deficiency_targets || [];

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-10 animate-fadeIn bg-background">
            <div className="mb-12">
                {showBack && (
                    <button
                        onClick={() => navigate(-1)}
                        className="group uppercase tracking-widest text-[10px] font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-2 transition-colors mb-10 hover:cursor-pointer"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                        {t("Go back")}
                    </button>
                )}

                <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground mb-4">
                    {t("Recommended Adjustments")}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground font-light max-w-2xl leading-relaxed">
                    {t("These highly specific foods have been selected to correct your nutritional vulnerabilities. Focus on integrating these into your routine for the next")}{" "}
                    <span className="font-medium text-foreground">{reviewDays} {t("days")}</span>.
                </p>
            </div>

            <div className="space-y-10">
                {deficiencyTargets.map((target: any, index: number) => {
                    const deficiencyName = target.deficiencyName || target.deficiency_name;
                    const recommendedFoods = target.recommendedFoods || target.recommended_foods || [];

                    return (
                        <section
                            key={index}
                            className="relative border border-foreground/10 rounded-2xl p-6 md:p-8 bg-foreground/[0.01]"
                        >
                            <div className="border-b border-foreground/10 pb-4 mb-2">
                                <span className="uppercase tracking-widest text-[9px] font-black text-primary mb-1 block">
                                    {t("Target Nutrient")}
                                </span>
                                <h2 className="text-2xl md:text-3xl font-medium text-foreground tracking-tight">
                                    {getLocalizedText(deficiencyName)}
                                </h2>
                            </div>

                            <div className="flex flex-col">
                                {recommendedFoods.map((food: any, fIndex: number) => {
                                    const foodName = food.foodName || food.food_name;
                                    const absorptionBoosters = food.absorptionBoosters || food.absorption_boosters || [];
                                    const servingSize = food.servingSize || food.serving_size;

                                    return (
                                        <div
                                            key={fIndex}
                                            className="group py-5 border-b border-foreground/5 last:border-b-0 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 hover:bg-foreground/[0.02] transition-colors duration-300 -mx-6 md:-mx-8 px-6 md:px-8"
                                        >
                                            <div className="md:col-span-6 lg:col-span-7 flex flex-col justify-center">
                                                <h3 className="text-base md:text-lg font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                                                    {getLocalizedText(foodName)}
                                                </h3>

                                                {absorptionBoosters.length > 0 && (
                                                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground/70 font-light mt-1">
                                                        <Plus size={12} className="text-foreground/30 shrink-0 mt-0.5" />
                                                        <span className="leading-snug">
                                                            <span className="italic">{t("Pair with")}</span>{" "}
                                                            <span className="font-medium text-foreground/70 lowercase">
                                                                {absorptionBoosters.map((b: any) => getLocalizedText(b)).join(", ")}
                                                            </span>
                                                            {" "}
                                                            <span className="italic">{t("for a better absorption")}</span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="md:col-span-6 lg:col-span-5 grid grid-cols-2 gap-2 items-center pt-2 md:pt-0 border-t border-foreground/5 md:border-t-0">
                                                <div className="flex flex-col">
                                                    <span className="uppercase tracking-widest text-[8px] font-bold text-muted-foreground/50 mb-0.5">
                                                        {t("Serving")}
                                                    </span>
                                                    <span className="font-medium text-foreground text-xs md:text-sm">
                                                        {servingSize}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col text-right md:text-left">
                                                    <span className="uppercase tracking-widest text-[8px] font-bold text-muted-foreground/50 mb-0.5">
                                                        {t("Frequency")}
                                                    </span>
                                                    <span className="font-medium text-foreground text-xs md:text-sm">
                                                        {getLocalizedText(food.frequency)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}