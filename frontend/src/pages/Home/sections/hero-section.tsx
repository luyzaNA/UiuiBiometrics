import { Activity, Fingerprint, ShieldCheck, Target, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { rotateAnimation } from "@/utils/animations";

export default function HeroSection() {
    const { t } = useTranslation();

    const floatPoints = [
        { icon: Activity, label: t("Live"), top: "5%", left: "95%" },
        { icon: ShieldCheck, label: t("Secured"), top: "85%", left: "95%" },
        { icon: Target, label: "99.2%", top: "90%", left: "5%" },
        { icon: Zap, label: t("Peak Mind"), top: "10%", left: "0%" }
    ];

    return (
        <section className="relative h-[90dvh] w-full bg-secondary-foreground flex items-center justify-center overflow-hidden font-sans">
            <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
                <div className="absolute w-[30vmin] h-[30vmin] bg-primary/15 rounded-full animate-ping" style={{ animationDuration: '4s' }} />
                <div className="absolute w-[60vmin] h-[60vmin] bg-primary/05 rounded-full animate-ping" style={{ animationDuration: '6s' }} />
                <div className="absolute w-[80vmin] h-[80vmin] bg-primary/03 rounded-full animate-ping" style={{ animationDuration: '8s' }} />
                <div className="relative w-[85vmin] h-[85vmin] flex items-center justify-center">
                    <div className="w-full h-full rounded-full border border-secondary/5 relative">
                        <motion.div
                            variants={rotateAnimation}
                            animate="animate"
                            className="absolute top-1/2 left-1/2 w-1/2 h-[80px] bg-gradient-to-r from-primary/20 to-transparent origin-left blur-xl"
                        />
                        {/* Solid Line */}
                        <motion.div
                            variants={rotateAnimation}
                            animate="animate"
                            className="absolute top-1/2 left-1/2 w-1/2 h-[1px] bg-primary/40 origin-left"
                        />
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex items-center justify-center">
                <div className="relative w-[300px] h-[300px] md:w-[480px] md:h-[480px] flex flex-col items-center justify-center">
                    <div className="absolute inset-0 bg-secondary/[0.03] backdrop-blur-2xl rounded-full border border-secondary/10 shadow-[0_0_100px_rgba(173,123,189,0.2)] group hover:scale-105 transition-transform duration-1000" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-full border border-primary/20 animate-pulse" />
                    <div className="relative z-20 text-center px-12 space-y-6">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-secondary/5 rounded-2xl border border-secondary/10">
                                <Fingerprint className="w-8 h-8 text-primary animate-pulse" />
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-secondary tracking-tighter leading-tight uppercase">
                            {t("stop")} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-foreground italic uppercase">
                                {t("guessing")}.
                            </span>
                        </h1>

                        <p className="text-secondary/40 text-xs md:text-sm font-bold uppercase tracking-[0.2em] max-w-[200px] mx-auto">
                            {t("Biometric decode in ")} <span className="text-secondary">{t("seconds")}</span>
                        </p>

                        <div className="pt-4">
                            <button className="group relative px-8 py-4 bg-primary text-secondary rounded-full font-black text-[10px] tracking-[0.3em] overflow-hidden transition-all hover:cursor-pointer">
                                <span className="relative z-10 uppercase">{t("initiate scan")}</span>
                                <div className="absolute inset-0 bg-secondary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                            </button>
                        </div>
                    </div>
                </div>

                {floatPoints.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                            opacity: 1,
                            y: [0, -15, 0],
                        }}
                        transition={{
                            opacity: { duration: 1, delay: i * 0.2 },
                            y: {
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.5
                            }
                        }}
                        className="absolute hidden lg:flex flex-col items-center gap-2"
                        style={{ top: item.top, left: item.left }}
                    >
                        <div className="p-4 bg-secondary/[0.02] backdrop-blur-md rounded-2xl border border-secondary/5 group hover:border-primary/50 transition-colors duration-500">
                            <item.icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-[8px] font-black text-secondary/30 uppercase tracking-widest">
                            {item.label}
                        </span>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}