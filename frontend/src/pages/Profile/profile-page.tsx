import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Mail,
    Calendar,
    Camera,
    Save,
    User as UserIcon,
    History,
    RefreshCw,
    UserPlus,
    ArrowRight
} from 'lucide-react';
import { useUser } from "@/hooks/use-user.ts";
import { Container } from "@/components/container";
import {Gender, type ProfileI} from "@/models/profile-model.ts";
import {profileService} from "@/services/profile-service.ts";
import {useTranslation} from "react-i18next";
import {t} from "i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {useNavigate} from "react-router-dom";
import {formatDate} from "@/utils/form-data.ts";

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
    const {t} = useTranslation();
    const { user } = useUser();

    const derivedFirstName =
        user?.firstName ||
        user?.email?.split("@")[0].match(/^[a-zA-Z]+/)?.[0] ||
        "User";

    const lastLogin = formatDate(user?.auth_time);

    const [profile, setProfile] = useState<ProfileI>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [saving, setSaving] = useState(false);

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
            } {
                setLoadingProfile(false);
            }
        };
        loadProfile();
    }, [user?.id, user?.accessToken, setValue]);

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            setSaving(true);

            const payload = {
                age: Number(data.age),
                gender: data.gender as typeof Gender[keyof typeof Gender],
            };

            let savedProfile;

            if (profile?.profileId) {
                savedProfile = await profileService.update(
                    profile.profileId,
                    payload
                );
            } else {
                savedProfile = await profileService.create(payload);
            }

            setProfile(savedProfile);
            setValue('age', savedProfile.age.toString());
            setValue('gender', savedProfile.gender);

            alert(profile?.profileId
                ? "Profile updated successfully!"
                : "Profile created successfully!");
        } catch (error) {
            console.error("Failed to save profile:", error);
            alert("Failed to save profile.");
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-2xl bg-secondary border border-secondary-foreground/5 shadow-sm flex items-center justify-center overflow-hidden">
                                    {user?.picture ? (
                                        <img
                                            src={user.picture}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl font-light tracking-tighter text-secondary-foreground/40 uppercase">
                                            {derivedFirstName.charAt(0)}
                                        </span>
                                    )}
                                </div>
                                <button className="absolute -bottom-2 -right-2 p-2 bg-secondary-foreground text-secondary rounded-xl shadow-xl hover:bg-primary transition-colors">
                                    <Camera size={14} />
                                </button>
                            </div>

                            <div>
                                <h1 className="text-4xl font-medium tracking-tight mb-1 capitalize">
                                    {`${derivedFirstName} ${user?.lastName || ''}`}
                                </h1>
                                <p className="text-sm text-secondary-foreground/40 font-medium tracking-wide flex items-center gap-2">
                                    <Mail size={12} /> {user?.email}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate("/")}
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
                                        <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center text-info">
                                            <History size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-secondary-foreground40">
                                                {t("Last Login")}
                                            </span>
                                            <span className="text-xs font-semibold text-secondary-foreground/70">
                                                {lastLogin}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-secondary border border-secondary-foreground/5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                                            <RefreshCw size={18} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-secondary-foreground/40">
                                                {t("Profile Sync")}
                                            </span>
                                            <span className="text-xs font-semibold text-secondary-foreground/70">
                                                {profile?.updatedAt
                                                    ? formatDate(profile.updatedAt)
                                                    : "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="lg:col-span-8">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-secondary rounded-[32px] p-10 border border-secondary-foreground/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
                            >
                                <div className="mb-8">
                                    <h3 className="text-xl font-semibold tracking-tight">
                                        {isCreateMode
                                            ? t("Complete Your Profile")
                                            : t("Personal Profile")
                                        }
                                    </h3>

                                    {isCreateMode && (
                                        <p className="text-sm text-secondary-foreground/40 mt-1">
                                            {t("Please provide a few details to personalize your experience.")}
                                        </p>
                                    )}
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground/40 ml-1 flex items-center gap-2">
                                                <Calendar size={12} />
                                                {t("Age")}
                                            </label>

                                            <input
                                                type="number"
                                                placeholder={t("e.g. 25")}
                                                className="w-full bg-transparent border-b border-secondary-foreground/10 pb-3 text-lg font-medium focus:outline-none focus:border-secondary-foreground transition-colors outline-none placeholder:text-secondary-foreground/10"
                                                {...register("age")}
                                            />
                                            {errors.age && (
                                                <p className="text-xs font-medium text-destructive mt-1 ml-1">
                                                    {t(errors.age.message as string)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground/40 ml-1 flex items-center gap-2">
                                                <UserIcon size={12} />
                                                {t("Gender")}
                                            </label>

                                            <select
                                                className="w-full bg-transparent border-b border-secondary-foreground/10 pb-3 text-lg font-medium focus:outline-none focus:border-secondary-foreground transition-colors cursor-pointer appearance-none outline-none"
                                                {...register("gender")}
                                            >
                                                <option value="" disabled>
                                                    {t("Select Identity")}
                                                </option>
                                                <option value={Gender.FEMININE}>
                                                    {t("Female")}
                                                </option>
                                                <option value={Gender.MASCULINE}>
                                                    {t("Male")}
                                                </option>
                                            </select>
                                            {errors.gender && (
                                                <p className="text-xs font-medium text-destructive mt-1 ml-1">
                                                    {t(errors.gender.message as string)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="group flex items-center gap-3
                                                bg-primary text-secondary
                                                px-8 py-4
                                                rounded-full
                                                font-semibold
                                                shadow-xl shadow-primary/25
                                                hover:bg-primary/90
                                                hover:shadow-2xl hover:shadow-primary/30
                                                hover:-translate-y-0.5
                                                active:scale-95
                                                transition-all duration-300
                                                cursor-pointer
                                                disabled:opacity-50 disabled:cursor-not-allowed
                                                "
                                    >
                                        {isCreateMode ? (
                                            <UserPlus
                                                size={18}
                                                className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
                                            />
                                        ) : (
                                            <Save
                                                size={18}
                                                className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"
                                            />
                                        )}

                                        <span className="text-sm font-bold uppercase tracking-[0.15em]">
                                            {saving
                                                ? t("Saving...")
                                                : isCreateMode
                                                    ? t("Create Profile")
                                                    : t("Save Changes")
                                            }
                                        </span>
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    );
}