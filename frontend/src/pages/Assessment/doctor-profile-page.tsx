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
    Loader2
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DoctorProfileI } from "@/models/doctor-model.ts";
import { doctorService } from "@/services/doctor-service.ts";
import { formatDateMs } from "@/utils/form-data";

type DoctorProfilePageProps = {
    doctorId?: string;
    onBack?: () => void;
};

export default function DoctorProfilePage({ doctorId, onBack }: DoctorProfilePageProps) {
    const { t } = useTranslation();

    const [profile, setProfile] = useState<Partial<DoctorProfileI>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchFullProfile = async () => {
            try {
                setIsLoading(true);
                let fullProfile: DoctorProfileI;

                if (doctorId) {
                    fullProfile = await doctorService.getById(doctorId);
                } else {
                    fullProfile = await doctorService.getMe();
                }

                setProfile((prev) => ({ ...prev, ...fullProfile }));
            } catch (error) {
                console.error("Eroare la preluarea profilului:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFullProfile();
    }, [doctorId]);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 relative">

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

                <Card className="lg:col-span-1 bg-gradient-to-br from-primary/20 to-background border border-secondary/10 shadow-2xl overflow-hidden h-fit">
                    <CardHeader className="flex flex-col items-center text-center pb-2">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden border border-primary/30 shadow-2xl mb-4">
                            <img
                                src={profile.avatarUrl || "/placeholder-avatar.png"}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <CardTitle className="space-y-1">
                            <h2 className="text-xl font-bold text-secondary">{profile.name}</h2>
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

                <div className="lg:col-span-2 space-y-4">
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
                </div>
            </div>
        </div>
    );
}