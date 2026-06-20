import { useState, useEffect, useRef } from 'react';
import { Sparkles, Check, Loader2, Apple, Utensils } from 'lucide-react';

interface Deficiency {
    nutrient: string;
}

interface FoodBasedMenuLoaderProps {
    isLoading: boolean;
    loadingProgress?: number;
    loadingMessage?: string;
    targetDeficiencies?: Deficiency[];
    t?: (key: string) => string;
}

const MEAL_EMOJIS = [
    ['🍳', '🥑', '🥞', '🥓', '🍓'],
    ['🥗', '🥪', '🍅', '🥕', '🍛'],
    ['🥦', '🍲', '🐟', '🥩', '🍆'],
    ['🥜', '🫐', '🍉', '🍎', '🍌'],
    ['✨', '🌿', '💧', '🪄', '☀️']
];


export const MealsBasedMenuLoader = ({
                                         isLoading,
                                         loadingProgress = 0,
                                         loadingMessage,
                                         targetDeficiencies = [],
                                         t = (str) => str,
                                     }: FoodBasedMenuLoaderProps) => {
    const [score, setScore] = useState(0);
    const [fallingItems, setFallingItems] = useState<{ id: string; x: number; emoji: string }[]>([]);
    const [plateX, setPlateX] = useState(50);
    const gameAreaRef = useRef<HTMLDivElement>(null);

    const steps = [
        { id: 20, label: t("Formulating Breakfast Recipes") },
        { id: 45, label: t("Balancing Lunch Nutrition") },
        { id: 70, label: t("Designing Therapeutic Dinners") },
        { id: 90, label: t("Compiling Synergistic Snacks") },
        { id: 98, label: t("Final Alignment & Verification") }
    ];

    const currentStepIndex = steps.findIndex(s => loadingProgress <= s.id);
    const activeIndex = currentStepIndex === -1 ? 4 : currentStepIndex;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!gameAreaRef.current) return;
        const rect = gameAreaRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        setPlateX(Math.max(10, Math.min(90, x)));
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!gameAreaRef.current || !e.touches[0]) return;
        const rect = gameAreaRef.current.getBoundingClientRect();
        const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
        setPlateX(Math.max(10, Math.min(90, x)));
    };

    useEffect(() => {
        if (!isLoading) return;
        const interval = setInterval(() => {
            setFallingItems(prev => {
                const newItem = {
                    id: Math.random().toString(36).substr(2, 9),
                    x: Math.floor(Math.random() * 70) + 15,
                    emoji: MEAL_EMOJIS[activeIndex][Math.floor(Math.random() * 5)],
                };
                return [...prev, newItem].slice(-4);
            });
        }, 800);

        return () => clearInterval(interval);
    }, [activeIndex, isLoading]);

    const catchFood = (id: string, itemX: number) => {
        setScore(s => s + 1);
        setPlateX(itemX);
        setFallingItems(prev => prev.filter(item => item.id !== id));
    };

    if (!isLoading) return null;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-8 animate-in fade-in duration-700 selection:bg-primary/20 select-none">

            <style>{`
                @keyframes fallDown {
                    0% { transform: translateY(-30px) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(180px) rotate(120deg); opacity: 0; }
                }
                .falling-food {
                    animation: fallDown 2.5s linear forwards;
                }
            `}</style>

            <div className="w-full max-w-md bg-secondary/10 border border-primary/20 p-6 sm:p-8 rounded-[2rem] shadow-2xl backdrop-blur-md space-y-6 relative overflow-hidden">

                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

                <div
                    ref={gameAreaRef}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleTouchMove}
                    className="relative z-10 w-full h-44 bg-background/50 border border-foreground/10 rounded-2xl overflow-hidden flex flex-col justify-between cursor-crosshair"
                >
                    <div className="w-full flex justify-between items-center px-4 py-2 bg-foreground/5 backdrop-blur-sm z-20">
                        <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                            {activeIndex === 4 ? t("Catch the Magic!") : t("Move & Tap to Catch!")}
                        </span>
                        <div className="flex items-center gap-1.5 bg-primary/20 px-3 py-1 rounded-full border border-primary/30">
                            <Utensils size={12} className="text-primary" />
                            <span className="text-xs font-bold text-primary">{score}</span>
                        </div>
                    </div>

                    <div className="absolute inset-0 top-10 overflow-hidden pointer-events-none z-10">
                        {fallingItems.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => catchFood(item.id, item.x)}
                                className="absolute text-3xl cursor-pointer pointer-events-auto hover:scale-120 active:scale-90 transition-transform falling-food drop-shadow-lg select-none"
                                style={{ left: `${item.x}%` }}
                            >
                                {item.emoji}
                            </div>
                        ))}
                    </div>

                    <div
                        className="absolute bottom-3 w-20 h-3 bg-foreground/10 rounded-full border-b-4 border-primary/60 drop-shadow-md transition-all duration-75 ease-out pointer-events-none z-10"
                        style={{
                            left: `${plateX}%`,
                            transform: 'translateX(-50%)'
                        }}
                    />
                </div>

                <div className="flex flex-col items-center text-center space-y-2 relative z-10 pt-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                        {t("Crafting your menu")}
                        <Sparkles className="text-primary animate-pulse" size={20} />
                    </h2>
                    <p className="text-xs text-muted-foreground max-w-[260px] leading-relaxed">
                        {loadingMessage || t("Designing your personalized nutritional profile based on your biomarkers.")}
                    </p>
                </div>

                <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60">
                            {t("AI Status")}
                        </span>
                        <span className="text-3xl font-light tracking-tighter text-primary font-mono">
                            {loadingProgress}%
                        </span>
                    </div>
                    <div className="w-full h-2.5 bg-foreground/10 rounded-full overflow-hidden p-[2px]">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)] relative"
                            style={{ width: `${loadingProgress}%` }}
                        >
                            <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/30" />
                        </div>
                    </div>
                </div>

                <div className="border-t border-foreground/10 pt-5 space-y-3 relative z-10">
                    {steps.map((step) => {
                        const isDone = loadingProgress > step.id;
                        const isCurrent = loadingProgress === step.id || (loadingProgress < step.id && (steps[steps.indexOf(step) - 1]?.id ? loadingProgress > steps[steps.indexOf(step) - 1].id : true));

                        return (
                            <div
                                key={step.id}
                                className={`flex items-center gap-3 transition-all duration-300 ${
                                    isDone ? 'opacity-100' : isCurrent ? 'opacity-100 translate-x-2' : 'opacity-30'
                                }`}
                            >
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-500 ${
                                    isDone ? 'bg-primary/20 border-primary text-primary scale-100' :
                                        isCurrent ? 'border-primary bg-background shadow-[0_0_10px_rgba(var(--primary),0.4)]' : 'border-foreground/20'
                                }`}>
                                    {isDone ? (
                                        <Check size={12} className="stroke-[3]" />
                                    ) : isCurrent ? (
                                        <Loader2 size={12} className="animate-spin text-primary" />
                                    ) : (
                                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full" />
                                    )}
                                </div>
                                <span className={`text-xs font-medium tracking-wide ${isCurrent ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {targetDeficiencies.length > 0 && (
                <div className="mt-8 text-center space-y-3 max-w-lg relative z-10">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground/60">
                        <Apple size={14} />
                        <span className="text-[10px] font-bold tracking-widest uppercase">
                            {t("Replenishing your levels")}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                        {targetDeficiencies.map((def) => (
                            <span
                                key={def.nutrient}
                                className="text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full shadow-sm tracking-widest uppercase"
                            >
                                {t(def.nutrient)}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};