import { motion } from "framer-motion";
import { Activity, Target, Cpu } from "lucide-react";
import { useTranslation } from "react-i18next";

import ImageRO from "../../../../public/ro-mannequin.png";
import ImageEN from "../../../../public/en-mannequin.png";
export default function MannequinSection() {
    const { t, i18n } = useTranslation();
    const isRO = i18n.language === 'ro';

    return (
        <section className="relative min-h-[90vh] w-full bg-secondary-foreground flex items-center justify-center overflow-hidden py-20 px-6">
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(173,123,189,0.08),transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-8"
                >
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                        <Activity className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-primary text-[10px] font-black tracking-[0.4em] uppercase italic">
                            {t("Nutritional Exploration")}
                        </span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-secondary leading-[0.9] tracking-tighter uppercase">
                        {t("Your")} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary animate-gradient-x italic">
                            {t("INTERACTIVE")}
                        </span>
                    </h1>

                    <p className="text-secondary/50 text-lg md:text-xl max-w-md font-medium leading-relaxed">
                        {t("Understand your body's signals. Identify potential micronutrient gaps through a visual, informational experience.")}
                    </p>
                    <div className="p-4 bg-secondary/[0.03] border-l-2 border-primary/30 rounded-r-xl max-w-sm">
                        <p className="text-[10px] text-secondary/40 leading-tight uppercase tracking-wider font-bold">
                            {t("ⓘ Note: Results are for informational purposes only and do not replace professional medical advice.")}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary">
                                <Target className="w-4 h-4" />
                                <span className="text-[10px] font-black tracking-widest uppercase">{t("Guidance")}</span>
                            </div>
                            <p className="text-secondary/40 text-[11px] uppercase font-bold tracking-tighter italic">{t("Mapping Symptoms")}</p>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-primary">
                                <Cpu className="w-4 h-4" />
                                <span className="text-[10px] font-black tracking-widest uppercase">{t("Analysis")}</span>
                            </div>
                            <p className="text-secondary/40 text-[11px] uppercase font-bold tracking-tighter italic">{t("Nutritional Insights")}</p>
                        </div>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, type: "spring" }}
                    className="relative group"
                >
                    <div className="relative z-10 bg-secondary-foreground/40 backdrop-blur-2xl border border-secondary/10 p-2 rounded-[2.5rem] shadow-[0_0_80px_rgba(173,123,189,0.15)] overflow-hidden">
                        <img
                            src={isRO ? ImageRO : ImageEN}
                            alt="Symptom Scanner Preview"
                            className="w-full h-auto rounded-[2rem] transition-transform duration-700 group-hover:scale-[1.01]"
                        />
                        <motion.div
                            animate={{ top: ["0%", "100%", "0%"] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_#ad7bbd] z-20 pointer-events-none"
                        />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] border border-primary/5 rounded-full animate-[spin_20s_linear_infinite] pointer-events-none" />
                </motion.div>
            </div>
        </section>
    );
}