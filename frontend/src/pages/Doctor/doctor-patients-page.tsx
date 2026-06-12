import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Search, Calendar, ChevronRight, UserRound, Loader2 } from "lucide-react";
import type { DoctorPatientI } from "@/models/assesment-model.ts";
import {formatDateMs} from "@/utils/form-data.ts";
import {doctorService} from "@/services/doctor-service.ts";

type DoctorPatientsPageProps = {
    onSelectPatient?: (patient: DoctorPatientI) => void;
};

const getInitials = (name: string): string => {
    if (!name) return "";
    const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    return cleanName ? cleanName[0].toUpperCase() : "";
};

export default function DoctorPatientsPage({ onSelectPatient }: DoctorPatientsPageProps) {
    const { t } = useTranslation();
    const [patients, setPatients] = useState<DoctorPatientI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                setIsLoading(true);
                const data = await doctorService.getDoctorPatients();
                setPatients(data || []);
            } catch (error) {
                console.error("Failed to fetch patients:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatients();
    }, []);

    const filteredPatients = patients.filter(p =>
        p.targetPerson.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 relative p-4 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary flex items-center gap-2 md:mt-24 ">
                        <Users className="text-primary" size={24} />
                        {t("My Patients")}
                    </h1>
                </div>

                <div className="relative md:mt-24">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40" size={16} />
                    <input
                        type="text"
                        placeholder={t("Search by patient...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 bg-secondary/[0.02] border border-secondary/10 rounded-xl py-2 pl-9 pr-4 text-sm text-secondary focus:border-primary/50 focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-secondary/40">
                    <Loader2 className="animate-spin mb-4 text-primary" size={32} />
                    <p className="text-sm font-bold uppercase tracking-widest">{t("Loading patients...")}</p>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-secondary/[0.02] border border-dashed border-secondary/10 rounded-2xl mt-8">
                    <div className="p-4 bg-primary/10 rounded-full text-primary mb-4">
                        <Users size={28} className="opacity-80" />
                    </div>
                    <p className="text-sm font-medium text-secondary/80">
                        {searchQuery ? t("No patients found matching your search.") : t("No patients assigned yet.")}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {filteredPatients.map((patient) => {
                        const isPrincipal = patient.targetPerson=== "Principal"
                        return (
                            <button
                                key={`${patient.cognitoSub}-${patient.targetPerson}`}
                                onClick={() => onSelectPatient?.(patient)}
                                className="flex flex-col p-4 rounded-2xl bg-secondary/[0.02] border border-secondary/10 hover:border-primary/40 hover:bg-secondary/[0.04] transition-all duration-300 text-left group w-full relative overflow-hidden hover:cursor-pointer"
                            >
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                <div className="flex items-start justify-between w-full relative z-10 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl border flex items-center justify-center transition-colors overflow-hidden shrink-0 shadow-sm bg-secondary/5 border-secondary/10 group-hover:border-primary/30">
                                            {isPrincipal && patient.avatarUrl ? (
                                                <img
                                                    src={patient.avatarUrl}
                                                    alt={patient.targetPerson}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : !isPrincipal ? (
                                                <div className="w-full h-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center uppercase tracking-wider group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                    {getInitials(patient.targetPerson)}
                                                </div>
                                            ) : (
                                                <UserRound size={18} className="text-secondary/40 group-hover:text-primary transition-colors" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <h3 className="text-sm font-bold text-secondary group-hover:text-primary-foreground transition-colors truncate max-w-[150px] md:max-w-[180px]">
                                                {patient.targetPerson}
                                            </h3>
                                            {patient.email && (
                                                <p className="text-[11px] text-secondary/50 truncate max-w-[150px] md:max-w-[180px] mb-0.5">
                                                    {patient.email}
                                                </p>
                                            )}

                                            <p className="text-[10px] uppercase tracking-widest text-secondary/40 mt-0.5">
                                                {patient.age} {t("years")} • {t(patient.gender.toLowerCase())}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-1.5 rounded-lg bg-secondary/5 border border-secondary/5 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                        <ChevronRight size={14} className="text-secondary/40 group-hover:text-primary" />
                                    </div>
                                </div>

                                <div  className="flex items-center gap-1.5 text-secondary/50">
                                    <Calendar size={12} className="shrink-0" />
                                    <div className="flex items-center gap-1 text-[10px] text-secondary/60">
                                        <span>{t("Last questionnaire")}:</span>
                                        <span className="font-mono text-secondary/60 font-bold">
                                            {formatDateMs(patient.lastAssessmentAt)}
                                        </span>
                                    </div>

                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}