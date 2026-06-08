import { useState, useEffect, useRef } from 'react';
import { ImageCropperModal } from "@/components/image-cropper-modal.tsx";
import {
    Mail, Calendar, Camera, Save, RefreshCw, Star, Users, Stethoscope, Banknote
} from 'lucide-react';
import { useUser } from "@/hooks/use-user.ts";
import { Container } from "@/components/container";
import { Gender } from "@/models/profile-model.ts";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatDateMs, formatDateUnix } from "@/utils/form-data.ts";
import { toast } from "sonner";
import {doctorService} from "@/services/doctor-service.ts";
import { t } from "i18next";
import type {DoctorProfileI} from "@/models/doctor-model.ts";

const DoctorProfileSchema = z.object({
    name: z.string().trim().min(2, { message: t("Name is required and must be at least 2 characters") }),
    age: z.string().refine((val) => val !== "", { message: t("Age is required") })
        .refine((val) => Number(val) > 0 && Number(val) <= 120, { message: t("Please enter a valid age") }),
    gender: z.string().min(1, { message: t("Gender is required")}),
    price: z.string()
        .refine((val) => val.trim() !== "", { message: t("Consultation price is required") })
        .refine((val) => Number(val) > 0, { message: t("Price must be greater than 0") }),
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
        formState: { errors },
    } = useForm<DoctorProfileFormValues>({
        resolver: zodResolver(DoctorProfileSchema),
        defaultValues: { name: '', age: '', gender: '', price: '', bio: '' }
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
                    setValue('name', '');
                    setValue('age', '');
                    setValue('gender', '');
                    setValue('price', '');
                    setValue('bio', '');
                    return;
                }

                setProfile(profileData);
                setValue('name', profileData.name || '');
                setValue('age', profileData.age?.toString() || '');
                setValue('gender', profileData.gender || '');
                setValue('price', profileData.price?.toString() || '');
                setValue('bio', profileData.bio || '');
            } catch (error) {
                setProfile(null);
                setValue('name', '');
                setValue('age', '');
                setValue('gender', '');
                setValue('price', '');
                setValue('bio', '');
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
                name: data.name,
                age: Number(data.age),
                gender: data.gender as Gender,
                price: Number(data.price),
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

            setValue('name', mergedProfile.name || '');
            setValue('age', mergedProfile.age.toString());
            setValue('gender', mergedProfile.gender);
            setValue('price', mergedProfile.price.toString());
            setValue('bio', mergedProfile.bio || '');

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

    if (loadingProfile) {
        return (
            <div className="min-h-screen bg-secondary-foreground pt-32 pb-20 flex items-center justify-center">
                <RefreshCw className="animate-spin text-primary w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary-foreground pt-24 pb-20 text-secondary">
            <Container>
                <div className="max-w-6xl mx-auto">
                    {imageToCrop && (
                        <ImageCropperModal
                            image={imageToCrop}
                            onClose={() => setImageToCrop(null)}
                            onConfirm={handleCropSuccess}
                        />
                    )}

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

                                <div className="w-28 h-28 rounded-3xl bg-secondary flex items-center justify-center overflow-hidden border-2 border-primary/20">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Doctor Avatar" className="w-full h-full object-cover" />
                                    ) : profile?.avatarUrl ? (
                                        <img src={profile.avatarUrl} alt="Doctor Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-light text-secondary-foreground/30 uppercase">
                                            {user?.nameInitial}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCameraClick}
                                    className="absolute -bottom-2 -right-2 p-3 bg-primary text-secondary rounded-xl shadow-xl hover:bg-primary/80 transition-colors cursor-pointer"
                                >
                                    <Camera size={16} />
                                </button>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-4xl font-bold tracking-tight capitalize text-secondary">
                                        {profile?.name ? profile.name : `Dr. ${user?.givenName || ''} ${user?.familyName || ''}`}
                                    </h1>
                                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <Stethoscope size={12} /> Specialist
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 font-medium tracking-wide flex items-center gap-2">
                                    <Mail size={14} className="text-primary" /> {user?.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-secondary rounded-3xl p-6 shadow-lg border border-secondary/10">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-foreground/40 mb-6">
                                    {t("Performance Metrics")}
                                </h4>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-secondary-foreground/5 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                                <Star size={18} className="fill-primary" />
                                            </div>
                                            <p className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">
                                                {t("Rating")}
                                            </p>
                                        </div>
                                        <p className="text-xl font-black text-secondary-foreground">
                                            {profile?.averageRating?.toFixed(1) || "5.0"}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-secondary-foreground/5 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                                <Users size={18} />
                                            </div>
                                            <p className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">
                                                {t("Reviews")}
                                            </p>
                                        </div>
                                        <p className="text-xl font-black text-secondary-foreground">
                                            {profile?.totalReviews || 0}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-secondary-foreground/5 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                                <Banknote size={18} />
                                            </div>
                                            <p className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">
                                                {t("Current Rate")}
                                            </p>
                                        </div>
                                        <p className="text-lg font-black text-secondary-foreground">
                                            {profile?.price !== undefined && profile?.price !== null && Number(profile.price) > 0
                                                ? `${profile.price} RON`
                                                : t("Not set")}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {profile?.createdAt && (
                                <div className="bg-secondary rounded-3xl p-6 shadow-lg border border-secondary/10">
                                    <div className="flex flex-col gap-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-secondary-foreground/5 rounded-xl text-secondary-foreground/60">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-secondary-foreground/40 uppercase tracking-wider">
                                                    {t("Member Since")}
                                                </p>
                                                <p className="text-sm font-semibold text-secondary-foreground">
                                                    {formatDateMs(profile.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-secondary-foreground/5 rounded-xl text-secondary-foreground/60">
                                                <RefreshCw size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-secondary-foreground/40 uppercase tracking-wider">
                                                    {t("Last Login")}
                                                </p>
                                                <p className="text-sm font-semibold text-secondary-foreground">
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
                                className="bg-secondary p-8 rounded-3xl shadow-lg border border-secondary/10 h-full"
                            >
                                <div className="border-b border-secondary-foreground/10 pb-5 mb-8">
                                    <h3 className="text-2xl font-bold tracking-tight text-secondary-foreground">
                                        {isCreateMode ? t("Set Up Specialist Profile") : t("Edit Profile")}
                                    </h3>
                                    <p className="text-sm text-secondary-foreground/60 mt-1">
                                        {t("This information will be displayed publicly to your patients.")}
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground/60">
                                            {t("Full Name")}
                                        </label>
                                        <input
                                            type="text"
                                            {...register("name")}
                                            className="px-4 py-3.5 rounded-xl border-2 border-secondary-foreground/10 bg-transparent text-sm focus:outline-none focus:border-primary transition-colors text-secondary-foreground w-full font-medium"
                                            placeholder={t("e.g. Dr. Jane Doe")}
                                        />
                                        {errors.name && <p className="text-xs text-destructive font-medium">{errors.name.message}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground/60">
                                                {t("Age")}
                                            </label>
                                            <input
                                                type="number"
                                                {...register("age")}
                                                className="px-4 py-3.5 rounded-xl border-2 border-secondary-foreground/10 bg-transparent text-sm focus:outline-none focus:border-primary transition-colors text-secondary-foreground w-full font-medium"
                                                placeholder={t("e.g. 35")}
                                            />
                                            {errors.age && <p className="text-xs text-destructive font-medium">{errors.age.message}</p>}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground/60">
                                                {t("Gender")}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    {...register("gender")}
                                                    className="px-4 py-3.5 rounded-xl border-2 border-secondary-foreground/10 bg-transparent text-sm focus:outline-none focus:border-primary transition-colors text-secondary-foreground w-full appearance-none font-medium"
                                                >
                                                    <option value="" disabled>{t("Select gender")}</option>
                                                    <option value={Gender.FEMININE}>{t("Feminine")}</option>
                                                    <option value={Gender.MASCULINE}>{t("Masculine")}</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-primary">
                                                    ▼
                                                </div>
                                            </div>
                                            {errors.gender && <p className="text-xs text-destructive font-medium">{errors.gender.message}</p>}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground/60">
                                                {t("Consultation Price")}
                                            </label>
                                            <div className="relative flex items-center">
                                                <input
                                                    type="number"
                                                    {...register("price")}
                                                    className="px-4 py-3.5 rounded-xl border-2 border-secondary-foreground/10 bg-transparent text-sm focus:outline-none focus:border-primary transition-colors text-secondary-foreground w-full font-medium pr-14"
                                                    placeholder={t("e.g. 200")}
                                                />
                                                <span className="absolute right-4 text-xs font-bold text-secondary-foreground/40">
                                                    RON
                                                </span>
                                            </div>
                                            {errors.price && <p className="text-xs text-destructive font-medium">{errors.price.message}</p>}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-secondary-foreground/60">
                                            {t("Professional Bio")}
                                        </label>
                                        <textarea
                                            {...register("bio")}
                                            rows={5}
                                            className="px-4 py-3.5 rounded-xl border-2 border-secondary-foreground/10 bg-transparent text-sm focus:outline-none focus:border-primary transition-colors text-secondary-foreground w-full font-medium resize-none"
                                            placeholder={t("Briefly describe your experience and specializations...")}
                                        />
                                        {errors.bio && <p className="text-xs text-destructive font-medium">{errors.bio.message}</p>}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-8 mt-8 border-t border-secondary-foreground/10">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 px-8 py-3.5 bg-primary text-secondary rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-primary/90 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                                    >
                                        {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
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