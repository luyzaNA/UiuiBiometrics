import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Radar as RadarArea } from "recharts";
import {User, Activity, ImageIcon, Stethoscope, CheckCircle, Clock, ChevronRight, UserRound} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SYMPTOM_MAPPER } from "@/utils/symptoms_wrap.ts";
import { type AssessmentI, AssessmentStatus } from "@/models/assesment-model.ts";
import {useEffect, useState} from "react";
import DoctorProfilePage from "./doctor-profile-page";
import {profileService} from "@/services/profile-service.ts";
import type {DoctorProfileI} from "@/models/doctor-model.ts";
import {getFirstName} from "@/utils/get-first-name.ts";

type AssessmentPageProps = {
    data: AssessmentI;
};

export default function AssessmentPage({ data }: AssessmentPageProps) {
    const { t } = useTranslation();
    console.log("Data este", data);
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
    const [profile, setProfile] = useState<Partial<DoctorProfileI>>({});

    const deficiencyData = Object.entries(
        data.predictedDeficiencies || {}
    ).map(([key, value]) => ({
        subject: t(key).toUpperCase(),
        value: Number(value) * 100,
    }));

    const symptoms = Object.entries(
        data.symptoms || {}
    ).sort(
        (a, b) => Number(b[1]) - Number(a[1])
    );

    const images = data.imageUrls || (data as any).image_urls || [];

    useEffect(() => {
        const fetchProfile = async () => {
            try {

                const profileData = await profileService.getMe();

                console.log("PROFILE:", profileData);

                setProfile(profileData);
            } catch (error) {
                console.error("Eroare la preluarea profilului:", error);
            } finally {
            }
        };

        fetchProfile();
    }, []);

    if (selectedDoctor) {
        return (
            <DoctorProfilePage
                doctorId={selectedDoctor}
                onBack={() => setSelectedDoctor(null)}
            />
        );
    }
    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 animate-in fade-in duration-700">
            <Card className="xl:col-span-1 bg-gradient-to-br from-primary via-primary to-primary/70 text-secondary border-0 shadow-xl overflow-hidden relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,secondary,transparent_40%)]" />
                <CardHeader className="relative z-10">
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 rounded-xl bg-secondary/10 backdrop-blur-sm">
                            <User className="text-secondary" size={20} />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-secondary/60 font-medium">
                                {t("Profile")}
                            </p>
                            <h2 className="text-2xl font-bold capitalize">
                                {data.targetPerson ==="Principal" ? getFirstName(profile.fullName) : data.targetPerson}
                            </h2>
                        </div>
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5 relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-secondary/10 backdrop-blur-md border border-secondary/10 p-4 rounded-2xl text-center">
                            <p className="text-sm uppercase tracking-[0.15em] text-secondary/60">
                                {t("Age")}
                            </p>
                            <p className="text-sm font-bold mt-1">
                                {data.age}
                            </p>
                        </div>
                        <div className="bg-secondary/10 backdrop-blur-md border border-secondary/10 p-4 rounded-2xl text-center">
                            <p className="text-sm uppercase tracking-[0.15em] text-secondary/60">
                                {t("Gender")}
                            </p>
                            <p className="text-sm font-bold mt-1 capitalize">
                                {t(data.gender.toLowerCase())}
                            </p>
                        </div>
                    </div>

                    <div
                        className={`px-4 py-3 rounded-2xl text-center font-semibold text-sm border ${
                            data.hasRedFlags
                                ? "bg-destructive/70 border-secondary/20 text-secondary"
                                : "bg-success/70 border-secondary/20 text-secondary"
                        }`}
                    >
                        {data.hasRedFlags
                            ? t("⚠ Attention Required")
                            : t("✓ Stable General State")}
                    </div>
                </CardContent>
            </Card>

            <Card className="xl:col-span-2 shadow-lg border-secondary-foreground/10">
                <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-foreground/60">
                        {t("Nutritional Deficiencies")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data.redFlagDetails?.length > 0 && (
                        <div className="space-y-2 mb-4">
                            <div className="flex flex-wrap gap-2">
                                {data.redFlagDetails.map(
                                    (flag: string, index: number) => (
                                        <div
                                            key={index}
                                            className="px-3 py-3 rounded-2xl text-center text-sm text-destructive bg-destructive/10 border border-destructive/20"
                                        >
                                            {t(flag)}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={deficiencyData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis
                                    dataKey="subject"
                                    tick={{ fontSize: 10 }}
                                />
                                <RadarArea
                                    name="Deficiency"
                                    dataKey="value"
                                    stroke="#6366f1"
                                    fill="#818cf8"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="xl:col-span-1 shadow-lg border-secondary-foreground/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-secondary-foreground/60">
                        <Activity size={16} />
                        {t("Symptoms Severity")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    {symptoms.map(([symptom, value]) => {
                        const percentage = Number(value) * 100;
                        const correctSymptomKey = SYMPTOM_MAPPER[symptom] || symptom;

                        return (
                            <div key={symptom} className="space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-secondary-foreground">
                                        {t(correctSymptomKey)}
                                    </span>
                                    <span className="font-bold text-primary">
                                        {percentage.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {images.length > 0 && (
                <Card className="xl:col-span-4 shadow-lg border-secondary-foreground/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-secondary-foreground/60">
                            <ImageIcon size={16} />
                            {t("Visual Evidence")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {images.map((url: string, index: number) => (
                                <div
                                    key={index}
                                    className="aspect-square rounded-2xl overflow-hidden border border-secondary/10 bg-secondary/5 relative group"
                                >
                                    <img
                                        src={url}
                                        alt={`Symptom visual ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {!data.hasRedFlags && (
                <Card className="xl:col-span-4 shadow-lg border-secondary-foreground/10">
                    <CardHeader>
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-foreground/60">
                            {t("Detailed Deficiencies")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {deficiencyData.map((deficiency, index) => {
                                const isSuccess = deficiency.value < 30;
                                const isWarning = deficiency.value >= 30 && deficiency.value <= 70;

                                return (
                                    <div
                                        key={index}
                                        className={`relative overflow-hidden p-4 rounded-xl border flex justify-between items-center transition-all hover:shadow-md hover:-translate-y-0.5 ${
                                            isSuccess
                                                ? "bg-success/5 border-success/20 hover:bg-success/10 hover:border-success/30"
                                                : "bg-destructive/5 border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30"
                                        }`}
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSuccess ? "bg-success/60" : isWarning? "bg-warning/60" : "bg-destructive/60"}`} />
                                        <span className="font-semibold text-xs text-secondary-foreground pl-2">
                                        {deficiency.subject}
                                    </span>

                                        <div className={`px-2.5 py-1 rounded-md text-secondary-foreground border shadow-sm font-bold text-xs ${
                                            isSuccess ? "bg-success/40 border-secondary/20" : isWarning ? "bg-warning/40 border-secondary/20"
                                                : "bg-destructive/40 border-secondary/20"
                                        }`}>
                                            {deficiency.value.toFixed(0)}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {data.doctorDetails?.doctorId && (
                <Card
                    onClick={() => {
                        setSelectedDoctor(data.doctorDetails!.doctorId);
                        console.log("aICI",data.doctorDetails.fullName);
                    }}
                    className="xl:col-span-4 shadow-lg border-primary/20 bg-gradient-to-r from-primary/5 to-transparent cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-primary/40 transition-all duration-300 group"
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                            <Stethoscope size={16} />
                            {t("Medical Review")}
                        </CardTitle>
                        <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center text-xs font-bold uppercase">
                            {t("View Profile")} <ChevronRight size={16} />
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-5 mt-2">
                        <div className="flex flex-col sm:flex-row items-start justify-between w-full gap-4">
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 rounded-xl bg-secondary/5 border border-secondary/10 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-primary/30 transition-colors">
                                    {data.doctorDetails?.avatarUrl ? (
                                        <img
                                            src={data.doctorDetails.avatarUrl}
                                            alt={data.doctorDetails.fullName || 'Doctor avatar'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <UserRound size={18} className="text-secondary/40 group-hover:text-primary transition-colors" />
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg text-secondary group-hover:text-primary transition-colors">
                                        {data.doctorDetails.fullName}
                                    </h3>
                                    <p className="text-xs text-secondary/60 leading-relaxed mt-1 line-clamp-2">
                                        {data.doctorDetails.bio}
                                    </p>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase bg-primary/10 text-primary px-2 py-1 rounded-md">
                                            {t("Verified Specialist")}
                                        </span>
                                        <span className="text-[10px] text-secondary/40">
                                            {t("Consultation fee")}: {data.doctorDetails.price} RON
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 self-start sm:self-auto">
                                {data.status === AssessmentStatus.DOCTOR_REVIEWED ? (
                                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                                        <CheckCircle size={10} />{t("Reviewed")}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider text-amber-400 uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">
                                        <Clock size={10} /> {t("In Review")}
                                    </span>
                                )}
                            </div>
                        </div>

                        {data.doctorNotes && (
                            <div className="w-full border-t border-secondary-foreground/10 pt-4 mt-2">
                                <h4 className="text-xs font-bold uppercase text-secondary/60 mb-3">
                                    {t("Doctor evaluation")}
                                </h4>
                                <div className="bg-secondary/5 border border-secondary/10 rounded-xl p-4 transition-colors group-hover:border-primary/20">
                                    <p className="text-sm text-secondary/80 italic leading-relaxed">
                                        {data.doctorNotes}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}