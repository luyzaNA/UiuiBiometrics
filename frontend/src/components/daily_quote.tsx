import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { type QuoteItem, QUOTES_DATA } from "@/data/quotes.ts";

export function Daily_quote() {
    const { t } = useTranslation();
    const [dailyQuote, setDailyQuote] = useState<QuoteItem | null>(null);

    useEffect(() => {
        const today = new Date();
        const dateHash = today.getFullYear() + today.getMonth() + today.getDate();
        const quoteIndex = dateHash % QUOTES_DATA.length;

        setDailyQuote(QUOTES_DATA[quoteIndex]);
    }, []);

    if (!dailyQuote) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative bg-secondary rounded-[24px] p-8 md:p-10 border border-secondary-foreground/5 shadow-[0_4px_30px_rgba(0,0,0,0.01)] flex flex-col gap-6 group"
        >
            <Quote className="absolute -top-4 -left-4 w-24 h-24 text-secondary-foreground/[0.03] -rotate-12 pointer-events-none transition-transform group-hover:scale-110 duration-500" />

            <p className="text-lg md:text-xl font-medium tracking-wide text-secondary-foreground/80 leading-relaxed max-w-4xl italic">
                {t(dailyQuote.text)}
            </p>

            <div className="flex justify-end items-center gap-3 mt-2 self-end pr-2">
                <span className="w-4 h-[1px] bg-primary/60"></span>
                <span className="text-xs font-black tracking-[0.15em] uppercase text-secondary-foreground/60 text-right">
                    {dailyQuote.author}
                </span>
            </div>
        </motion.div>
    );
}