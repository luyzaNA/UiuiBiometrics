import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUser } from "@/hooks/use-user.ts";
import { profileService } from "@/services/profile-service.ts";
import { Greeting } from "@/components/greeting";
import { Daily_quote } from "@/components/daily_quote";
import {useNavigate} from "react-router-dom";

export default function DashboardPage() {
    const { t } = useTranslation();
    const { user, isAuthenticated } = useUser();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadDashboardProfile = async () => {
            if (isAuthenticated) {
                try {
                    const profileData = await profileService.getMe();
                    setAvatarUrl(profileData?.avatarUrl || null);
                } catch (error) {
                    console.error("Profile load failed", error);
                }
            }
        };
        loadDashboardProfile();

        const handleProfileUpdate = (e: Event) => {
            const customEvent = e as CustomEvent<string | null>;
            setAvatarUrl(customEvent.detail);
        };

        window.addEventListener("profile-updated", handleProfileUpdate);
        return () => window.removeEventListener("profile-updated", handleProfileUpdate);
    }, [isAuthenticated]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#030007] text-secondary flex flex-col items-center justify-center pb-16 px-6 relative overflow-hidden font-sans">

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/2 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-fuchsia-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-2xl flex flex-col gap-10 relative z-10"
            >

                <div className="flex flex-col items-center text-center gap-4">
                    <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-b from-primary/30 to-transparent rounded-full blur-sm" />
                        <div className="relative w-20 h-20 rounded-full p-[2px] bg-secondary/[0.08] border border-secondary/[0.05]">
                            <div className="w-full h-full rounded-full bg-[#0d0914] flex items-center justify-center overflow-hidden">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <span className="text-xl font-light tracking-widest text-primary uppercase">{user.nameInitial}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full flex justify-center">
                        <Greeting />
                    </div>
                </div>

                <div className="relative rounded-[24px] bg-secondary/[0.02] border border-secondary/[0.06] p-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:border-primary/20 group
                    [&_p]:text-secondary/90 [&_p]:font-light [&_p]:text-center [&_p]:text-base [&_p]:md:text-lg [&_p]:tracking-wide [&_p]:not-italic
                    [&_span]:text-primary/60 [&_span]:font-medium
                    [&_div]:bg-transparent [&_div]:border-none [&_div]:p-0 [&_div]:shadow-none
                ">
                    <div className="w-full flex justify-center mb-4">
                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                    </div>

                    <Daily_quote />

                    <div className="w-full flex justify-center mt-6">
                        <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    </div>
                </div>

                <div className="flex justify-center mt-2">
                    <motion.button
                        whileHover={{ scale: 1.01, y: -1 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => navigate('/assessments')}
                        className="group flex items-center gap-3 bg-primary/90 hover:bg-primary/96 text-secondary px-10 py-3.5 rounded-full font-medium text-xs uppercase tracking-[0.15em] shadow-[0_10px_30px_rgba(147,51,234,0.15)]  transition-all duration-300 cursor-pointer"
                    >
                        <BarChart3 className="w-3.5 h-3.5 opacity-80" />
                        <span>{t("See your graphics")}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                    </motion.button>
                </div>

            </motion.div>
        </div>
    );
}