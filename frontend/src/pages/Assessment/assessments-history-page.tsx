import {
    Loader2,
    AlertCircle,
    Users,
    Calendar,
    Apple,
    Activity
} from "lucide-react";
import type { AssessmentI } from "@/models/assesment-model.ts";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { assessmentService } from "@/services/assessment-service";
import { menuService } from "@/services/menu-service.ts";
import AssessmentPage from "@/pages/Assessment/single-assessment-page.tsx";
import HistoryCharts from "@/pages/Assessment/sections/history-section.tsx";
import { formatDateMs } from "@/utils/form-data.ts";
import TargetedFoodsProtocol from "@/pages/Menu/food-base/section/food-base-section.tsx";
import MealBankProtocol from "@/pages/Menu/meal-base/section/meal-base-section.tsx";
import { DoctorAssessmentsList } from "@/pages/Assessment/doctor-assessments-list-page.tsx";
import { ComparisonCharts } from "@/pages/Assessment/sections/comparison-charts-section.tsx";

export default function AssessmentsHistoryPage() {
    const { t } = useTranslation();

    const [assessments, setAssessments] = useState<AssessmentI[]>([]);
    const [activeMenu, setActiveMenu] = useState<any>(null);
    const [menuHistory, setMenuHistory] = useState<any[]>([]);
    const [selectedHistoricMenu, setSelectedHistoricMenu] = useState<any>(null);

    const [selectedDoctorAssessment, setSelectedDoctorAssessment] = useState<AssessmentI | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMenu, setIsLoadingMenu] = useState(false);
    const [hasError, setHasError] = useState(false);

    const [selectedPerson, setSelectedPerson] = useState<string>("Principal");
    const [selectedView, setSelectedView] = useState<string>("ALL");

    const [comparisonData, setComparisonData] = useState<any>(null);
    const [isLoadingComparison, setIsLoadingComparison] = useState(false);


    const uniquePersons = useMemo(() => {
        return Array.from(new Set(assessments.map((a) => a.targetPerson).filter(Boolean)));
    }, [assessments]);

    const personAssessments = useMemo(() => {
        return assessments.filter((a) => a.targetPerson === selectedPerson);
    }, [assessments, selectedPerson]);

    const currentAssessment = useMemo(() => {
        return personAssessments.find((a) => a.assessmentId === selectedView) || selectedDoctorAssessment;
    }, [personAssessments, selectedView, selectedDoctorAssessment]);

    useEffect(() => {
        const fetchComparison = async () => {
            if (selectedView === "ALL" && personAssessments.length > 1 && selectedPerson) {
                try {
                    setIsLoadingComparison(true);
                    const data = await assessmentService.getLatestComparison(selectedPerson);
                    setComparisonData(data);
                } catch (error) {
                    console.error("Failed to fetch comparison", error);
                    setComparisonData(null);
                } finally {
                    setIsLoadingComparison(false);
                }
            } else {
                setComparisonData(null);
            }
        };

        fetchComparison();
    }, [selectedView, selectedPerson, personAssessments.length]);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                setIsLoading(true);
                const response = await assessmentService.getAll();
                const dataArray = Array.isArray(response) ? response : (response?.data || []);
                setAssessments([...dataArray].sort((a, b) => b.createdAt - a.createdAt));
            } catch (error) {
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssessments();
    }, []);

    useEffect(() => {
        if (selectedView === "ACTIVE_MENU") {
            const fetchActiveMenu = async () => {
                try {
                    setIsLoadingMenu(true);
                    const response = await menuService.getActiveMenu(selectedPerson);
                    setActiveMenu(response);
                } catch (err) {
                    console.error("Failed to fetch protocol");
                } finally {
                    setIsLoadingMenu(false);
                }
            };
            fetchActiveMenu();
        } else if (selectedView === "HISTORY_MENU") {
            const fetchHistory = async () => {
                try {
                    setIsLoadingMenu(true);
                    const response = await menuService.getMenuHistory(selectedPerson);
                    setMenuHistory(response || []);
                } catch (err) {
                    console.error("Failed to fetch menu history");
                } finally {
                    setIsLoadingMenu(false);
                }
            };
            fetchHistory();
            setSelectedHistoricMenu(null);
        }
    }, [selectedView, selectedPerson]);


    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-sm font-medium text-muted-foreground">{t("Loading your health data...")}</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 pt-6 space-y-8 min-h-screen pb-20 animate-fadeIn">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-secondary p-5 rounded-3xl border border-foreground/5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Activity className="text-primary" size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight text-secondary-foreground">{t("Health History")}</h2>
                        <p className="text-xs text-muted-foreground">{t("Track Progress & Menus")}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group">
                        <select
                            value={selectedPerson}
                            onChange={(e) => {
                                setSelectedPerson(e.target.value);
                                setSelectedView("ALL");
                            }}
                            className="w-full sm:w-auto appearance-none bg-background border border-foreground/10 text-foreground text-sm font-bold py-2.5 pl-4 pr-10 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            {uniquePersons.map((person) => (
                                <option key={person} value={person}>
                                    {person === "Principal" ? t("My Profile") : person}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><Users size={14}/></div>
                    </div>

                    <div className="relative">
                        <select
                            value={selectedView}
                            onChange={(e) => setSelectedView(e.target.value)}
                            className="w-full sm:w-auto appearance-none bg-background border border-foreground/10 text-foreground text-sm font-bold py-2.5 pl-10 pr-10 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                        >
                            <optgroup label={t("Overview")}>
                                <option value="ALL" className="hover:cursor-pointer"> {t("Health Trends")}</option>
                            </optgroup>
                            <optgroup label={t("Medical Options")}>
                                <option value="DOCTOR_REVIEWS" className="hover:cursor-pointer"> {t("Doctor Review")}</option>
                            </optgroup>
                            <optgroup label={t("Menus")}>
                                <option value="ACTIVE_MENU" className="hover:cursor-pointer" > {t("Active menu")}</option>
                                <option value="HISTORY_MENU" className="hover:cursor-pointer"> {t("History of menus")}</option>
                            </optgroup>
                            <optgroup label={t("Individual quizzes")} className="hover:cursor-pointer">
                                {personAssessments.map((assessment, idx) => (
                                    <option key={assessment.assessmentId} value={assessment.assessmentId}>
                                        {formatDateMs(assessment.createdAt)} {idx === 0 ? `(${t("Latest")})` : ""}
                                    </option>
                                ))}
                            </optgroup>
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"><Calendar size={16} /></div>
                    </div>
                </div>
            </div>

            <div className="transition-all duration-500">

                {selectedView === "ALL" && (
                    <div className="space-y-6">
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <HistoryCharts assessments={[...personAssessments].reverse()} />

                        {isLoadingComparison ? (
                            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                        ) : comparisonData ? (
                            <div className="space-y-4 mt-6 animate-fadeIn">
                                <div className="space-y-1.5 px-1">
                                    <h4 className="text-sm font-bold uppercase tracking-wider text-secondary/80">
                                        {t("latestQuizComparisonTitle")}
                                    </h4>
                                    <p className="text-sm text-secondary/60 max-w-2xl leading-relaxed italic">
                                        {t("latestQuizComparisonDesc")}
                                    </p>
                                </div>
                                <ComparisonCharts data={comparisonData} />
                            </div>
                        ) : null}
                    </div>
                )}

                {selectedView === "DOCTOR_REVIEWS" && (
                    <div className="animate-fadeIn">
                        <DoctorAssessmentsList
                            targetPerson={selectedPerson}
                            onSelectAssessment={(assessment) => {
                                setSelectedDoctorAssessment(assessment);
                                setSelectedView(assessment.assessmentId);
                            }}
                        />
                    </div>
                )}

                {selectedView === "ACTIVE_MENU" && (
                    <div className="animate-slideUp">
                        {isLoadingMenu ? (
                            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                        ) : activeMenu ? (
                            activeMenu.menuType === "MEALS" || activeMenu.menu_type === "MEALS" || activeMenu.breakfasts ? (
                                <MealBankProtocol menuData={activeMenu} showBack={false} />
                            ) : (
                                <TargetedFoodsProtocol menuData={activeMenu} showBack={false} />
                            )
                        ) : (
                            <div className="text-center py-20 bg-secondary/30 rounded-3xl border border-dashed border-foreground/10">
                                <Apple size={40} className="mx-auto mb-4 text-muted-foreground opacity-20" />
                                <p className="text-muted-foreground font-medium">{t("No active menu for this profile.")}</p>
                            </div>
                        )}
                    </div>
                )}

                {selectedView === "HISTORY_MENU" && (
                    <div className="animate-fadeIn space-y-6">
                        {isLoadingMenu ? (
                            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                        ) : !selectedHistoricMenu ? (
                            menuHistory.length > 0 ? (
                                <div className="grid gap-4">
                                    {menuHistory.map((menu, idx) => (
                                        <div
                                            key={menu.menuId || idx}
                                            onClick={() => setSelectedHistoricMenu(menu)}
                                            className="p-5 border border-foreground/10 rounded-2xl bg-foreground/[0.01] hover:bg-foreground/[0.03] transition-all cursor-pointer flex justify-between items-center group"
                                        >
                                            <div>
                                                <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                                                    {t("Menu from")} {formatDateMs(menu.createdAt)}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {menu.deficiencies?.length || 0} {t("targets addressed")}
                                                </p>
                                            </div>
                                            <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full ${menu.status === 'ACTIVE' ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-secondary'}`}>
                                                {menu.status === "ACTIVE"
                                                    ? t("Active")
                                                    : menu.status === "COMPLETE"
                                                        ? t("Complete")
                                                        : t("Archived")
                                                }
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-secondary/30 rounded-3xl border border-dashed border-foreground/10">
                                    <p className="text-muted-foreground font-medium">{t("No past menus found for this profile.")}</p>
                                </div>
                            )
                        ) : (
                            <div className="space-y-6">
                                <button
                                    onClick={() => setSelectedHistoricMenu(null)}
                                    className="text-xs uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-2"
                                >
                                    ← {t("Back to list")}
                                </button>
                                <div className="opacity-80">
                                    {selectedHistoricMenu.menuType === "MEALS" || selectedHistoricMenu.menu_type === "MEALS" || selectedHistoricMenu.breakfasts ? (
                                        <MealBankProtocol menuData={selectedHistoricMenu} showBack={false} />
                                    ) : (
                                        <TargetedFoodsProtocol menuData={selectedHistoricMenu} showBack={false} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {selectedView !== "ALL" && selectedView !== "HISTORY_MENU" && selectedView !== "ACTIVE_MENU" && selectedView !== "DOCTOR_REVIEWS" && currentAssessment && (
                    <div className="animate-fadeIn">
                        <AssessmentPage data={currentAssessment} />
                    </div>
                )}
            </div>

            {hasError && (
                <div className="text-center py-20">
                    <AlertCircle className="mx-auto text-destructive mb-4" size={40} />
                    <p className="font-bold text-foreground">{t("Unable to sync data")}</p>
                </div>
            )}
        </div>
    );
}