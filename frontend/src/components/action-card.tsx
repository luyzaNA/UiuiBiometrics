import { ArrowRight } from "lucide-react";

export const ActionCard = ({
                               icon: Icon,
                               title,
                               description,
                               actionText,
                               variant = "outline",
                               onClick
                           }) => {
    const isPrimary = variant === "primary";

    return (
        <button
            onClick={onClick}
            className={`group flex flex-col text-left p-4 rounded-xl transition-all hover:scale-[1.02] ${
                isPrimary
                    ? "bg-primary hover:bg-primary/90 text-secondary shadow-md shadow-primary/20"
                    : "bg-secondary/5 hover:bg-secondary/10 border border-secondary/10"
            }`}
        >
            <div className={`p-2 rounded-lg w-fit mb-3 ${
                isPrimary ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"
            }`}>
                <Icon size={18} />
            </div>

            <div>
                <h5 className="font-bold text-secondary text-sm">{title}</h5>
                <p className={`text-xs mt-1 leading-tight ${
                    isPrimary ? "text-secondary/80" : "text-secondary/50"
                }`}>
                    {description}
                </p>
            </div>

            <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mt-3 group-hover:translate-x-1 transition-transform ${
                isPrimary ? "text-secondary" : "text-primary"
            }`}>
                {actionText} <ArrowRight size={12} />
            </div>
        </button>
    );
};