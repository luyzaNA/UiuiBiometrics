import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

export function LanguageSelect({trigger}: { trigger: React.ReactNode }) {
    const { i18n, t } = useTranslation();

    const languages = [
        { code: "en", label: t("language.en", "English") },
        { code: "ro", label: t("language.ro", "Română") },
    ];

    return (
        <DropdownMenu modal={false}> {/* modal={false} prevents the body scroll lock/jump */}
            <DropdownMenuTrigger asChild>
                <div className="data-[state=open]:text-[#ad7bbd] transition-colors cursor-pointer">
                    {trigger}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-40 z-[110]"
                align="center"
                sideOffset={8}
            >
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => i18n.changeLanguage(lang.code)}
                        className="cursor-pointer"
                    >
                        {lang.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}