import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Home, Compass, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center max-w-lg mx-auto"
            >
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                            <Compass className="w-24 h-24 text-primary/40" strokeWidth={1.5} />
                        </motion.div>
                        <div className="absolute -bottom-2 -right-4 bg-background border-2 border-primary/20 text-primary px-3 py-1 rounded-xl text-sm font-extrabold shadow-sm">
                            404
                        </div>
                    </div>
                </div>

                <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
                    {t("Oops! You seem lost.")}
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg mb-10 leading-relaxed">
                    {t("The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.")}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-primary/20 bg-secondary/5 hover:scale-105  text-primary font-medium transition-all w-full sm:w-auto hover:cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t("Go Back")}
                    </button>

                    <button
                        onClick={() => navigate("/")}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-secondary hover:bg-primary/90  hover:scale-105 font-medium transition-all shadow-sm w-full sm:w-auto hover:cursor-pointer"
                    >
                        <Home className="w-4 h-4" />
                        {t("Back to Home")}
                    </button>
                </div>
            </motion.div>

            <div className="fixed top-1/4 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
            <div className="fixed bottom-1/4 right-10 w-80 h-80 bg-info/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        </div>
    );
}