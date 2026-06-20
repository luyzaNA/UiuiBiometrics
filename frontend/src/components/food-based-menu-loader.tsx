interface Deficiency {
    nutrient: string;
}

interface NutritionLoaderProps {
    isLoading: boolean;
    targetDeficiencies?: Deficiency[];
    t?: (key: string) => string;
}

export const FoodBasedMenuLoader = ({
                                        isLoading,
                                        targetDeficiencies = [],
                                        t = (str) => str,
                                    }: NutritionLoaderProps) => {
    if (!isLoading) return null;

    return (
        <div className="min-h-screen bg-secondary-foreground flex flex-col items-center justify-center px-6 animate-in fade-in duration-700">
            <div className="max-w-lg w-full flex flex-col items-center text-center">
                <div className="relative flex items-center justify-center w-32 h-32 mb-12">
                    <div className="absolute inset-0 rounded-full border border-primary/20 border-t-primary/80 animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-3 rounded-full border border-secondary/10 border-b-secondary/50 animate-[spin_4s_linear_infinite_reverse]" />
                    <div className="absolute inset-6 rounded-full border border-primary/10 border-l-primary/60 animate-[spin_1.5s_linear_infinite]" />
                    <div className="absolute inset-10 bg-primary/20 rounded-full shadow-[0_0_30px_rgba(168,85,247,0.4)] animate-pulse flex items-center justify-center backdrop-blur-sm border border-primary/30">
                        <div className="w-2 h-2 bg-secondary rounded-full animate-ping opacity-75" />
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <h2 className="text-xl sm:text-2xl font-light text-secondary tracking-[0.2em] uppercase">
                        {t("Preparing your menu")}
                    </h2>
                    <div className="w-12 h-[1px] bg-primary/50 mx-auto" />
                    <p className="text-secondary/50 text-sm sm:text-base font-light tracking-wide max-w-sm mx-auto leading-relaxed">
                        {t("Choosing the right ingredients to naturally balance your levels of:")}
                    </p>
                </div>

                {targetDeficiencies.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
                        {targetDeficiencies.map((def, idx) => (
                            <div
                                key={def.nutrient}
                                className="relative overflow-hidden px-5 py-2 rounded-none border border-primary/20 bg-secondary-foreground text-secondary text-xs font-medium tracking-widest uppercase shadow-sm group"
                                style={{ animationDelay: `${idx * 150}ms` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />

                                <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full mr-3 mb-[1px] opacity-80" />
                                {t(def.nutrient)}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>

        </div>
    );
};