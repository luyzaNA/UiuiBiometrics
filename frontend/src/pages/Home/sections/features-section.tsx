import {LineChart, ShieldAlert, History, CheckCircle2, ListChecks, Target} from "lucide-react";
import {useTranslation} from "react-i18next";
import {useUser} from "@/hooks/use-user.ts";
import {useNavigate} from "react-router-dom";

export default function FeaturesSection() {
    const {t} = useTranslation();
    const {isAuthenticated, login} = useUser();
    const navigate = useNavigate();

    return (
        <section className="relative min-h-screen w-full bg-secondary-foreground py-24 px-6 overflow-hidden font-sans border-t border-secondary/5">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,#ad7bbd05_0%,transparent_70%)]" />
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                            <History className="w-4 h-4" />
                            <span className="text-[10px] font-black tracking-[0.4em] uppercase">{t("Continuous monitoring")}</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-secondary leading-none">
                            {t("EVOLUTION,")} <br /> <span className="text-secondary/20">{t("NOT JUST ANALYSIS.")}</span>
                        </h2>
                    </div>
                    <p className="text-secondary/40 text-sm max-w-sm text-right font-medium">
                        {t("A support system that evolves with your daily progress, protecting your health through dedicated safety protocols.")}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-secondary/[0.03] border border-secondary/10 rounded-3xl p-8 flex flex-col justify-between group hover:border-primary transition-all">
                        <div>
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                                <LineChart className="text-primary w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-secondary mb-4 italic">
                                {t("Evolution Journal")}
                            </h3>
                            <p className="text-secondary/50 text-sm leading-relaxed">
                                {t("Track symptoms daily and visualize how your micronutrient levels return to their optimal range.")}
                            </p>
                        </div>
                        <div className="mt-8 flex items-end gap-2 h-16">
                            {[40, 60, 45, 90, 65, 80, 100].map((h, i) => (
                                <div key={i} className="flex-1 bg-secondary rounded-t-sm relative overflow-hidden">
                                    <div
                                        className="absolute bottom-0 w-full bg-primary transition-all duration-1000 delay-300"
                                        style={{ height: `${h}%`, opacity: i === 6 ? 1 : 0.3 }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-secondary/[0.03] border border-secondary/10 rounded-3xl p-8 relative overflow-hidden group hover:border-primary/40 transition-all">
                        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ListChecks className="w-32 h-32 text-secondary" />
                        </div>
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                            <Target className="text-primary w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-secondary mb-4 italic">
                            {t("Flexible Generation")}
                        </h3>
                        <p className="text-secondary/50 text-sm leading-relaxed mb-6">
                            {t("Choose what fits you best: generate a precise list of ingredients optimized to fix multiple deficiencies simultaneously, or get a complete, structured daily menu.")}
                        </p>
                        <div className="space-y-3">
                            {[
                                t("Targeted Ingredients"),
                                t("Complete Menus"),
                                t("Maximum Coverage")
                            ].map((tag) => (
                                <div
                                    key={tag}
                                    className="flex items-center gap-2 text-[10px] font-bold text-secondary/40 uppercase tracking-widest bg-secondary/5 w-fit px-3 py-1 rounded-full border border-secondary/5">
                                    <CheckCircle2 className="w-3 h-3 text-primary" /> {tag}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-destructive/10 to-transparent border border-destructive/20 rounded-3xl p-8 relative flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-destructive/20 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                                <ShieldAlert className="text-destructive w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-secondary mb-4 italic">{t("Safety First")}</h3>
                            <p className="text-secondary/50 text-sm leading-relaxed">
                            {t("If your symptoms are detected as ")}<span className="text-destructive font-bold uppercase">{t("Severe")}</span>, {t("the system automatically generates a note for a specialist consultation.")}
                            </p>
                        </div>
                        <div className="mt-6 p-4 bg-destructive/5 border border-destructive/10 rounded-xl">
                            <span className="text-[9px] font-black text-destructive tracking-widest uppercase block mb-1">{t("Alert Status:")}</span>
                            <span className="text-[11px] text-secondary/70 font-mono">{t("PHYSICIAN REFERRAL RECOMMENDED")}</span>
                        </div>
                    </div>

                </div>
                <div className="mt-12 p-8 bg-secondary/[0.02] border border-secondary/5 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <div className="space-y-1">
                        <h4 className="text-secondary font-bold uppercase tracking-tighter">{t("Ready to reclaim your energy?")}</h4>
                        <p className="text-secondary/30 text-[10px] uppercase tracking-widest">{t("Over 10 micronutrient combinations analyzed.")}</p>
                    </div>
                    <button
                        onClick={() => {
                            if (isAuthenticated) {
                                navigate('/quiz');
                                window.scrollTo(0, 0);
                            } else {
                                login();
                            }
                        }}
                        className="px-10 py-4 bg-secondary text-secondary-foreground font-black text-[10px] tracking-[0.3em] rounded-full hover:bg-primary hover:text-secondary hover:cursor-pointer transition-all transform hover:-translate-y-1 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                            {t("START EVALUATION NOW")}
                    </button>
                </div>
            </div>
        </section>
    );
}