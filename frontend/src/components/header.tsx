import { useState } from 'react'
import { Container } from '@/components/container'
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "./ui/sheet";
import { Button } from "./ui/button";
import { Menu, User, ArrowRight, Globe } from "lucide-react";
import { LanguageSelect } from "@/components/language-select.tsx";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {containerVariants, itemVariants} from "@/utils/animations.tsx";

export function Header() {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { label: t("Home"), href: "/#home" },
        { label: t("Experience"), href: "/#how-it-works" },
        { label: t("Science"), href: "/#science" },
    ];

    return (
        <header className="fixed top-0 z-[100] w-full bg-navbar backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500">
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-navbar z-20" />
            <nav>
                <Container className="relative flex justify-between items-center py-8">
                    <div className="relative z-10 flex items-center gap-16">
                        <div
                            className={`relative w-24 h-5 flex items-center transition-all duration-500 ease-in-out ${
                                isOpen
                                    ? 'opacity-0 scale-90 pointer-events-none' 
                                    : 'opacity-100 scale-100'                    
                            }`}
                        >
                            <Link to="/" aria-label="Home" className="group absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-2">
                                <div className="relative w-20 h-20 md:w-24 md:h-24 p-2 flex items-center justify-center transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-[-5deg]">
                                    <img src="/logo_header.svg" alt="Logo" className="w-full h-full object-contain relative z-10" />
                                </div>
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                                    <span className="text-[10px] font-black tracking-[0.5em] uppercase text-primary">
                                        {t("Precision")}
                                    </span>
                                </div>
                            </Link>
                        </div>
                        <div className="hidden lg:flex lg:items-center lg:gap-10">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className="relative text-[11px] font-medium uppercase tracking-[0.2em] text-secondary-foreground hover:text-primary transition-colors group py-2"
                                >
                                    {item.label}
                                    <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-primary -translate-x-1/2 group-hover:w-full transition-all duration-300 shadow-[0_0_8px_#e89df5]" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 z-10">
                        <div className="lg:hidden">
                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover:bg-[#adcce0]/20 rounded-full transition-colors">
                                        <Menu className="h-6 w-6 text-primary" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent className="w-[85%] sm:w-[400px] flex flex-col bg-navbar px-8 py-10 z-[110] border-l border-white/10">
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="show"
                                                className="flex flex-col h-full"
                                            >
                                                <motion.div variants={itemVariants} className="flex flex-col items-center gap-4 mb-12">
                                                    <img src="/logo.svg" alt="Logo" className="w-40 h-40 object-contain" />
                                                </motion.div>

                                                <div className="flex flex-col gap-2 relative z-10">
                                                    {navItems.map((item) => (
                                                        <motion.div key={item.href} variants={itemVariants}>
                                                            <SheetClose asChild>
                                                                <Link
                                                                    to={item.href}
                                                                    className="group flex items-center justify-between py-6 text-lg font-black text-secondary-foreground/70 border-b border-gray-100 hover:text-primary transition-colors"
                                                                >
                                                                    {item.label}
                                                                    <ArrowRight strokeWidth={1} className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                                                                </Link>
                                                            </SheetClose>
                                                        </motion.div>
                                                    ))}

                                                    <motion.div variants={itemVariants} className="flex items-center justify-between py-8">
                                                        <span className="text-[10px] font-black text-secondary-foreground/70 uppercase tracking-widest">{t("Language")}</span>
                                                        <LanguageSelect
                                                            trigger={
                                                                <Button variant="ghost" className="h-auto p-0 text-xs text-secondary-foreground/70 font-black uppercase tracking-widest">
                                                                    {i18n.language}
                                                                </Button>
                                                            }
                                                        />
                                                    </motion.div>
                                                </div>
                                                <span className="border border-t border-gray-100"/>
                                                <motion.div variants={itemVariants} className=" flex flex-col items-center gap-4 mt-8">
                                                    <Link to="/login" className="group relative flex items-center gap-3 py-1 px-2 overflow-hidden">
                                                        <User strokeWidth={1} className="w-5 h-5 text-primary" />
                                                        <span className="text-[12px] font-medium uppercase tracking-[0.4em] text-primary">
                                                            {t("Login")}
                                                        </span>
                                                    </Link>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </SheetContent>
                            </Sheet>
                        </div>
                        <div className="flex items-center gap-8 max-lg:hidden">
                            <div className="flex items-center hover:bg-white transition-colors">
                                <LanguageSelect
                                    trigger={
                                        <Button
                                            className="bg-secondary hover:bg-secondary group flex items-center gap-2.5 h-auto p-0 text-[11px] font-bold uppercase tracking-[0.2em] text-primary hover:text-secondary-foreground transition-all duration-300"
                                        >
                                            <Globe
                                                strokeWidth={1}
                                                className="w-3.5 h-3.5 text-primary  group-hover:text-secondary-foreground transition-colors duration-300"
                                            />
                                            <span>{i18n.language}</span>
                                        </Button>
                                    }
                                />
                        </div>
                            <div className="h-4 w-[1px] bg-primary/20" />
                            <Link to="/login" className="group relative flex items-center gap-3 py-1 px-2 overflow-hidden">
                                <User
                                    strokeWidth={1}
                                    className="w-5 h-5 text-primary group-hover:text-secondary-foreground transition-colors duration-500"
                                />
                                <span className="text-[12px] font-medium uppercase tracking-[0.4em] text-primary group-hover:text-secondary-foreground transition-all duration-500">
                                    {t("Login")}
                                </span>
                                <span className="absolute bottom-0 left-2 w-0 h-[1px] bg-secondary-foreground group-hover:w-[calc(100%-16px)] transition-all duration-500 ease-out" />
                            </Link>
                        </div>
                    </div>
                </Container>
            </nav>
        </header>
    );
}