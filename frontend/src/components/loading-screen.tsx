import { motion, AnimatePresence } from "framer-motion";

export function LoadingScreen({ isLoading }: { isLoading: boolean }) {
    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
                    }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505]"
                >
                    {/* Central Animated Aura */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute w-[500px] h-[500px] bg-primary rounded-full blur-[150px]"
                    />

                    <div className="relative flex flex-col items-center">
                        {/* The SVG Frequency Path */}
                        <svg width="200" height="60" viewBox="0 0 200 60" fill="none">
                            <motion.path
                                d="M0 30H40L50 10L70 50L80 30H120L130 20L145 40L155 30H200"
                                stroke="currentColor"
                                strokeWidth="2"
                                className="text-primary"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{
                                    pathLength: [0, 1, 1],
                                    opacity: [0, 1, 0],
                                    pathOffset: [0, 0, 1]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                            />
                        </svg>

                        {/* Ultra-Minimalist Text */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="mt-8 text-[9px] uppercase tracking-[1.2em] text-primary/60 font-black ml-[1.2em]"
                        >
                            Please wait
                        </motion.div>
                    </div>

                    {/* Vignette Effect */}
                    <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/80 pointer-events-none" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}