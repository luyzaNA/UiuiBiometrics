import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import {PatientHistorySection} from "@/pages/Doctor/sections/patient-history-section.tsx";

export default function PatientHistoryPage() {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const targetPerson: string = location.state?.targetPerson;
    const cognitoSub: string = location.state?.cognitoSub;
    const email: string = location.state?.email;

    if (!targetPerson) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <p className="text-secondary/60 mb-4">{t("No patient selected.")}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 bg-primary text-secondary rounded-xl hover:bg-primary/90 transition-colors"
                >
                    {t("Back to patients")}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 p-4 min-h-screen">
            <div className="flex items-center gap-4 mb-8 md:mt-24">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl bg-secondary/5 hover:bg-secondary/10 border border-secondary/10 text-secondary transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
                        {t("Medical History")}
                    </h1>
                    <p className="text-sm text-secondary/40 mt-1">
                        {t("Patient")}: <strong className="text-secondary/80">{targetPerson}</strong>
                    </p>
                    <p className="text-sm text-secondary/40 mt-1">
                        {t("Email")}: <strong className="text-secondary/80">{email}</strong>
                    </p>
                </div>
            </div>

            <PatientHistorySection targetPerson={targetPerson} cognitoSub={cognitoSub} />
        </div>
    );
}