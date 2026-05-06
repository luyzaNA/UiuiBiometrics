import {Plus } from "lucide-react";
import {useTranslation} from "react-i18next";

export default function MonitoringSection() {
    const {t} = useTranslation();

    return (
        <section className="relative min-h-screen w-full bg-secondary-foreground py-24 px-6 overflow-hidden font-sans border-t border-secondary/5">

            <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="relative h-[500px] flex items-center justify-center">
                    <div className="absolute w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
                    <div className="absolute translate-x-[-20%] translate-y-[-20%] rotate-[-12deg] w-48 h-64 bg-secondary/5 border border-secondary/10 p-2 rounded-2xl backdrop-blur-md shadow-2xl">
                        <div className="w-full h-full bg-[url('/nails.png')]  bg-cover bg-center rounded-xl opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-4 left-4 right-4 bg-secondary-foreground /60 backdrop-blur-md p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        </div>
                    </div>
                    <div className="absolute z-20 w-56 h-72 bg-secondary/10 border border-secondary/20 p-2 rounded-2xl backdrop-blur-xl shadow-[0_0_50px_rgba(173,123,189,0.2)]">
                        <div className="w-full h-full bg-[url('/hand.png')] bg-cover bg-center rounded-xl" />
                    </div>
                    <div className="absolute translate-x-[30%] translate-y-[15%] rotate-[8deg] w-48 h-64 bg-secondary/5 border border-secondary/10 p-2 rounded-2xl backdrop-blur-md shadow-2xl">
                        <div className="w-full h-full bg-[url('/nails.png')] bg-cover bg-center rounded-xl opacity-50 group-hover:opacity-100 transition-opacity" />

                    </div>
                    <div className="absolute bottom-0 border-2 border-dashed border-secondary/10 rounded-[3rem] px-8 py-4 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-default group">
                        <Plus className="text-primary group-hover:rotate-90 transition-transform" />
                        <span className="text-secondary/40 text-[10px] font-black uppercase tracking-[0.3em]">
                            {t("Upload photos")}
                        </span>
                    </div>
                </div>
                <div className="space-y-8 italic">
                    <div className="space-y-4">
                        <h3 className="text-primary text-[10px] font-black tracking-[0.5em] uppercase">{t("Aesthetic Monitoring")}</h3>
                        <h2 className="text-5xl md:text-7xl font-black text-secondary leading-[0.9] uppercase tracking-tighter">
                            {t("YOUR BODY ")} <br />
                            <span className="text-secondary/20">{t("SPEAKS.")}</span>
                        </h2>
                    </div>
                    <p className="text-secondary/50 text-base leading-relaxed max-w-md font-medium">
                        {t("Nutritional gaps aren't always felt—they are manifested. Upload photos of your nails or skin, and our system decodes them as visual biomarkers")}.
                        <br /><br />
                        {t("It is the most intuitive way to witness how cellular-level nutrition transforms your exterior, day by day.")}
                    </p>

                    <div className="flex flex-wrap gap-4">
                        {[t("Skin"), t("Nails"), t("Hair"), t("Eyes")].map((tag) => (
                            <div key={tag} className="px-4 py-2 bg-secondary/5 border border-secondary/10 rounded-full text-[10px] text-secondary/40 font-black uppercase tracking-widest">
                                # {tag}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}