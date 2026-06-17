import { useState, useEffect, useRef } from 'react';
import { ImageCropperModal } from "@/components/image-cropper-modal.tsx";
import {
    Mail, Calendar, Camera, Save, RefreshCw, Star, Users, Stethoscope, Banknote, User
} from 'lucide-react';
import { useUser } from "@/hooks/use-user.ts";
import { Container } from "@/components/container";
import { Gender } from "@/models/profile-model.ts";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {Controller, useForm} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDateMs, formatDateUnix } from "@/utils/form-data.ts";
import { toast } from "sonner";
import { doctorService } from "@/services/doctor-service.ts";
import { t } from "i18next";
import type { DoctorProfileI } from "@/models/doctor-model.ts";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";

const DoctorProfileSchema = z.object({
    fullName: z.string().trim().min(2, { message: t("Name is required and must be at least 2 characters") }),
    age: z.string().refine((val) => val !== "", { message: t("Age is required") })
        .refine((val) => Number(val) > 0 && Number(val) <= 120, { message: t("Please enter a valid age") }),
    gender: z.string().min(1, { message: t("Gender is required") }),
    bio: z.string().max(500, { message: t("Bio cannot exceed 500 characters") }).optional(),
});

type DoctorProfileFormValues = z.infer<typeof DoctorProfileSchema>;

