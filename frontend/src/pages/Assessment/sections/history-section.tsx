import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import type { AssessmentI } from "@/models/assesment-model.ts";
import { useTranslation } from "react-i18next";
import { CustomDot } from "@/components/custom-dot.tsx";
import {formatChartFullDate, formatChartShortDate} from "@/utils/form-data.ts";

export default function HistoryCharts({ assessments }: { assessments: AssessmentI[]; }) {
    const { t } = useTranslation();

    const wellnessData = assessments.map((assessment) => ({
        id: assessment.assessmentId,
        date: formatChartShortDate(assessment.createdAt),
        fullDate: formatChartFullDate(assessment.createdAt),
        timestamp: assessment.createdAt,
        score: assessment.wellnessScore ?? 0,
    }));

    return (
        <div className="space-y-10 animate-in fade-in duration-700 animate-reveal">
            <Card className="shadow-sm border-secondary-foreground/10 overflow-hidden bg-secondary">
                <CardHeader className="pb-4 bg-transparent border-b border-secondary-foreground/5">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider text-secondary-foreground flex items-center gap-2">
                        <Activity className="text-primary" size={18} />
                        {t("Wellness score evolution in time")}
                    </CardTitle>
                </CardHeader>

                <CardContent className="h-[380px] p-0 sm:p-6 mt-4 sm:mt-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={wellnessData}
                            margin={{
                                top: 25,
                                right: 20,
                                bottom: 25,
                                left: 10,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorStroke" x1="0" y1="0" x2="0" y2="1">
                                    <stop stopColor="var(--primary)" stopOpacity={1} />
                                    <stop stopColor="var(--secondary-foreground)" stopOpacity={1} />
                                </linearGradient>

                                <linearGradient id="colorFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="var(--secondary-foreground)" stopOpacity={0.05} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid
                                strokeDasharray="4 4"
                                vertical={false}
                                stroke="var(--secondary-foreground)"
                                opacity={0.1}
                            />

                            <XAxis
                                dataKey="timestamp"
                                tickFormatter={(val) => formatChartShortDate(val)}
                                tick={{
                                    fontSize: 12,
                                    fill: "var(--secondary-foreground)",
                                    opacity: 0.6,
                                    fontWeight: 500,
                                }}
                                tickLine={false}
                                axisLine={false}
                                dy={15}
                                height={60}
                                label={{
                                    value: t("EVOLUTION IN TIME"),
                                    position: "insideBottom",
                                    offset: -20,
                                    fill: "var(--secondary-foreground)",
                                    fontSize: 13,
                                    fontWeight: "bold",
                                }}
                            />

                            <YAxis
                                domain={[0, 100]}
                                tick={{
                                    fontSize: 12,
                                    fill: "var(--secondary-foreground)",
                                    opacity: 0.6,
                                    fontWeight: 500,
                                }}
                                tickLine={false}
                                axisLine={false}
                                width={85}
                                label={{
                                    value: t("WELLNESS SCORE (%)"),
                                    angle: -90,
                                    position: "insideLeft",
                                    offset: 10,
                                    fill: "var(--secondary-foreground)",
                                    fontSize: 13,
                                    fontWeight: "bold",
                                    style: { textAnchor: "middle" },
                                    opacity: 0.8
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="url(#colorStroke)"
                                strokeWidth={4}
                                fill="url(#colorFill)"
                                fillOpacity={1}
                                dot={<CustomDot />}
                                activeDot={false}
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}