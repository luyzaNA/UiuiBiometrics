import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from "react-i18next";
import { ArrowLeft, Star, MessageSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { doctorService, type ReviewI } from "@/services/doctor-service.ts";
import type { DoctorProfileI } from "@/models/doctor-model.ts";
import {formatChartFullDate} from "@/utils/form-data.ts";

export default function DoctorReviews() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<DoctorProfileI | null>(null);
    const [reviews, setReviews] = useState<ReviewI[]>([]);
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReviewsData = async () => {
            try {
                setIsLoading(true);
                const profileData = await doctorService.getMe();

                const doctorId = profileData.cognitoSub;

                if (doctorId) {
                    const fullData = await doctorService.getById(doctorId);

                    setProfile(fullData.profile);

                    const sortedReviews = (fullData.reviews || []).sort((a, b) => b.createdAt - a.createdAt);
                    setReviews(sortedReviews);
                } else {
                    setProfile(profileData);
                }
            } catch (error) {
                console.error("Error loading reviews:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReviewsData();
    }, []);

    const getInitials = (name: string) => {
        if (!name) return "U";
        const parts = name.trim().split(" ").filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };


    const totalReviewsCount = profile?.totalReviews || reviews.length || 1;

    const distribution = [5, 4, 3, 2, 1].map(stars => {
        const count = reviews.filter(r => r.rating === stars).length;
        const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
        return { stars, percentage };
    });

    const filteredReviews = reviews.filter(review => {
        if (activeFilter === "all") return true;
        if (activeFilter === "positive") return review.rating >= 4;
        if (activeFilter === "critical") return review.rating <= 3;
        return true;
    });

    return (
        <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-secondary/5 border border-secondary/10 text-primary active:scale-95 transition-transform"
                    onClick={() => navigate('/doctor/dashboard')}
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{t("Patient Feedback")}</h1>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-medium">{t("Reviews Overview")}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-secondary/[0.02] border border-secondary/5 p-8 rounded-3xl backdrop-blur-md">
                <div className="text-center md:text-left flex flex-col items-center md:items-start justify-center space-y-2">
                    <span className="text-6xl font-black text-foreground tracking-tighter">
                        {profile?.averageRating?.toFixed(1) || "0.0"}
                    </span>
                    <div className="flex gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-5 h-5 ${star <= Math.round(profile?.averageRating || 0) ? 'fill-current' : 'text-muted-foreground/20'}`}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider pt-2">
                        {t("Based on {{count}} ratings", { count: totalReviewsCount })}
                    </p>
                </div>

                <div className="md:col-span-2 space-y-2 w-full">
                    {distribution.map((row) => (
                        <div key={row.stars} className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                            <span className="w-3 text-right font-bold">{row.stars}</span>
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
                            <div className="flex-1 h-2 bg-secondary/5 border border-secondary/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all duration-1000"
                                    style={{ width: `${row.percentage}%` }}
                                />
                            </div>
                            <span className="w-8 text-right text-foreground/70 font-semibold">{row.percentage}%</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2 border-b border-secondary/5 pb-4 overflow-x-auto whitespace-nowrap scrollbar-none">
                {[
                    { id: 'all', label: t('All reviews') },
                    { id: 'positive', label: t('Positive (4-5 ★)') },
                    { id: 'critical', label: t('Critical (≤3 ★)') }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveFilter(tab.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                            activeFilter === tab.id
                                ? 'bg-primary border-primary text-secondary shadow-[0_0_15px_rgba(232,157,245,0.25)]'
                                : 'bg-transparent border-secondary/10 text-muted-foreground hover:text-foreground hover:border-secondary/20'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">{t("Loading reviews...")}</div>
                ) : filteredReviews.length === 0 ? (
                    <div className="text-center py-16 bg-secondary/5 rounded-2xl border border-secondary/5 border-dashed">
                        <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm font-medium">{t("No reviews match the selected filter.")}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredReviews.map((review, idx) => (
                                <motion.div
                                    key={`${review.createdAt}-${idx}`}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                >
                                    <Card className="bg-secondary/5 border-secondary/10 hover:border-secondary/20 transition-all duration-300 group ">
                                        <CardContent className="p-6 space-y-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm tracking-wide">
                                                        {getInitials(review.reviewerName)}
                                                    </div>
                                                    <div>
                                                        <div className="flex gap-0.5 text-amber-400">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                <Star
                                                                    key={star}
                                                                    className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-current' : 'text-muted-foreground/10'}`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">
                                                            {formatChartFullDate(review.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-secondary/70 text-sm italic font-medium">
                                                {review.comment ? (
                                                    `"${review.comment}"`
                                                ) : (
                                                    <span className="text-secondary/70 font-normal not-italic">
                                                    {t("Rating left without a text comment.")}
                                                </span>
                                                )}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}