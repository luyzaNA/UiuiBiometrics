import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, ScanFace, Target, Database, Zap, Brain } from "lucide-react";
import { SYMPTOMS_BY_PART } from "@/utils/symptoms_by_part.ts";
import { type Intensity, NORMALIZE_PART} from "@/utils/normalize-body-part.ts";
import BodySvg from "@/assets/female-vector.svg?react";
import { SYSTEMIC_SYMPTOMS } from "@/utils/systemic-symptoms.tsx";
import { useTranslation } from "react-i18next";
import { SearchInput } from "@/components/symptom-selector/search-input.tsx";
import {SymptomRow} from "@/components/symptom-selector/symptom-row.tsx";
import {ActiveLog} from "@/components/symptom-selector/active-log.tsx";

export default function BodySymptomSelector() {
    const {t} = useTranslation();
    const [view, setView] = useState<"physical" | "systemic">("physical");
    const [selectedPart, setSelectedPart] = useState<string | null>(null);
    const [hoveredPart, setHoveredPart] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [values, setValues] = useState<Record<string, Intensity>>({});
    const [searchQuery, setSearchQuery] = useState("");

    const resetToDefault = () => {
        setSelectedPart(null);
        setSearchQuery("");
    };

    const filteredResults = useMemo(() => {
        if (!searchQuery.trim()) return null;
        const query = searchQuery.toLowerCase();
        const uniqueMatches = new Map<string, string>();

        Object.values(SYMPTOMS_BY_PART).flat().forEach((key) => {
            const translated = t(key);
            if (translated.toLowerCase().includes(query)) {
                uniqueMatches.set(key, translated);
            }
        });

        SYSTEMIC_SYMPTOMS.forEach(s => {
            const translated = t(s.label);
            if (translated.toLowerCase().includes(query)) {
                uniqueMatches.set(s.id, translated);
            }
        });

        return Array.from(uniqueMatches.entries()).map(([id, label]) => ({ id, label }));
    }, [searchQuery, t]);

    const handleSelect = (symptom: string, value: Intensity) => {
        setValues((prev) => ({ ...prev, [symptom]: value }));
    };

    const handleRemove = (symptom: string) => {
        setValues((prev) => {
            const newValues = { ...prev };
            delete newValues[symptom];
            return newValues;
        });
    };

    const activeSymptomsCount = Object.keys(values).length;

    return (
        <section
            onClick={resetToDefault}
            className="relative w-full bg-secondary-foreground py-12 px-6 overflow-hidden font-sans rounded-3xl border border-secondary/10 cursor-default"
        >
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                 style={{ backgroundImage: `linear-gradient(primary 1px, transparent 1px), linear-gradient(90deg, primary 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

            <div className="relative z-10 max-w-7xl mx-auto" onClick={(e) => e.stopPropagation()}>
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-primary"></span>
                            <span className="text-primary text-[10px] font-black tracking-[0.5em] uppercase">{t("Insights")}</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-secondary uppercase tracking-tighter">
                            {t("ANALYZE ")}
                            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">{t("SYMPTOMS")}</span>
                        </h2>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="hidden sm:block w-full sm:w-64">
                            <SearchInput searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                        </div>
                        <div className="flex bg-secondary-foreground/40 p-1 rounded-xl border border-secondary/5 backdrop-blur-md">
                            <button onClick={() => { setView("physical"); resetToDefault(); }} className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${view === "physical" ? "bg-primary text-secondary-foreground shadow-lg" : "text-secondary/40 hover:text-secondary"}`}>{t("PHYSICAL SCAN")}</button>
                            <button onClick={() => { setView("systemic"); resetToDefault(); }} className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${view === "systemic" ? "bg-primary text-secondary-foreground shadow-lg" : "text-secondary/40 hover:text-secondary"}`}>{t("GENERAL SYMPTOMS")}</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 group relative bg-secondary/[0.02] border border-secondary/10 rounded-3xl p-8 overflow-hidden">
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-primary/20 animate-[scan_4s_ease-in-out_infinite] pointer-events-none" />
                        <AnimatePresence>
                            {hoveredPart && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-6 left-8 z-30 flex flex-col items-start font-mono">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 bg-primary animate-pulse rounded-full shadow-[0_0_8px_primary" />
                                        <span className="text-[8px] font-black text-primary/60 tracking-[0.2em] uppercase">{t("Status: Active")}</span>
                                    </div>
                                    <div className="bg-secondary-foreground/60 backdrop-blur-sm border-l-2 border-primary px-2 py-1">
                                        <span className="text-[8px] text-secondary font-black tracking-widest uppercase">{t("SCANNING")}: {t(NORMALIZE_PART[hoveredPart] || `${hoveredPart}`)}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative z-10 h-[550px] flex items-center justify-center biometric-scanner" onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}>
                            <AnimatePresence mode="wait">
                                {view === "physical" ? (
                                    <motion.div key="body" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} className="w-full h-full">
                                        <BodySvg
                                            className="w-full h-full drop-shadow-[0_0_15px_rgba(173,123,189,0.1)] transition-transform hover:scale-[1.01] duration-700"
                                            onClick={(e: any) => {
                                                const id = e.target.id || e.target.parentElement?.id;
                                                const normalized = NORMALIZE_PART[id];
                                                setSearchQuery("");
                                                if (normalized) setSelectedPart(normalized);
                                                else if (id === "body") setSelectedPart("skin");
                                                else setSelectedPart(null);
                                            }}
                                            onMouseOver={(e: any) => {
                                                const id = e.target.id || e.target.parentElement?.id;
                                                const normalized = NORMALIZE_PART[id];
                                                if (normalized) setHoveredPart(normalized);
                                                else if (id === "body") setHoveredPart(t("skin"));
                                                else setHoveredPart(null);
                                            }}
                                            onMouseOut={() => setHoveredPart(null)}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div key="neural" initial={{ opacity: 0, rotateY: 90 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: -90 }} className="flex flex-col items-center justify-center text-primary">
                                        <Brain className="w-48 h-48 stroke-[0.5px] animate-pulse" />
                                        <div className="mt-8 space-y-2 text-center">
                                            <p className="text-[10px] font-black tracking-[0.5em] uppercase opacity-50">{t("Internal symptoms")}</p>
                                            <p className="text-secondary/80 text-xs font-mono">{t("Select what you're feeling overall")}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col gap-6">
                        <div className="sm:hidden mb-4">
                            <SearchInput searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                        </div>
                        <div className="bg-secondary/[0.02] border border-secondary/10 rounded-3xl p-6 min-h-[450px]">
                            <AnimatePresence mode="wait">
                                {searchQuery ? (
                                    <motion.div key="search-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                        <div className="flex items-center justify-between mb-8 border-b border-primary/30 pb-4">
                                            <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">{t("GLOBAL MATCHES")}</h3>
                                            <span className="text-[10px] font-mono text-primary/60">{filteredResults?.length} {t(" matches found")}</span>
                                        </div>
                                        <div className="space-y-3 overflow-y-auto pr-3 custom-scrollbar max-h-[340px]">
                                            {filteredResults?.length === 0 ? (
                                                <div className="h-[200px] flex flex-col items-center justify-center opacity-30">
                                                    <Database className="w-10 h-10 mb-2" />
                                                    <p className="text-[10px] font-mono">{t("Zero matches for ")}{searchQuery}</p>
                                                </div>
                                            ) : (
                                                filteredResults?.map((res) => (
                                                    <SymptomRow key={res.id} label={res.label} value={values[res.id]} onSelect={(v) => handleSelect(res.id, v)} onRemove={() => handleRemove(res.id)} />
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                ) : view === "physical" ? (
                                    <motion.div key="phys-list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                        {!selectedPart ? (
                                            <div className="h-[400px] flex flex-col items-center justify-center text-center opacity-40">
                                                <ScanFace className="w-12 h-12 mb-4" />
                                                <p className="font-mono text-[10px] tracking-[0.4em] uppercase">{t("Identify body zone on scanner")}</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-8 border-b border-secondary/10 pb-4">
                                                    <h3 className="text-2xl font-black text-secondary uppercase tracking-tighter">{t(NORMALIZE_PART[selectedPart] || `${selectedPart}`)}</h3>
                                                    <Activity className="text-primary w-5 h-5 animate-pulse" />
                                                </div>
                                                <div className="space-y-3 overflow-y-auto pr-3 custom-scrollbar max-h-[340px]">
                                                    {SYMPTOMS_BY_PART[selectedPart]?.map((s) => (
                                                        <SymptomRow key={s} label={t(s)} value={values[s]} onSelect={(v) => handleSelect(s, v)} onRemove={() => handleRemove(s)} />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div key="sys-list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                        <div className="flex items-center justify-between mb-8 border-b border-secondary/10 pb-4">
                                            <h3 className="text-2xl font-black text-secondary uppercase tracking-tighter">{t("GENERAL_SYMPTOMS")}</h3>
                                            <Zap className="text-primary w-5 h-5 animate-bounce" />
                                        </div>
                                        <div className="space-y-3 overflow-y-auto pr-3 custom-scrollbar max-h-[340px]">
                                            {SYSTEMIC_SYMPTOMS.map((s) => (
                                                <SymptomRow key={s.id} label={t(s.label)} value={values[s.id]} onSelect={(v) => handleSelect(s.id, v)} onRemove={() => handleRemove(s.id)} />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <ActiveLog values={values} activeSymptomsCount={activeSymptomsCount} handleRemove={handleRemove} />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {hoveredPart && view === "physical" && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                                className="pointer-events-none fixed z-50 bg-secondary-foreground/95 border border-primary/50 text-primary px-4 py-2 rounded-lg text-[10px] font-mono tracking-widest uppercase shadow-[0_0_20px_rgba(173,123,189,0.3)] backdrop-blur-md flex items-center gap-3"
                                style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}>
                        <Target className="w-4 h-4 animate-spin-slow" />
                        <span className="font-black text-xs"> {t(NORMALIZE_PART[hoveredPart] || `${hoveredPart}`)} </span>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .biometric-scanner svg [id] { cursor: crosshair !important; transition: fill 0.3s ease; }
                .biometric-scanner svg [id]:hover { fill: rgba(173,123,189,0.4) !important; }
                @keyframes scan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
                .animate-spin-slow { animation: spin 4s linear infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(173, 123, 189, 0.2); border-radius: 10px; }
            `}</style>
        </section>
    );
}