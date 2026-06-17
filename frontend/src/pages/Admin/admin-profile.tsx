import { useState, useEffect, useRef } from 'react';
import { ImageCropperModal } from "@/components/image-cropper-modal.tsx";
import {
    Mail,
    Calendar,
    Camera,
    Save,
    History,
    RefreshCw,
    ArrowRight,
    Shield,
    User as UserIcon
} from 'lucide-react';
import { useUser } from "@/hooks/use-user.ts";
import { Container } from "@/components/container";
import { Gender, type ProfileI } from "@/models/profile-model.ts";
import { profileService } from "@/services/profile-service.ts";
import { useTranslation } from "react-i18next";
import { t } from "i18next";
import { z } from "zod";
import {Controller, useForm} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { formatDateMs, formatDateUnix } from "@/utils/form-data.ts";
import { toast } from "sonner";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";

const AdminProfileSchema = z.object({
    fullName: z.string().min(2, {
        message: t("Full name must be at least 2 characters"),
    }),
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

type AdminProfileFormValues = z.infer<typeof AdminProfileSchema>;

export default function AdminProfilePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useUser();

    const lastLogin = formatDateUnix(user?.auth_time);

    const [profile, setProfile] = useState<ProfileI | null>(null);
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
        control,
        formState: { errors },
    } = useForm<AdminProfileFormValues>({
        resolver: zodResolver(AdminProfileSchema),
        defaultValues: {
            fullName: '',
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
                    setValue('fullName', '');
                    setValue('age', '');
                    setValue('gender', '');
                    return;
                }

                setProfile(profileData);
                setValue('fullName', profileData.fullName || (profileData as any).full_name || '');
                setValue('age', profileData.age?.toString() || '');
                setValue('gender', profileData.gender || '');
            } catch (error) {
                setProfile(null);
                setValue('fullName', '');
                setValue('age', '');
                setValue('gender', '');
            } finally {
                setLoadingProfile(false);
            }
        };
        loadProfile();
    }, [user?.id, setValue]);

    const onSubmit = async (data: AdminProfileFormValues) => {
        try {
            setSaving(true);

            const payload = {
                full_name: data.fullName,
                age: Number(data.age),
                gender: data.gender as Gender,
                avatar: avatarBase64 || undefined,
            };

            let savedProfile;

            if (profile?.profileId) {
                savedProfile = await profileService.update(profile.profileId, payload);
            } else {
                savedProfile = await profileService.create(payload);
            }

            setProfile(savedProfile);
            setValue('fullName', savedProfile.fullName || (savedProfile as any).full_name || '');
            setValue('age', savedProfile.age.toString());
            setValue('gender', savedProfile.gender);

            window.dispatchEvent(new CustomEvent("profile-updated", {
                detail: {
                    avatarUrl: savedProfile.avatarUrl,
                    fullName: savedProfile.fullName || (savedProfile as any).full_name || "Admin"
                }
            }));

            toast.success(profile?.profileId
                ? t("Admin profile updated successfully!")
                : t("Admin profile created successfully!"));
        } catch (error) {
            toast.error(t("Failed to save admin profile."));
        } finally {
            setSaving(false);
        }
    };

    const isCreateMode = !profile?.profileId;

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

                    <div className="flex justify-end mb-8">
                        <button
                            onClick={() => navigate("/admin/dashboard")}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-background border border-secondary/10 text-sm font-medium text-secondary hover:border-primary/40 hover:text-primary transition-all cursor-pointer shadow-sm"
                        >
                            {t("Go to admin panel")}
                            <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-background rounded-3xl p-8 shadow-sm border border-secondary/10 flex flex-col items-center text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-error/10 to-transparent pointer-events-none" />

                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                <div
                                    onClick={handleCameraClick}
                                    className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-lg mb-5 group cursor-pointer bg-secondary/5 flex items-center justify-center"
                                >
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Admin" className="w-full h-full object-cover" />
                                    ) : profile?.avatarUrl ? (
                                        <img src={profile.avatarUrl} alt="Admin" className="w-full h-full object-cover" />
                                    ) : (
                                        <Shield className="w-12 h-12 text-secondary/30" />
                                    )}

                                    <div className="absolute inset-0 bg-secondary-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1 text-white">
                                        <Camera size={24} />
                                        <span className="text-xs font-medium">{t("Change")}</span>
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-foreground mb-1 capitalize">
                                    {profile?.fullName || (profile as any)?.full_name || user?.givenName || t("Administrator")}
                                </h2>

                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/10 text-error text-[10px] font-black uppercase tracking-wider mb-3">
                                    <Shield size={12} />
                                    {t("System Admin")}
                                </span>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground w-full justify-center bg-secondary/5 py-2 rounded-xl mt-1">
                                    <Mail size={14} className="text-primary/60" />
                                    <span className="truncate max-w-[200px]">{user?.email}</span>
                                </div>
                            </div>

                            <div className="bg-background rounded-3xl p-6 shadow-sm border border-secondary/10">
                                <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-5 px-1">
                                    {t("Account Activity")}
                                </h4>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-4 p-3.5 bg-secondary/5 rounded-2xl border border-secondary/5">
                                        <div className="p-2.5 bg-background rounded-xl text-secondary/60 shadow-sm">
                                            <History size={16} />
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

                                    {profile?.createdAt && (
                                        <div className="flex items-center gap-4 p-3.5 bg-secondary/5 rounded-2xl border border-secondary/5">
                                            <div className="p-2.5 bg-background rounded-xl text-secondary/60 shadow-sm">
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
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8">
                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                className="bg-background p-6 sm:p-10 rounded-3xl shadow-sm border border-secondary/10 h-full flex flex-col"
                            >
                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold text-foreground">
                                        {isCreateMode ? t("Set Up Admin Profile") : t("Admin Settings")}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {t("Manage your administrator account details.")}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-semibold text-foreground uppercase tracking-wide px-1">
                                            {t("Full Name")}
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-secondary/40">
                                                <UserIcon size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                {...register("fullName")}
                                                className="w-full pl-11 pr-4 py-3 bg-secondary/5 border border-secondary/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-foreground"
                                                placeholder={t("e.g. Admin Name")}
                                            />
                                        </div>
                                        {errors.fullName && (
                                            <p className="text-xs text-destructive font-medium px-1">
                                                {errors.fullName.message}
                                            </p>
                                        )}
                                    </div>

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
                                        {errors.age && (
                                            <p className="text-xs text-destructive font-medium px-1">
                                                {errors.age.message}
                                            </p>
                                        )}
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

                                <div className="mt-10 pt-6 border-t border-secondary/10 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-8 py-3 bg-primary/80 text-secondary rounded-xl font-semibold text-sm shadow-sm hover:bg-primary/90 hover:shadow transition-all disabled:opacity-70 cursor-pointer"
                                    >
                                        {saving ? (
                                            <RefreshCw size={18} className="animate-spin" />
                                        ) : (
                                            <Save size={18} />
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