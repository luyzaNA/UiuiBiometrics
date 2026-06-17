import { ShieldAlert, FileUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface MedicalAlertProps {
    redFlags: string[];
    assessmentId?: string;
}

export const MedicalAlert = ({ redFlags, assessmentId }: MedicalAlertProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleGoToDoctors = () => {
        if (!assessmentId) return;
        navigate(`/doctors?assessmentId=${assessmentId}`);
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-fadeIn min-h-screen">
            <div className="bg-secondary border border-destructive/20 rounded-3xl p-8 md:p-12 shadow-[0_10px_40px_rgba(0,0,0,0.08)] space-y-6">
                <div className="mx-auto p-4 bg-destructive text-secondary rounded-2xl shadow-lg shadow-destructive/30 w-fit animate-pulse">
                    <ShieldAlert size={40} />
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl md:text-3xl font-black text-secondary-foreground tracking-tight">
                        {t("Your health comes first.")}
                    </h2>
                    <p className="text-secondary-foreground/80 leading-relaxed text-base max-w-md mx-auto">
                        {t("Following the analysis of the symptoms provided, our system detected some signals that")}
                        <strong className="text-destructive font-bold"> {t("require specialized medical attention")}</strong>.
                    </p>
                    <p className="text-secondary-foreground/60 text-sm italic">
                        {t("For safety reasons, we have stopped generating nutritional recommendations.")}
                    </p>
                </div>

                <div className="bg-secondary-foreground/5 rounded-2xl p-5 text-left space-y-3 border border-secondary-foreground/10">
                    <span className="text-xs font-bold uppercase tracking-wider text-destructive block border-b border-destructive/10 pb-2">
                        ⚠️ {t("Manifestations that triggered the alert:")}
                    </span>
                    <ul className="space-y-2 text-sm text-secondary-foreground font-medium">
                        {redFlags.map((flag, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                                <span>{t(flag)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="pt-4">
                    <p className="text-sm font-semibold text-secondary-foreground/70 mb-4">
                        {t("What should you do now?")}
                    </p>

                    <button
                        onClick={handleGoToDoctors}
                        disabled={!assessmentId}
                        className="inline-flex items-center justify-center gap-2 bg-destructive text-secondary font-bold uppercase tracking-wider px-6 py-4 rounded-xl shadow-md hover:bg-destructive/90 transition-all text-sm w-full sm:w-auto hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileUp size={18} />
                        {t("Send report to a doctor")}
                    </button>
                </div>
            </div>
        </div>
    );
};