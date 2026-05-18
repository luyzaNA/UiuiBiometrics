import { useState, useEffect, useRef } from 'react';
import { ImageCropperModal } from "@/components/image-cropper-modal.tsx";
import {
    Mail,
    Calendar,
    Camera,
    Save,
    History,
    RefreshCw,
    ArrowRight
} from 'lucide-react';
import { useUser } from "@/hooks/use-user.ts";
import { Container } from "@/components/container";
import { Gender, type ProfileI } from "@/models/profile-model.ts";
import { profileService } from "@/services/profile-service.ts";
import { useTranslation } from "react-i18next";
import { t } from "i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { formatDateMs, formatDateUnix } from "@/utils/form-data.ts";
import { toast } from "sonner";

const ProfileSchema = z.object({
    age: z.string().refine((val) => val !== "", {
        message: "Age is required",
    }).refine((val) => {
        const num = Number(val);
        return num > 0 && num <= 120;
    }, {
        message: t("Please enter a valid age"),
    }),
    gender: z.string().min(1, {
        message: t("Gender selection is required"),
    }),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

export function ProfilePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useUser();

    const lastLogin = formatDateUnix(user?.auth_time);

    const [profile, setProfile] = useState<ProfileI>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [saving, setSaving] = useState(false);

    const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imageToCrop, setImageToCrop] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(ProfileSchema),
        defaultValues: {
            age: '',
            gender: '',
        }
    });

    const handleCameraClick = () => {
        fileInputRef.current?.click();
    };

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
                const profileData = await profileService.getMe();

                if (!profileData) {
                    setProfile(null);
                    setValue('age', '');
                    setValue('gender', '');
                    return;
                }

                setProfile(profileData);
                setValue('age', profileData.age?.toString() || '');
                setValue('gender', profileData.gender || '');
            } catch (error) {
                setProfile(null);
                setValue('age', '');
                setValue('gender', '');
            } finally {
                setLoadingProfile(false);
            }
        };
        loadProfile();
    }, [user?.id, setValue]);

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            setSaving(true);

            const payload = {
                age: Number(data.age),
                gender: data.gender as typeof Gender[keyof typeof Gender],
                avatar: avatarBase64 || undefined,
            };

            let savedProfile;

            if (profile?.profileId) {
                savedProfile = await profileService.update(profile.profileId, payload);
            } else {
                savedProfile = await profileService.create(payload);
            }

            setProfile(savedProfile);
            setValue('age', savedProfile.age.toString());
            setValue('gender', savedProfile.gender);

            window.dispatchEvent(new CustomEvent("profile-updated", { detail: savedProfile.avatarUrl }));

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

    if (loadingProfile) {
        return (
            <div className="min-h-screen bg-secondary/90 pt-32 pb-20 text-[#1a1a1a]">
                <Container>
                    <div className="max-w-5xl mx-auto text-center">
                        <p className="text-secondary-foreground/50">Loading profile...</p>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary/90 pt-32 pb-20 text-[#1a1a1a]">
            <Container>
                <div className="max-w-5xl mx-auto">
                    {imageToCrop && (
                        <ImageCropperModal
                            image={imageToCrop}
                            onClose={() => setImageToCrop(null)}
                            onConfirm={handleCropSuccess}
                        />
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                <div className="w-24 h-24 rounded-2xl bg-secondary border border-secondary-foreground/5 shadow-sm flex items-center justify-center overflow-hidden">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : profile?.avatarUrl ? (
                                        <img src={profile.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-light tracking-tighter text-secondary-foreground/40 uppercase">
                                            {user?.nameInitial}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleCameraClick}
                                    className="absolute -bottom-2 -right-2 p-2 bg-secondary-foreground text-secondary rounded-xl shadow-xl hover:bg-primary transition-colors cursor-pointer"
                                >
                                    <Camera size={14} />
                                </button>
                            </div>
                            <div>
                                <h1 className="text-4xl font-medium tracking-tight mb-1 capitalize">
                                    {user.givenName}
                                </h1>
                                <p className="text-sm text-secondary-foreground/40 font-medium tracking-wide flex items-center gap-2">
                                    <Mail size={12} /> {user?.email}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate("/dashboard")}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-secondary-foreground/10 text-xs tracking-widest hover:bg-secondary-foreground hover:text-secondary transition-all cursor-pointer"
                        >
                            {t("Go to dashboard")}
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-4 space-y-8">
                            <section>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-foreground/30 mb-6">
                                    {t("Account Activity")}
                                </h4>

                                <div className="space-y-3">
                                    <div className="p-4 rounded-2xl bg-secondary border border-secondary-foreground/5 flex items-center gap-4">
                                        <div className="p-2.5 bg-secondary-foreground/5 rounded-xl text-secondary-foreground/60">
                                            <History size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-secondary-foreground/40 uppercase tracking-wider">
                                                {t("Last Login")}
                                            </p>
                                            <p className="text-xs font-semibold text-secondary-foreground/80">
                                                {lastLogin || t("Unknown")}
                                            </p>
                                        </div>
                                    </div>

                                    {profile?.createdAt && (
                                        <div className="p-4 rounded-2xl bg-secondary border border-secondary-foreground/5 flex items-center gap-4">
                                            <div className="p-2.5 bg-secondary-foreground/5 rounded-xl text-secondary-foreground/60">
                                                <Calendar size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-secondary-foreground/40 uppercase tracking-wider">
                                                    {t("Member Since")}
                                                </p>
                                                <p className="text-xs font-semibold text-secondary-foreground/80">
                                                    {formatDateMs(profile.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        <div className="lg:col-span-8">
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                className="space-y-8 bg-secondary p-8 rounded-3xl border border-secondary-foreground/5 shadow-sm"
                            >
                                <div className="border-b border-secondary-foreground/5 pb-4">
                                    <h3 className="text-xl font-medium tracking-tight text-secondary-foreground">
                                        {isCreateMode ? t("Set Up Your Profile") : t("Edit Profile Details")}
                                    </h3>
                                    <p className="text-xs text-secondary-foreground/50 mt-1">
                                        {t("Please provide your details to personalize your experience.")}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground/60">
                                            {t("Age")}
                                        </label>
                                        <input
                                            type="number"
                                            {...register("age")}
                                            className="px-4 py-3 rounded-xl border border-secondary-foreground/10 bg-transparent text-sm focus:outline-none focus:border-primary transition-colors text-secondary-foreground w-full"
                                            placeholder={t("e.g. 25")}
                                        />
                                        {errors.age && (
                                            <p className="text-xs text-destructive font-medium mt-0.5">
                                                {errors.age.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground/60">
                                            {t("Gender")}
                                        </label>
                                        <div className="relative">
                                            <select
                                                {...register("gender")}
                                                className="px-4 py-3 rounded-xl border border-secondary-foreground/10 bg-transparent text-sm focus:outline-none focus:border-primary transition-colors text-secondary-foreground w-full appearance-none bg-secondary"
                                            >
                                                <option value="" className="text-secondary-foreground/40">{t("Select gender")}</option>
                                                <option value={Gender.FEMININE}>{t("Feminine")}</option>
                                                <option value={Gender.MASCULINE}>{t("Masculine")}</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-secondary-foreground/40">
                                                <span className="text-xs">▼</span>
                                            </div>
                                        </div>
                                        {errors.gender && (
                                            <p className="text-xs text-destructive font-medium mt-0.5">
                                                {errors.gender.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-secondary-foreground/5">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 bg-secondary-foreground text-secondary rounded-xl font-bold uppercase tracking-widest text-xs shadow-md hover:bg-primary hover:text-secondary transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                        {saving ? (
                                            <RefreshCw size={14} className="animate-spin" />
                                        ) : (
                                            <Save size={14} />
                                        )}
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