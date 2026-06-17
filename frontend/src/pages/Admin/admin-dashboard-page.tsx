import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from "react-i18next";
import { Users, Settings, UserCog, Quote } from 'lucide-react';

import { QUOTES_DATA, type QuoteItem } from "@/data/quotes.ts";
import { useUser } from "@/hooks/use-user.ts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ActionCard } from "@/components/action-card.tsx";
import { profileService } from "@/services/profile-service.ts";
import { adminService } from "@/services/admin-service.ts";
import type { ProfileI } from "@/models/profile-model.ts";
import { getFirstName } from "@/utils/get-first-name.ts";

interface SystemStatsI {
    totalUsers: number;
    totalDoctors: number;
}

export default function AdminDashboard() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useUser();

    const [dailyQuote, setDailyQuote] = useState<QuoteItem | null>(null);
    const [stats, setStats] = useState<SystemStatsI | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [profile, setProfile] = useState<ProfileI | null>(null);

    useEffect(() => {
        const today = new Date();
        const dateHash = today.getFullYear() + today.getMonth() + today.getDate();
        const quoteIndex = dateHash % QUOTES_DATA.length;
        setDailyQuote(QUOTES_DATA[quoteIndex]);
    }, []);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setIsLoadingStats(true);
                const data = await adminService.getUserStats();

                setStats({
                    totalUsers: data.totalUsers,
                    totalDoctors: data.doctorUsers
                });
            } catch (error) {
                console.error("Eroare la aducerea statisticilor de admin:", error);
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchDashboardStats();
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            try {
                const data = await profileService.getMe();
                setProfile(data);
            } catch (error) {
                console.error("The doctor profile could not be loaded", error);
            }
        };
        fetchProfile();
    }, [user?.id]);

    const currentDate = new Intl.DateTimeFormat(i18n.language || 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).format(new Date());

    const displayName = profile?.fullName ? getFirstName(profile?.fullName) : "Administrator";

    return (
        <div className="min-h-screen max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-4"
            >
                <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">
                        {currentDate}
                    </p>
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">
                        {`${t("Welcome,")} ${displayName}`}
                    </h1>
                </div>

                {dailyQuote && (
                    <div className="flex items-start gap-3 max-w-2xl mt-2 text-muted-foreground">
                        <Quote className="w-5 h-5 text-primary/40 shrink-0 mt-0.5" />
                        <p className="text-base sm:text-lg italic leading-relaxed">
                            "{t(dailyQuote.text)}"
                            <span className="font-semibold text-primary/80 ml-2 not-italic text-sm uppercase tracking-wider">
                                — {dailyQuote.author}
                            </span>
                        </p>
                    </div>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
                <StatCard
                    icon={Users}
                    label={t("Total Users")}
                    value={isLoadingStats ? "..." : String(stats?.totalUsers || 0)}
                    trend={isLoadingStats ? "..." : t("Total registered accounts")}
                />

                <StatCard
                    icon={UserCog}
                    label={t("Active Doctors")}
                    value={isLoadingStats ? "..." : String(stats?.totalDoctors || 0)}
                    trend={isLoadingStats ? "..." : t("Registered medical staff")}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-6">
                    {t("Administration Panel")}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ActionCard
                        icon={Users}
                        title={t("User Management")}
                        description={t("View, search, and manage all registered accounts in the system.")}
                        actionText={t("Manage Users")}
                        variant="primary"
                        onClick={() => navigate('/admin/users')}
                    />

                    <ActionCard
                        icon={Settings}
                        title={t("Profile Settings")}
                        description={t("Update your administrator profile, personal details, and preferences.")}
                        actionText={t("Edit Profile")}
                        variant="outline"
                        onClick={() => navigate('/admin/profile')}
                    />
                </div>
            </motion.div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, trend }: { icon: any, label: string, value: React.ReactNode, trend: string }) {
    return (
        <Card className="bg-secondary/5 border-secondary/10 hover:border-secondary/20 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-semibold tracking-wide text-muted-foreground whitespace-nowrap">
                    {label}
                </CardTitle>
                <Icon className="w-5 h-5 text-primary/70 shrink-0"/>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-extrabold text-foreground tracking-tight">{value}</div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">{trend}</p>
            </CardContent>
        </Card>
    );
}