export default function DoctorDashboardPage() {
    const { t } = useTranslation();
    const { user } = useUser();

    const [profile, setProfile] = useState<DoctorProfileI | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [saving, setSaving] = useState(false);

    const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    const lastLogin = formatDateUnix(user?.auth_time);

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<DoctorProfileFormValues>({
        resolver: zodResolver(DoctorProfileSchema),
        defaultValues: { fullName: '', age: '', gender: '', bio: '' }
    });

    const handleCameraClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const localUrl = URL.createObjectURL(file);
            setImageToCrop(localUrl);
        }
    };

    const handleCropSuccess = (base64Result: string) => {
        setAvatarPreview(base64Result);
        setAvatarBase64(base64Result);
        setImageToCrop(null);
    };

    useEffect(() => {
        const loadProfile = async () => {
            if (!user?.id) {
                setProfile(null);
                setLoadingProfile(false);
                return;
            }
            try {
                const profileData = await doctorService.getMe();
                if (!profileData) {
                    setProfile(null);
                    return;
                }

                setProfile(profileData);
                setValue('fullName', profileData.fullName || '');
                setValue('age', profileData.age?.toString() || '');
                setValue('gender', profileData.gender || '');
                setValue('bio', profileData.bio || '');
            } catch (error) {
                setProfile(null);
            } finally {
                setLoadingProfile(false);
            }
        };
        loadProfile();
    }, [user?.id, setValue]);

    const onSubmit = async (data: DoctorProfileFormValues) => {
        try {
            setSaving(true);
            const payload = {
                fullName: data.fullName,
                age: Number(data.age),
                gender: data.gender as Gender,
                bio: data.bio,
                avatar: avatarBase64 || undefined,
            };

            let savedProfile;
            if (profile?.profileId) {
                savedProfile = await doctorService.update(payload);
            } else {
                savedProfile = await doctorService.create(payload);
            }

            const mergedProfile = { ...profile, ...savedProfile };
            setProfile(mergedProfile);

            setAvatarPreview(null);
            setAvatarBase64(null);

            window.dispatchEvent(new CustomEvent("profile-updated", { detail: mergedProfile.avatarUrl }));

            toast.success(profile?.profileId
                ? t("Profile updated successfully!")
                : t("Profile created successfully!"));
        } catch (error) {
            toast.error(t("Failed to save profile."));
        } finally {
            setSaving(false);
        }
    };

    const isCreateMode = !profile?.profileId;
    const displayName = profile?.fullName || `Dr. ${user?.givenName || ''} ${user?.familyName || ''}`.trim();

    if (loadingProfile) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-secondary/60">
                    <RefreshCw className="animate-spin text-primary w-8 h-8" />
                    <span className="text-sm font-medium uppercase tracking-widest">{t("Loading Profile...")}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary/[0.02] pt-24 pb-20">
            <Container>
                <div className="max-w-6xl mx-auto">
                    {imageToCrop && (
                        <ImageCropperModal
                            image={imageToCrop}
                            onClose={() => setImageToCrop(null)}
                            onConfirm={handleCropSuccess}
                        />
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-background rounded-3xl p-8 shadow-sm border border-secondary/10 flex flex-col items-center text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                                <div
                                    onClick={handleCameraClick}
                                    className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-lg mb-5 group cursor-pointer bg-secondary/5 flex items-center justify-center"
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : profile?.avatarUrl ? (
                                        <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-12 h-12 text-secondary/30" />
                                    )}

                                    <div className="absolute inset-0 bg-secondary-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 text-white">
                                        <Camera size={24} />
                                        <span className="text-xs font-medium">{t("Change")}</span>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-foreground mb-1">
                                    {displayName}
                                </h2>
                                <div className="flex items-center gap-1.5 text-primary text-sm font-semibold mb-4 bg-primary/10 px-3 py-1 rounded-full">
                                    <Stethoscope size={14} />
                                    {t("Medical Specialist")}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground w-full justify-center bg-secondary/5 py-2 rounded-xl">
                                    <Mail size={14} className="text-primary/60" />
                                    <span className="truncate max-w-[200px]">{user?.email}</span>
                                </div>
                            </div>

                            <div className="bg-background rounded-3xl p-6 shadow-sm border border-secondary/10">
                                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-5 px-1">
                                    {t("Performance Metrics")}
                                </h4>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3.5 bg-secondary/5 rounded-2xl border border-secondary/5 hover:border-primary/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                                <Star size={16} className="fill-primary/20" />
                                            </div>
                                            <p className="text-sm font-medium text-foreground">{t("Rating")}</p>
                                        </div>
                                        <p className="text-lg font-bold text-foreground">
                                            {profile?.averageRating?.toFixed(1) || "5.0"}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between p-3.5 bg-secondary/5 rounded-2xl border border-secondary/5 hover:border-primary/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                                <Users size={16} />
                                            </div>
                                            <p className="text-sm font-medium text-foreground">{t("Reviews")}</p>
                                        </div>
                                        <p className="text-lg font-bold text-foreground">
                                            {profile?.totalReviews || 0}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between p-3.5 bg-secondary/5 rounded-2xl border border-secondary/5 hover:border-primary/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 text-primary rounded-lg">
                                                <Banknote size={16} />
                                            </div>
                                            <p className="text-sm font-medium text-foreground">{t("Rate")}</p>
                                        </div>
                                        <p className="text-md font-bold text-foreground">
                                           30 RON
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {profile?.createdAt && (
                                <div className="bg-background rounded-3xl p-6 shadow-sm border border-secondary/10">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-secondary/5 rounded-xl text-secondary/60">
                                                <Calendar size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    {t("Member Since")}
                                                </p>
                                                <p className="text-sm font-medium text-foreground mt-0.5">
                                                    {formatDateMs(profile.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-secondary/5 rounded-xl text-secondary/60">
                                                <RefreshCw size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    {t("Last Login")}
                                                </p>
                                                <p className="text-sm font-medium text-foreground mt-0.5">
                                                    {lastLogin || t("Unknown")}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-8">
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                className="bg-background p-6 sm:p-10 rounded-3xl shadow-sm border border-secondary/10 h-full flex flex-col"
                            >
                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {isCreateMode ? t("Set Up Profile") : t("Profile Settings")}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {t("This information will be displayed publicly to your patients.")}
                                    </p>
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-foreground uppercase tracking-wide px-1">
                                            {t("Full Name")}
                                        </label>
                                        <input
                                            type="text"
                                            {...register("fullName")}
                                            className="w-full px-4 py-3 bg-secondary/5 border border-secondary/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-foreground"
                                            placeholder={t("e.g. Dr. Jane Doe")}
                                        />
                                        {errors.fullName && <p className="text-xs text-destructive font-medium px-1">{errors.fullName.message}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-foreground uppercase tracking-wide px-1">
                                                {t("Age")}
                                            </label>
                                            <input
                                                type="number"
                                                {...register("age")}
                                                className="w-full px-4 py-3 bg-secondary/5 border border-secondary/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-foreground"
                                                placeholder={t("e.g. 35")}
                                            />
                                            {errors.age && <p className="text-xs text-destructive font-medium px-1">{errors.age.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-foreground uppercase tracking-wide px-1">
                                                {t("Gender")}
                                            </label>

                                            <Controller
                                                control={control}
                                                name="gender"
                                                render={({ field }) => (
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                    >
                                                        <SelectTrigger className="w-full px-4 py-6 bg-secondary/5 border border-secondary/10 rounded-xl text-base md:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
                                                            <SelectValue placeholder={t("Select gender")} />
                                                        </SelectTrigger>
                                                        <SelectContent className="z-[150]">
                                                            <SelectItem value={Gender.FEMININE}>{t("Feminine")}</SelectItem>
                                                            <SelectItem value={Gender.MASCULINE}>{t("Masculine")}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />

                                            {errors.gender && (
                                                <p className="text-xs text-destructive font-medium px-1">
                                                    {errors.gender.message}
                                                </p>
                                            )}
                                        </div>


                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-foreground uppercase tracking-wide px-1">
                                            {t("Professional Bio")}
                                        </label>
                                        <textarea
                                            {...register("bio")}
                                            rows={6}
                                            className="w-full px-4 py-3 bg-secondary/5 border border-secondary/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-foreground resize-y min-h-[120px]"
                                            placeholder={t("Briefly describe your experience, specializations, and approach to patient care...")}
                                        />
                                        <div className="flex justify-between items-center px-1">
                                            {errors.bio ? (
                                                <p className="text-xs text-destructive font-medium">{errors.bio.message}</p>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground">{t("Max 500 characters")}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 pt-6 border-t border-secondary/10 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-8 py-3 bg-primary/80 text-secondary rounded-xl font-semibold text-sm shadow-sm hover:bg-primary/90 hover:shadow transition-all disabled:opacity-70 cursor-pointer"
                                    >
                                        {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                                        {saving ? t("Saving...") : isCreateMode ? t("Create Profile") : t("Save Changes")}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}