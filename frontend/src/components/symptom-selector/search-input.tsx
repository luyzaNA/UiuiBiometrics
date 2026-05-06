import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export function SearchInput({ searchQuery, setSearchQuery }: {
    searchQuery: string;
    setSearchQuery: (v: string) => void;
}) {
    const { t } = useTranslation();
    return (
        <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-pulse" />
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("SEARCH_SYMPTOMS...")}
                className="bg-secondary-foreground/40 border border-primary/20 rounded-xl py-2 pl-10 pr-10 text-[10px] font-mono tracking-widest text-secondary placeholder:text-primary/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all w-full"
            />
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-secondary"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}