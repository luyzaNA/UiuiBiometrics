import { BrainCircuit, Utensils, Search, Microscope, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { barAnimation, rotateAnimation } from "@/utils/animations";
import { useTranslation } from "react-i18next";
import {useUser} from "@/hooks/use-user.ts";
import {useNavigate} from "react-router-dom";

export default function ProcessSection() {
    const { t } = useTranslation();
    const {isAuthenticated, login} = useUser();
    const navigate = useNavigate();


    return (
        <section className="relative min-h-screen w-full bg-secondary-foreground py-24 px-6 overflow-hidden font-sans">
            <div className="absolute inset-0 opacity-10"
                 style={{ backgroundImage: `linear-gradient(#ad7bbd 1px, transparent 1px), linear-gradient(90deg, #ad7bbd 1px, transparent 1px)`,
                     backgroundSize: '50px 50px' }} />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="mb-20 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-primary"></span>
                        <span className="text-primary text-[10px] font-black tracking-[0.5em] uppercase">{t("Core Methodology")}</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-secondary uppercase tracking-tighter">
                        {t("FROM")} <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t("SYMPTOM")}</span> <br />
                        {t("TO SOLUTION.")}
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-auto">
                    <div className="md:col-span-8 group relative bg-secondary/[0.02] border border-secondary/10 rounded-3xl p-8 overflow-hidden hover:border-primary/50 transition-all duration-700">
                        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 transition-opacity">
                            <BrainCircuit className="w-32 h-32 text-primary rotate-12" />
                        </div>

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="bg-primary/10 w-fit p-3 rounded-xl mb-6">
                                    <Search className="text-primary w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-secondary mb-4">{t("Precision symptom mapping")}</h3>
                                <p className="text-secondary/50 max-w-md leading-relaxed text-sm md:text-base">
                                    {t("More than a questionnaire. Our biometric interface visualizes your body’s unique patterns, helping you identify specific areas that require nutritional optimization.")}
                                </p>
                            </div>

                            <div className="mt-12 flex gap-4 h-24 items-end">
                                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                                    <div key={i} className="w-full bg-secondary/5 rounded-t-lg relative overflow-hidden h-full flex items-end">
                                        <motion.div
                                            custom={i}
                                            variants={barAnimation}
                                            animate="animate"
                                            className="w-full bg-primary/40 rounded-t-sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-4 group relative bg-gradient-to-b from-primary/10 to-transparent border border-secondary/10 rounded-3xl p-8 hover:border-primary/50 transition-all">
                        <Microscope className="w-10 h-10 text-primary mb-6" />
                        <h3 className="text-2xl font-bold text-secondary mb-4">{t("Deep Tech Analysis")}</h3>
                        <p className="text-secondary/50 text-sm leading-relaxed mb-8">
                            {t("The algorithm connects your age, gender, and symptoms to find the ideal mix of vitamins and minerals you need.")}
                        </p>
                        <div className="space-y-4">
                            {[t("VITAMIN_D"), t("MAGNESIUM"), 'ZINC'].map((item) => (
                                <div key={item} className="flex justify-between items-center border-b border-secondary/5 pb-2">
                                    <span className="text-[10px] text-secondary/40 font-mono">{item}</span>
                                    <span className="text-[10px] text-primary font-mono animate-pulse">{t("DETECTING...")}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="md:col-span-6 group relative bg-secondary/[0.02] border border-secondary/10 rounded-3xl p-8 hover:border-primary/50 transition-all">
                        <div className="flex items-start justify-between">
                            <div>
                                <Utensils className="w-8 h-8 text-primary mb-6" />
                                <h3 className="text-2xl font-bold text-secondary mb-4">{t("Bio-tailored nutrition")}</h3>
                                <p className="text-secondary/50 text-sm leading-relaxed">
                                    {t("Get a precise action plan: exactly what to eat and personalized recipes tailored to your needs.")}
                                </p>
                            </div>
                            <div className="hidden sm:block">
                                <motion.div
                                    variants={rotateAnimation}
                                    animate="animate"
                                    className="w-20 h-20 rounded-full border-2 border-primary/10 border-t-primary"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-6 group relative bg-primary rounded-3xl p-8 overflow-hidden transition-transform hover:scale-[1.01] duration-500">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap className="w-32 h-32 text-secondary-foreground fill-secondary-foreground" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-secondary-foreground mb-4 uppercase tracking-tighter leading-none">
                            {t("TREAT THE CAUSE,")} <br/> {t("NOT THE SYMPTOM.")}
                        </h3>

                        <p className="text-secondary-foreground/80 font-bold text-[10px] mb-8 uppercase tracking-[0.2em] leading-loose max-w-sm">
                            {t("Discover your ideal nutrient profile and start optimizing in")}
                            <span className="text-secondary-foreground font-black bg-primary-foreground/80 mx-2 px-2 py-1 rounded">
                                {t("14-30 DAYS")}
                            </span>.
                        </p>

                        <button onClick={() => {
                            if (isAuthenticated) {
                                navigate('/quiz');
                                window.scrollTo(0, 0);
                            } else {
                                login();
                            }
                        }}
                                className="relative z-10 bg-secondary-foreground text-primary px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:cursor-pointer">
                            {t("GENERATE YOUR PERSONALIZED PLAN")}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}