import { useState, useMemo } from "react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useTranslation } from "react-i18next";
import { SYMPTOM_MAPPER } from "@/utils/symptoms_wrap.ts";

const getDeficiencyCategory = (name: string): string => {
    const bComplex = ['Vit_B1', 'Vit_B2', 'Vit_B3', 'Vit_B6', 'Vit_B7', 'Vit_B9', 'Vit_B12'];
    const minerals = ['Iron', 'Magnesium', 'Calcium', 'Zinc', 'Potassium', 'Iodine', 'Selenium', 'Copper'];
    const vitamins = ['Vit_A', 'Vit_C', 'Vit_D', 'Vit_E', 'Vit_K'];

    if (bComplex.includes(name)) return "B-Complex";
    if (minerals.includes(name)) return "Minerals";
    if (vitamins.includes(name)) return "Vitamins";
    return "Other Nutritional Targets";
};

const getSymptomCategory = (name: string): string => {
    const energyAndBrain = [
        "Fatigue", "Dizziness", "Headache", "Difficulty_Concentrating",
        "Memory_Loss", "Irritability", "Depression_Anxiety_Mood_Changes", "Insomnia"
    ];

    const musclesAndBones = [
        "Muscle_Pain", "Muscle_Weakness", "Cramps", "Bone_Pain",
        "Physical_Instability", "Coordination_Problems", "Tremors", "Numbness"
    ];

    const digestionAndImmune = [
        "Diarrhea", "Bloating", "Constipation", "Nausea",
        "Acid_Reflux", "Stomach_Pain", "Frequent_Colds", "Oral_Ulcers"
    ];

    const skinAndSenses = [
        "Hair_Loss", "Dry_Eyes", "Dry_Skin", "Night_Blindness", "Light_Sensitivity",
        "Easy_Bruising", "Nose_or_Gum_Bleeding", "Dry_Lips", "Skin_Rash_or_Redness",
        "Slow_Wound_Healing", "Reduced_Taste_or_Smell", "Brittle_Nails"
    ];

    if (energyAndBrain.includes(name)) return "Energy & Brain";
    if (musclesAndBones.includes(name)) return "Muscles & Bones";
    if (digestionAndImmune.includes(name)) return "Digestion & Immune";
    if (skinAndSenses.includes(name)) return "Skin & Senses";
    return "General Health";
};

const CustomTooltip = ({ active, payload, label, t, type }: any) => {
    if (active && payload && payload.length) {
        const initial = payload.find((p: any) => p.dataKey === 'initial')?.value || 0;
        const current = payload.find((p: any) => p.dataKey === 'current')?.value || 0;

        const diff = initial - current;
        const diffPercent = Math.round(diff * 100);
        const isImprovement = diff > 0;

        const translationKey = type === 'symptoms' && SYMPTOM_MAPPER[label]
            ? SYMPTOM_MAPPER[label]
            : label;

        return (
            <div className="bg-background/95 backdrop-blur-md border border-foreground/10 p-4 rounded-2xl shadow-xl">
                <p className="font-bold text-foreground mb-3">{t(translationKey)}</p>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-4 justify-between">
                        <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                            <span className="text-muted-foreground">{t("Previous")}</span>
                        </span>
                        <span className="font-mono font-medium">{(initial * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-4 justify-between">
                        <span className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
                            <span className="text-muted-foreground">{t("Current")}</span>
                        </span>
                        <span className="font-mono font-bold text-foreground">{(current * 100).toFixed(0)}%</span>
                    </div>
                </div>

                {diff !== 0 && (
                    <div className={`mt-3 pt-3 border-t border-foreground/5 text-xs font-bold flex items-center justify-between ${isImprovement ? 'text-emerald-500' : 'text-rose-500'}`}>
                        <span>{t("Evolution")}:</span>
                        <span>
                            {isImprovement ? "↓" : "↑"} {Math.abs(diffPercent)}% {isImprovement ? t("Improved") : t("Worse")}
                        </span>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

const CategorizedChart = ({ title, rawData, type }: { title: string, rawData: any[], type: 'symptoms' | 'deficiencies' }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<string>("All");

    const processedData = useMemo(() => {
        const grouped: Record<string, any[]> = { "All": rawData };

        rawData.forEach(item => {
            const category = type === 'deficiencies' ? getDeficiencyCategory(item.name) : getSymptomCategory(item.name);
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(item);
        });

        return grouped;
    }, [rawData, type]);

    const tabs = Object.keys(processedData);
    const chartData = processedData[activeTab] || [];

    return (
        <div className="bg-secondary/10 border border-foreground/5 p-6 rounded-[2rem] shadow-sm flex flex-col transition-all duration-300 min-h-[460px]">
            <div className="flex flex-col gap-4 mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">{t(title)}</h3>

                {tabs.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 bg-secondary-foreground/50 p-1.5 rounded-2xl border border-foreground/[0.03]">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all duration-300 ${
                                    activeTab === tab
                                        ? "bg-background text-primary shadow-sm border border-foreground/5"
                                        : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                                }`}
                            >
                                {t(tab)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-[280px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={5}>
                        <defs>
                            <linearGradient id={`colorCurrent-${type}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.85} />
                            </linearGradient>
                            <linearGradient id={`colorInitial-${type}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#cbd5e1" stopOpacity={1} />
                                <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.5} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" opacity={0.06} />

                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => {
                                const keyToTranslate = type === 'symptoms' && SYMPTOM_MAPPER[val]
                                    ? SYMPTOM_MAPPER[val]
                                    : val;
                                return t(keyToTranslate);
                            }}
                            tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 10, fontWeight: 600 }}
                            dy={10}
                        />

                        <YAxis
                            domain={[0, 1]}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                            tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 11 }}
                        />

                        <Tooltip content={<CustomTooltip t={t} type={type} />} cursor={{ fill: 'currentColor', opacity: 0.03 }} />

                        <Legend
                            wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 600, opacity: 0.7 }}
                            iconType="circle"
                        />

                        <Bar
                            dataKey="initial"
                            name={t("Previous")}
                            fill={`url(#colorInitial-${type})`}
                            radius={[5, 5, 5, 5]}
                            maxBarSize={28}
                            animationDuration={1200}
                        />
                        <Bar
                            dataKey="current"
                            name={t("Current")}
                            fill={`url(#colorCurrent-${type})`}
                            radius={[5, 5, 5, 5]}
                            maxBarSize={28}
                            animationDuration={1200}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const ComparisonCharts = ({ data }: { data: { symptoms: any[], deficiencies: any[] } }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 animate-fadeIn">
            <CategorizedChart
                title="Symptoms Evolution"
                rawData={data.symptoms}
                type="symptoms"
            />
            <CategorizedChart
                title="Deficiencies Evolution"
                rawData={data.deficiencies}
                type="deficiencies"
            />
        </div>
    );
};