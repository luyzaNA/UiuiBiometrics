import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Radar as RadarArea } from "recharts";
import { User, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SYMPTOM_MAPPER } from "@/utils/symptoms_wrap.ts";
import type { AssessmentI } from "@/models/assesment-model.ts";

type AssessmentPageProps = {
    data: AssessmentI;
};

export default function AssessmentPage({ data }: AssessmentPageProps) {
    const { t } = useTranslation();

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
                            <h2 className="text-2xl font-bold">
                                {data.targetPerson}
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
                                const isSuccess = deficiency.value < 50;
                                return (
                                    <div
                                        key={index}
                                        className={`relative overflow-hidden p-4 rounded-xl border flex justify-between items-center transition-all hover:shadow-md hover:-translate-y-0.5 ${
                                            isSuccess
                                                ? "bg-success/5 border-success/20 hover:bg-success/10 hover:border-success/30"
                                                : "bg-destructive/5 border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30"
                                        }`}
                                    >
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSuccess ? "bg-success/60" : "bg-destructive/60"}`} />
                                        <span className="font-semibold text-xs text-secondary-foreground pl-2">
                                        {deficiency.subject}
                                    </span>

                                        <div className={`px-2.5 py-1 rounded-md text-secondary-foreground border shadow-sm font-bold text-xs ${
                                            isSuccess
                                                ? "bg-success/40 border-secondary/20"
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
        </div>
    );
}