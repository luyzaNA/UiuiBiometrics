import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Stethoscope,
    Star,
    User,
    BookOpen,
    ArrowLeft,
    CheckCircle,
    MessageSquare,
    Loader2,
    Send
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DoctorProfileI } from "@/models/doctor-model.ts";
import { doctorService, type ReviewI } from "@/services/doctor-service.ts";
import { formatDateMs } from "@/utils/form-data";

type DoctorProfilePageProps = {
    doctorId?: string;
    onBack?: () => void;
};

export default function DoctorProfilePage({ doctorId, onBack }: DoctorProfilePageProps) {
    const { t } = useTranslation();

    const [profile, setProfile] = useState<Partial<DoctorProfileI>>({});
    const [reviews, setReviews] = useState<ReviewI[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [newRating, setNewRating] = useState<number>(5);
    const [newComment, setNewComment] = useState<string>("");
    const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

    useEffect(() => {
        const fetchFullProfile = async () => {
            try {
                setIsLoading(true);

                if (doctorId) {
                    const data = await doctorService.getById(doctorId);
                    setProfile(data.profile);
                    setReviews(data.reviews || []);
                } else {
                    const fullProfile = await doctorService.getMe();
                    setProfile(fullProfile);
                }
            } catch (error) {
                console.error("Eroare la preluarea profilului:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFullProfile();
    }, [doctorId]);

    const handleAddReview = async () => {
        if (!doctorId || isSubmittingReview) return;
        try {
            setIsSubmittingReview(true);
            const addedReview = await doctorService.addReview(doctorId, {
                rating: newRating,
                comment: newComment.trim() || undefined
            });

            setReviews((prev) => [addedReview, ...prev]);

            setNewComment("");
            setNewRating(5);

            setProfile(prev => ({
                ...prev,
                totalReviews: (prev.totalReviews || 0) + 1
            }));
        } catch (error) {
            console.error("Failed to add review:", error);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 relative pb-10">

            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-start justify-center pt-20 bg-background/50 backdrop-blur-sm rounded-xl">
                    <div className="flex items-center gap-2 text-primary font-bold bg-background p-4 rounded-xl shadow-lg">
                        <Loader2 className="animate-spin" size={20} />
                        {t("Loading full profile...")}
                    </div>
                </div>
            )}

            {onBack && (
                <button
                    onClick={onBack}
                    className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary/40 hover:text-secondary transition-colors inline-flex items-center gap-2 mb-2 hover:cursor-pointer"
                >
                    <ArrowLeft size={12} /> {t("Back to list")}
                </button>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <Card className="lg:col-span-1 bg-gradient-to-br from-primary/20 to-background border border-secondary/10 shadow-2xl overflow-hidden h-fit sticky top-6">
                    <CardHeader className="flex flex-col items-center text-center pb-2">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border border-primary/30 shadow-2xl mb-4 bg-secondary/10">
                            <img
                                src={profile.avatarUrl || "/placeholder-avatar.png"}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <CardTitle className="space-y-1">
                            <h2 className="text-xl font-bold text-secondary">{profile.fullName}</h2>
                            <div className="flex items-center justify-center gap-1.5 text-primary">
                                <Stethoscope size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">{t("Verified Specialist")}</span>
                            </div>
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-4">
                        <div className="bg-secondary/5 border border-secondary/5 p-3 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Star className="text-amber-400 fill-amber-400" size={14} />
                                <span className="text-sm text-secondary/80 font-bold">{profile.averageRating?.toFixed(1) || "5.0"}</span>
                            </div>
                            <span className="text-[10px] text-secondary/40 font-medium uppercase tracking-wider">
                                {profile.totalReviews || 0} {t("reviews")}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-secondary/5 border border-secondary/5 p-2 rounded-xl text-center">
                                <p className="text-[9px] uppercase tracking-widest text-secondary/40 font-bold">{t("Age")}</p>
                                <p className="text-xs font-bold text-secondary/80 mt-0.5">{profile.age || "--"}</p>
                            </div>
                            <div className="bg-secondary/5 border border-secondary/5 p-2 rounded-xl text-center">
                                <p className="text-[9px] uppercase tracking-widest text-secondary/40 font-bold">{t("Gender")}</p>
                                <p className="text-xs font-bold mt-0.5 text-secondary/80 capitalize">{t((profile.gender || "N/A").toLowerCase())}</p>
                            </div>
                        </div>

                        <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{t("Consultation fee")}</span>
                            <span className="text-lg font-black text-secondary">{profile.price || 0} RON</span>
                        </div>
                    </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <Card className="border border-secondary/10 bg-secondary/[0.02]">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary/40">
                                <BookOpen size={14} className="text-primary" /> {t("Professional Biography")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-secondary/80 text-sm leading-relaxed">
                                {profile.bio || t("This doctor has not provided a professional biography yet.")}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border border-secondary/10 bg-secondary/[0.02]">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-secondary/40">
                                <User size={14} className="text-primary" /> {t("Platform Activity")}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary"><CheckCircle size={16} /></div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-widest text-secondary/40 font-bold">{t("In our team since")}</p>
                                    <p className="text-xs text-secondary/80 font-bold">{formatDateMs(profile.createdAt) || "--"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary"><MessageSquare size={16} /></div>
                                <div>
                                    <p className="text-[9px] uppercase tracking-widest text-secondary/40 font-bold">{t("Last updated")}</p>
                                    <p className="text-xs text-secondary/80 font-bold">{formatDateMs(profile.updatedAt) || "--"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {doctorId && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-secondary/60 flex items-center gap-2">
                                <Star size={16} className="text-primary" /> {t("Patient Reviews")}
                            </h3>

                            <Card className="border border-primary/20 bg-primary/5 shadow-sm">
                                <CardContent className="pt-6 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-secondary/60 uppercase">{t("Your Rating")}:</span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={20}
                                                    onClick={() => setNewRating(star)}
                                                    className={`cursor-pointer transition-colors ${
                                                        star <= newRating
                                                            ? "text-amber-400 fill-amber-400"
                                                            : "text-secondary/20"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={t("Share your experience with this doctor (optional)...")}
                                        className="w-full min-h-[80px] p-3 rounded-xl bg-background border border-secondary/10 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                                    />

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleAddReview}
                                            disabled={isSubmittingReview}
                                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {isSubmittingReview ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                            {t("Submit Review")}
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-3">
                                {reviews.length === 0 ? (
                                    <div className="text-center p-6 bg-secondary/5 rounded-2xl border border-secondary/10">
                                        <p className="text-sm text-secondary/40 font-medium">
                                            {t("No reviews yet. Be the first to share your experience!")}
                                        </p>
                                    </div>
                                ) : (
                                    reviews.map((review, index) => (
                                        <Card key={index} className="border border-secondary/10 bg-secondary/[0.01]">
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-bold text-secondary">{review.reviewer_name}</p>
                                                        <p className="text-[10px] text-secondary/40 font-bold uppercase tracking-wider mt-0.5">
                                                            {formatDateMs(review.created_at)}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                size={12}
                                                                className={
                                                                    star <= review.rating
                                                                        ? "text-amber-400 fill-amber-400"
                                                                        : "text-secondary/10"
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                {review.comment && (
                                                    <p className="text-sm text-secondary/80 italic border-l-2 border-primary/30 pl-3">
                                                        "{review.comment}"
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}