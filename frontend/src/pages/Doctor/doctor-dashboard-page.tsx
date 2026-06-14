import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from "react-i18next";
import { Users, ClipboardList, Settings, Activity, Quote, FileClock, Star } from 'lucide-react';

import { QUOTES_DATA, type QuoteItem } from "@/data/quotes.ts";
import { useUser } from "@/hooks/use-user.ts";
import {
    doctorService,
    type PatientsStatsI,
    type ReviewedStatsI,
    type PendingCountStatsI
} from "@/services/doctor-service.ts";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ActionCard } from "@/components/action-card.tsx";
import type { DoctorProfileI } from "@/models/doctor-model.ts";

export default function DoctorDashboard() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user } = useUser();

    const [dailyQuote, setDailyQuote] = useState<QuoteItem | null>(null);
    const [profile, setProfile] = useState<DoctorProfileI | null>(null);

    const [patientsCount, setPatientsCount] = useState<PatientsStatsI | null>(null);
    const [reviewedStats, setReviewedStats] = useState<ReviewedStatsI | null>(null);
    const [pendingCount, setPendingCount] = useState<PendingCountStatsI | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        const today = new Date();
        const dateHash = today.getFullYear() + today.getMonth() + today.getDate();
        const quoteIndex = dateHash % QUOTES_DATA.length;
        setDailyQuote(QUOTES_DATA[quoteIndex]);
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            try {
                const data = await doctorService.getMe();
                setProfile(data);
            } catch (error) {
                console.error("The doctor profile could not be loaded", error);
            }
        };
        fetchProfile();
    }, [user?.id]);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setIsLoadingStats(true);
                const [countRes, reviewedRes, pendingRes] = await Promise.all([
                    doctorService.getPatientsNumber(),
                    doctorService.getReviewedStats(),
                    doctorService.getPendingCount()
                ]);

                setPatientsCount(countRes);
                setReviewedStats(reviewedRes.data);
                setPendingCount(pendingRes.data);

            } catch (error) {
                console.error("Eroare la aducerea statisticilor de dashboard:", error);
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchDashboardStats();
    }, []);

    const currentDate = new Intl.DateTimeFormat(i18n.language || 'en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).format(new Date());

    const name = (profile?.fullName || "Doctor").replace(/^Dr\.\s*/i, "");

    const displayName = `Dr. ${name.trim().split(" ")[0]}`;

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
                        {`${t("Welcome,")}   ${displayName}`}
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
                className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
                <StatCard
                    icon={Users}
                    label={t("Active Patients")}
                    value={isLoadingStats ? "..." : String(patientsCount?.total || 0)}
                    trend={isLoadingStats ? "..." : `+${patientsCount?.lastMonth || 0} ${t("this month")}`}
                />

                <StatCard
                    icon={Activity}
                    label={t("Completed reports")}
                    value={isLoadingStats ? "..." : String(reviewedStats?.totalReviewed || 0)}
                    trend={isLoadingStats ? "..." : `+${reviewedStats?.reviewedLastWeek || 0} ${t("this week")}`}
                />

                <StatCard
                    icon={FileClock}
                    label={t("Pending Reports")}
                    value={isLoadingStats ? "..." : String(pendingCount?.pendingCount || 0)}
                    trend={t("Needs your review")}
                />

                <StatCard
                    icon={ClipboardList}
                    label={t("Rating")}
                    value={
                        !profile ? "..." : (
                            <div className="flex items-center gap-2">
                                <span>{profile.averageRating}</span>
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`w-4 h-4 ${
                                                star <= Math.round(profile.averageRating)
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-muted-foreground/20"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    }
                    trend={!profile ? "..." : t("From {{count}} total evaluations", { count: profile.totalReviews || 0 })}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-6">
                    {t("Dashboard")}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 h-full">
                        <ActionCard
                            icon={Users}
                            title={t("Patient Registry")}
                            description={t("Access medical records, view biometric analyses, and adjust protocols.")}
                            actionText={t("Open Registry")}
                            variant="primary"
                            onClick={() => navigate('/doctor/patients')}
                        />
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
                        <ActionCard
                            icon={ClipboardList}
                            title={t("Pending Reports")}
                            description={t("Check reports waiting for your medical review.")}
                            actionText={t("View Reports")}
                            variant="outline"
                            onClick={() => navigate('/doctor/review/assessments')}
                        />

                        <ActionCard
                            icon={Settings}
                            title={t("Public Profile Settings")}
                            description={t("Update your biography, expertise, and rates visible to patients.")}
                            actionText={t("Edit Profile")}
                            variant="outline"
                            onClick={() => navigate('/doctor/profile')}
                        />
                    </div>
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
                <Icon className="w-5 h-5 text-primary/70 shrink-0" />
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-extrabold text-foreground tracking-tight">{value}</div>
                <p className="text-xs text-muted-foreground mt-2 font-medium">{trend}</p>
            </CardContent>
        </Card>
    );
}