import { Loader2, AlertCircle, Users, Calendar } from "lucide-react";
import type { AssessmentI } from "@/models/assesment-model.ts";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { assessmentService } from "@/services/assessment-service";
import AssessmentPage from "@/pages/Assessment/single-assessment-page.tsx";
import HistoryCharts from "@/pages/Assessment/sections/history-section.tsx";
import { formatDateMs } from "@/utils/form-data.ts";

export default function AssessmentsHistoryPage() {
    const { t } = useTranslation();

    const [assessments, setAssessments] = useState<AssessmentI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<string>("Principal");
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("ALL");

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                setIsLoading(true);
                setHasError(false);

                const response = await assessmentService.getAll();

                const isSingleAssessment = (obj: any): obj is AssessmentI => {
                    return obj && typeof obj === "object" && "assessmentId" in obj;
                };

                let dataArray: AssessmentI[] = [];

                if (Array.isArray(response)) dataArray = response;
                else if (response && Array.isArray(response.data)) dataArray = response.data;
                else if (response?.data && Array.isArray((response.data as any).data)) dataArray = (response.data as any).data;
                else if (isSingleAssessment(response)) dataArray = [response];
                else if (response?.data && isSingleAssessment(response.data)) dataArray = [response.data];

                if (dataArray.length > 0) {
                    const sortedData = [...dataArray].sort((a, b) => b.createdAt - a.createdAt);
                    setAssessments(sortedData);
                } else {
                    setAssessments([]);
                }
            } catch (error) {
                console.error("Failed to fetch assessments:", error);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssessments();
    }, []);

    const uniquePersons = useMemo(() => {
        return Array.from(
            new Set(
                assessments
                    .map((a) => a.targetPerson)
                    .filter(Boolean)
            )
        );
    }, [assessments]);

    useEffect(() => {
        if (!isLoading && uniquePersons.length > 0 && !uniquePersons.includes(selectedPerson)) {
            setSelectedPerson(uniquePersons[0]);
        }
    }, [isLoading, uniquePersons, selectedPerson]);

    const personAssessments = useMemo(() => {
        return assessments.filter((a) => a.targetPerson === selectedPerson);
    }, [assessments, selectedPerson]);

    useEffect(() => {
        if (personAssessments.length === 0 || selectedAssessmentId === "ALL") return;

        const exists = personAssessments.some((a) => a.assessmentId === selectedAssessmentId);
        if (!exists) setSelectedAssessmentId("ALL");
    }, [selectedAssessmentId, personAssessments]);

    const isHistoryMode = selectedAssessmentId === "ALL";

    const currentAssessment = personAssessments.find(
        (a) => a.assessmentId === selectedAssessmentId
    ) || personAssessments[0];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-secondary-foreground/50 gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-sm font-medium">{t("Loading your health profiles...")}</p>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-12 text-center flex flex-col items-center gap-3 h-screen">
                <AlertCircle className="text-destructive" size={40} />
                <h2 className="text-xl font-bold text-secondary">{t("Oops! Something went wrong")}</h2>
                <p className="text-secondary/90 text-sm max-w-md">
                    {t("We couldn't load the assessments. Please check your connection or try again.")}
                </p>
            </div>
        );
    }

    if (assessments.length === 0) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-12 text-center h-screen">
                <h2 className="text-xl font-bold text-secondary">{t("No assessments found")}</h2>
                <p className="text-secondary/60 mt-2 text-sm">
                    {t("You haven't completed any health assessments yet.")}
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6 min-h-screen pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary p-4 rounded-2xl border border-secondary-foreground/10 shadow-sm">
                <div className="flex items-center gap-3 text-secondary-foreground">
                    <div className="p-2 bg-primary/10 rounded-xl">
                        <Users className="text-primary" size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm sm:text-base leading-none">{t("Health Profile")}</h2>
                        <p className="text-xs text-secondary-foreground/60 mt-1">{t("Select profile and the desired assessment")}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <select
                            value={selectedPerson}
                            onChange={(e) => setSelectedPerson(e.target.value)}
                            className="w-full sm:w-auto appearance-none bg-background border border-secondary-foreground/10 text-secondary text-sm font-semibold py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer shadow-sm"
                        >
                            {uniquePersons.map((person) => (
                                <option key={person} value={person as string}>
                                    {person === "Principal" ? t("My Profile") : person}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>

                    {personAssessments.length > 0 && (
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-primary/70">
                                <Calendar size={16} />
                            </div>
                            <select
                                value={selectedAssessmentId}
                                onChange={(e) => setSelectedAssessmentId(e.target.value)}
                                className="w-full sm:w-auto appearance-none bg-background border border-secondary-foreground/10 text-secondary text-sm font-semibold py-2.5 pl-9 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer shadow-sm"
                            >
                                <option value="ALL">{t("All history")}</option>
                                {personAssessments.map((assessment, index) => (
                                    <option key={assessment.assessmentId} value={assessment.assessmentId}>
                                        {formatDateMs(assessment.createdAt)}{" "}
                                        {index === 0 && `(${t("Latest")})`}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary-foreground/50">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isHistoryMode ? (
                <HistoryCharts assessments={[...personAssessments].reverse()} />
            ) : currentAssessment ? (
                <AssessmentPage data={currentAssessment} />
            ) : (
                <div className="text-center py-10 text-secondary-foreground/50 text-sm">
                    {t("No data available for this profile.")}
                </div>
            )}
        </div>
    );
}