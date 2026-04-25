import { Container } from '@/components/container'
import {useTranslation} from "react-i18next";

export function Footer() {
    const {t} = useTranslation();

    return (

        <footer className="w-full bg-secondary py-16 border-t border-gray-50 font-sans">
            <Container>
                <div className="flex flex-col items-center gap-10">

                    <div className="flex justify-center">
                        <img
                            src="/logo.svg"
                            alt="Uiui Biometrics"
                            className="h-14 w-auto"
                        />
                    </div>

                    <div className="max-w-md text-center">
                        <p className="text-muted-foreground text-[13px] font-light tracking-tight italic">
                            "{t("The greatest wealth is the intelligence of the human body.")}"
                        </p>
                    </div>

                    <div className="w-full flex flex-col md:flex-row items-center justify-between pt-10 border-t border-gray-50 gap-4">
                        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground/70">
                            © {new Date().getFullYear()} UIUI Biometrics
                        </span>
                        <div className="flex gap-6">
                            <a
                                href="mailto:andreea.luyza.nica@gmail.com"
                                className="text-[9px] font-medium tracking-[0.4em] text-gray-400 hover:text-[#ad7bbd] transition-colors lowercase "
                            >
                                andreea.luyza.nica@gmail.com </a>
                        </div>
                    </div>
                </div>
            </Container>
        </footer>
    )
}