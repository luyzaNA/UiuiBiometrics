import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, ChefHat, Activity } from "lucide-react";

interface MealBankProtocolProps {
    menuData: any;
    showBack?: boolean;
}

export default function MealBankProtocol({ menuData, showBack = true }: MealBankProtocolProps) {
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

    const targetedDeficiencies = menuData?.deficiencies || [];

    const mealCategories = [
        { key: "breakfasts", label: "Breakfast Options", color: "text-amber-500" },
        { key: "lunches", label: "Lunch Options", color: "text-emerald-500" },
        { key: "dinners", label: "Dinner Options", color: "text-indigo-500" },
        { key: "snacks", label: "Snacks & Boosters", color: "text-rose-500" },
    ];

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
                    {t("Personalized meal menu")}
                </h1>

                <p className="text-sm md:text-base text-muted-foreground font-light max-w-2xl leading-relaxed mb-6">
                    {t("These recipes are engineered to target your specific deficiencies. Mix and match them to build your ideal week for the next")}{" "}
                    <span className="font-semibold text-primary">{reviewDays} {t("days")}</span>
                    {t(", knowing every bite works towards optimizing your biomarkers.")}
                </p>

                {targetedDeficiencies.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-secondary/30 border border-foreground/5 p-4 rounded-xl max-w-2xl animate-fadeIn">
                        <div className="flex items-center gap-2 text-primary font-medium text-xs uppercase tracking-wider shrink-0">
                            <Activity size={16} className="animate-pulse" />
                            <span>{t("Targeted deficiencies")}:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {targetedDeficiencies.map((deficiency: string, idx: number) => (
                                <span
                                    key={idx}
                                    className="text-[11px] font-semibold bg-background border border-foreground/10 text-foreground/80 px-2.5 py-1 rounded-lg shadow-sm"
                                >
                                    {t(deficiency)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-10">
                {mealCategories.map(({ key, label }) => {
                    const meals = menuData[key] || [];
                    if (meals.length === 0) return null;

                    return (
                        <section
                            key={key}
                            className="relative border border-foreground/10 rounded-2xl p-6 md:p-8 bg-foreground/[0.01]"
                        >
                            <div className="border-b border-foreground/10 pb-4 mb-2">
                                <span className="uppercase tracking-widest text-[9px] font-black text-primary mb-1 block">
                                    {t("Meal Category")}
                                </span>
                                <h2 className="text-2xl md:text-3xl font-medium text-foreground tracking-tight">
                                    {t(label)}
                                </h2>
                            </div>

                            <div className="flex flex-col">
                                {meals.map((meal: any, mIndex: number) => {
                                    const mealId = meal.meal_id || meal.mealId || mIndex;
                                    const prepTime = meal.prep_time_minutes || meal.prepTimeMinutes;
                                    const keyIngredients = meal.key_ingredients || meal.keyIngredients || [];

                                    return (
                                        <div
                                            key={mealId}
                                            className="group py-6 border-b border-foreground/5 last:border-b-0 hover:bg-foreground/[0.02] transition-colors duration-300 -mx-6 md:-mx-8 px-6 md:px-8"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <h3 className="text-lg md:text-xl font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                                                        {getLocalizedText(meal.name)}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                                                        {getLocalizedText(meal.description)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-foreground/5 px-2.5 py-1.5 rounded shrink-0 w-fit">
                                                    <Clock size={12} className="text-primary" />
                                                    {prepTime} {t("MIN")}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-5 bg-background border border-foreground/5 rounded-xl p-4 md:p-5">
                                                <div className="md:col-span-5 flex flex-col">
                                                    <span className="flex items-center gap-1.5 uppercase tracking-widest text-[9px] font-black text-muted-foreground/50 mb-2">
                                                        <ChefHat size={12} />
                                                        {t("Target Ingredients")}
                                                    </span>
                                                    <ul className="flex flex-wrap gap-2">
                                                        {keyIngredients.map((ing: any, iIndex: number) => (
                                                            <li key={iIndex} className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                                                                {getLocalizedText(ing)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="md:col-span-7 flex flex-col">
                                                    <span className="uppercase tracking-widest text-[9px] font-black text-muted-foreground/50 mb-2">
                                                        {t("Quick Instructions")}
                                                    </span>
                                                    <p className="text-xs md:text-sm text-foreground/80 leading-relaxed font-light">
                                                        {getLocalizedText(meal.instructions)}
                                                    </p>
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