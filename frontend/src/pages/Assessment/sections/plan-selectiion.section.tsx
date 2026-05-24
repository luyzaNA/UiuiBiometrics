import { ActionCard } from "@/components/action-card.tsx";
import { Apple, Calendar, Target } from "lucide-react";
import {useTranslation} from "react-i18next";

export default function PlanSelectionSection(){
    const { t } = useTranslation();
    return (
        <div className="bg-secondary-foreground text-secondary rounded-2xl p-6 shadow-lg relative overflow-hidden">
            <div className="max-w-xl space-y-1.5 relative z-10">
                <h3 className="text-xl font-black tracking-tight">
                    {t("How do you want to address these deficiencies?")}
                </h3>
                <p className="text-secondary/70 text-sm leading-relaxed">
                    {t("Choose how you want to generate your personalized plan:")}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 relative z-10">
                <ActionCard
                    icon={Apple}
                    title={t("Targeted foods")}
                    description={t("See the exact ingredients you need.")}
                    actionText={t("View foods")}
                    variant="outline"
                    onClick={() => {console.log("Hei")}}
                />

                <ActionCard
                    icon={Calendar}
                    title={t("Integrated menu")}
                    description={t("Unify all needs in a daily menu.")}
                    actionText={t("Generate menu")}
                    variant="primary"
                    onClick={() => {console.log("Hei")}}
                />

                <ActionCard
                    icon={Target}
                    title={t("Menu + goals")}
                    description={t("Calculate calories based on your goal.")}
                    actionText={t("Calculate")}
                    variant="outline"
                    onClick={() => {console.log("Hei")}}
                />
            </div>
        </div>
    );
};