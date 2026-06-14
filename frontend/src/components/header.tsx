import { useState, useEffect, useRef } from "react";
import { Container } from "@/components/container";
import { Link, useNavigate } from "react-router-dom";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
} from "./ui/sheet";
import { Button } from "./ui/button";
import {
    Menu,
    User,
    ArrowRight,
    Globe,
    LogOut,
    ChevronDown,
    Bell,
    CheckCheck
} from "lucide-react";
import { LanguageSelect } from "@/components/language-select.tsx";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
    containerVariants, dropdownAnimation,
    itemVariants,
} from "@/utils/animations.tsx";
import { useUser } from "@/hooks/use-user.ts";
import { profileService } from "@/services/profile-service.ts";
import { doctorService } from "@/services/doctor-service.ts";
import { getInitial } from "@/utils/get-initiasl-from-name.ts";
import { getFirstName } from "@/utils/get-first-name.ts";
import { apiClient } from "@/api/client";
import type { AssessmentI } from "@/models/assesment-model.ts";

interface AppNotification {
    id: string;
    title: string;
    message: string;
    link: string;
    count: number;
    assessmentId?: string;
}

export function Header() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const { user, isAuthenticated, login, logout } = useUser();

    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [name, setName] = useState<string | null>(null);

    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const latestCounts = useRef({ pending: 0, reviews: 0, patientNotes: 0 });

    const isDoctor = user?.["groups"]?.includes("doctor");
    const profileRoute = isDoctor ? "/doctor/profile" : "/profile";

    useEffect(() => {
        const loadHeaderProfile = async () => {
            if (isAuthenticated) {
                try {
                    let profileData;
                    if (isDoctor) {
                        profileData = await doctorService.getMe();
                    } else {
                        profileData = await profileService.getMe();
                    }

                    setAvatarUrl(profileData?.avatarUrl || null);
                    setName(getFirstName(profileData.fullName));
                } catch (error) {
                    console.error("Profile load failed", error);
                }
            } else {
                setAvatarUrl(null);
            }
        };

        loadHeaderProfile();
        window.addEventListener("profile-updated", ((e: CustomEvent) => {
            setAvatarUrl(e.detail.avatarUrl);
            setName(e.detail.fullName?.split(" ")[0]);
        }) as EventListener);
    }, [isAuthenticated, isDoctor]);

    useEffect(() => {
        if (!isAuthenticated) {
            setNotifications([]);
            return;
        }

        const checkUpdates = async () => {
            try {
                const activeNotifications: AppNotification[] = [];

                if (isDoctor) {
                    const [pendingRes, profileRes] = await Promise.all([
                        doctorService.getPendingCount(),
                        doctorService.getMe()
                    ]);

                    const pendingCount = pendingRes.data?.pendingCount ?? (pendingRes as any).pendingCount ?? 0;
                    const totalReviews = profileRes?.totalReviews ?? 0;

                    latestCounts.current = { ...latestCounts.current, pending: pendingCount, reviews: totalReviews };

                    if (pendingCount > 0) {
                        const dismissedPending = localStorage.getItem('dismissedPendingCount');
                        if (dismissedPending !== String(pendingCount)) {
                            activeNotifications.push({
                                id: 'pending-assessments',
                                title: t("Pending Assessments"),
                                message: t("You have received new reports from patients."),
                                link: "/doctor/review/assessments",
                                count: pendingCount
                            });
                        }
                    }

                    if (totalReviews > 0) {
                        const dismissedReviews = localStorage.getItem('dismissedReviewCount');
                        if (dismissedReviews !== String(totalReviews)) {
                            activeNotifications.push({
                                id: 'new-reviews',
                                title: t("New Reviews"),
                                message: t("You have received new reviews from your patients."),
                                link: "/doctor/reviews",
                                count: totalReviews
                            });
                        }
                    }
                } else {
                    const response = await apiClient.get<AssessmentI[]>("/assessments?status=completed");
                    const completedAssessments = response.data || [];

                    const unreadNotes = completedAssessments.filter(assessment => {
                        const isRead = localStorage.getItem(`read_note_${assessment.assessmentId}`) === 'true';
                        return assessment.doctorNotes && !isRead;
                    });

                    latestCounts.current = { ...latestCounts.current, patientNotes: unreadNotes.length };

                    unreadNotes.forEach(assessment => {
                        activeNotifications.push({
                            id: `doctor-notes-${assessment.assessmentId}`,
                            title: t("Medical Feedback"),
                            message: t("A doctor has reviewed your assessment and left notes."),
                            link: `/assessment/details/${assessment.cognitoSub}/${assessment.assessmentId}`,
                            count: 1,
                            assessmentId: assessment.assessmentId
                        });
                    });
                }

                setNotifications(activeNotifications);
            } catch (error) {
                console.error("Error polling notifications:", error);
            }
        };

        checkUpdates();
        const intervalId = setInterval(checkUpdates, 3000);

        return () => clearInterval(intervalId);
    }, [isAuthenticated, isDoctor, t]);

    const markAllAsRead = () => {
        if (isDoctor) {
            localStorage.setItem('dismissedPendingCount', String(latestCounts.current.pending));
            localStorage.setItem('dismissedReviewCount', String(latestCounts.current.reviews));
        } else {
            notifications.forEach(notif => {
                if (notif.id.startsWith('doctor-notes-') && notif.assessmentId) {
                    localStorage.setItem(`read_note_${notif.assessmentId}`, 'true');
                }
            });
        }
        setNotifications([]);
        setIsNotifOpen(false);
    };

    const handleNotificationClick = (notif: AppNotification) => {
        if (notif.id === 'pending-assessments') {
            localStorage.setItem('dismissedPendingCount', String(notif.count));
        } else if (notif.id === 'new-reviews') {
            localStorage.setItem('dismissedReviewCount', String(notif.count));
        } else if (notif.id.startsWith('doctor-notes-')) {
            if (notif.assessmentId) {
                localStorage.setItem(`read_note_${notif.assessmentId}`, 'true');
            }
        }

        setNotifications(notifications.filter(n => n.id !== notif.id));
        setIsNotifOpen(false);
        navigate(notif.link);
    };

    const navItems = [
        { label: t("Home"), href: "/#home" },
        { label: t("Experience"), href: "/#how-it-works" },
        { label: t("Science"), href: "/#science" },
    ];

    return (
        <header className="fixed top-0 z-[100] w-full bg-navbar backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500">
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-secondary/5 z-20" />
            <nav>
                <Container className="relative flex justify-between items-center py-8">
                    <div className="relative z-10 flex items-center gap-16">
                        <div className={`relative w-24 h-5 flex items-center transition-all duration-500 ${isOpen ? "opacity-0 scale-90" : "opacity-100"}`}>
                            <Link to="/" className="group absolute top-1/2 left-0 -translate-y-1/2 flex items-center gap-2">
                                <div className="relative w-20 h-20 md:w-24 md:h-24 p-2 transition-all duration-700 group-hover:scale-110">
                                    <img src="/logo_header.svg" alt="Logo" className="w-full h-full object-contain" />
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

                    <div className="flex items-center gap-4 lg:gap-6 z-10 ">

                        {isAuthenticated && (
                            <div className="lg:hidden relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate(isDoctor ? '/doctor/review/assessments' : '/profile')}
                                    className="relative active:scale-90 rounded-full transition-transform"
                                >
                                    <Bell className="h-5 w-5 text-primary" />
                                    {notifications.length > 0 && (
                                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-navbar" />
                                    )}
                                </Button>
                            </div>
                        )}

                        <div className="lg:hidden">
                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="active:scale-90 rounded-full transition-transform">
                                        <Menu className="h-6 w-6 text-primary" />
                                    </Button>
                                </SheetTrigger>

                                <SheetContent className="w-[85%] sm:w-[400px] flex flex-col bg-navbar/95 backdrop-blur-2xl px-6 py-10 z-[110] border-l border-secondary/10 shadow-2xl">
                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col h-full overflow-y-auto pr-1 custom-scrollbar">
                                                <motion.div variants={itemVariants} className="flex justify-center mb-10 shrink-0">
                                                    <div className="relative p-4 rounded-3xl bg-secondary/5 border border-secondary/10 shadow-inner">
                                                        <img src="/logo.svg" alt="Logo" className="w-32 h-32 object-contain" />
                                                    </div>
                                                </motion.div>

                                                <div className="flex flex-col gap-3 relative z-10 shrink-0">
                                                    {navItems.map((item) => (
                                                        <motion.div key={item.href} variants={itemVariants}>
                                                            <SheetClose asChild>
                                                                <Link to={item.href} className="relative flex items-center justify-between px-6 py-5 rounded-2xl bg-secondary[0.03] border border-secondary/5 active:bg-secondary/[0.08] transition-all">
                                                                    <span className="text-lg font-bold tracking-tight text-secondary-foreground/90">{item.label}</span>
                                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                        <ArrowRight strokeWidth={2} className="w-4 h-4 text-primary" />
                                                                    </div>
                                                                </Link>
                                                            </SheetClose>
                                                        </motion.div>
                                                    ))}

                                                    <motion.div variants={itemVariants} className="mt-4 shrink-0">
                                                        <div className="flex items-center justify-between px-6 py-4 rounded-2xl bg-primary/5 border border-primary/10">
                                                            <div className="flex items-center gap-3">
                                                                <Globe className="w-4 h-4 text-primary/60" />
                                                                <span className="text-[10px] font-black text-primary/70 uppercase tracking-widest">{t("Language")}</span>
                                                            </div>
                                                            <LanguageSelect trigger={
                                                                <button className="h-auto p-0 text-xs text-primary font-black uppercase tracking-widest active:opacity-50 bg-transparent border-none outline-none">
                                                                    {i18n.language}
                                                                </button>
                                                            } />
                                                        </div>
                                                    </motion.div>
                                                </div>

                                                <div className="mt-auto pt-8 pb-12 border-t border-secondary/5 shrink-0">
                                                    <motion.div variants={itemVariants} className="flex flex-col gap-3">
                                                        {isAuthenticated ? (
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <SheetClose asChild>
                                                                    <Link to={profileRoute} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-secondary/[0.03] border border-secondary/5 active:bg-secondary/[0.08] transition-colors">
                                                                        <User strokeWidth={1.5} className="w-5 h-5 text-secondary-foreground/70" />
                                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-secondary-foreground/70">{t("Profile")}</span>
                                                                    </Link>
                                                                </SheetClose>

                                                                <button onClick={() => { setIsOpen(false); logout(); }} className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-destructive/5 border border-destructive/10 active:bg-destructive/10 transition-all text-destructive">
                                                                    <LogOut strokeWidth={1.5} className="w-5 h-5" />
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{t("Logout")}</span>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <motion.button whileTap={{ scale: 0.96 }} onClick={() => login()} className="flex items-center justify-center gap-3 py-5 px-6 rounded-2xl bg-primary shadow-[0_10px_20px_rgba(0,0,0,0.2)] active:shadow-none transition-all">
                                                                <User strokeWidth={2} className="w-5 h-5 text-secondary" />
                                                                <span className="text-sm font-black uppercase tracking-[0.2em] text-secondary">{t("Login")}</span>
                                                            </motion.button>
                                                        )}
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </SheetContent>
                            </Sheet>
                        </div>

                        <div className="hidden lg:flex items-center gap-8">
                            <LanguageSelect trigger={
                                <Button className="bg-transparent hover:bg-secondary/5 group flex items-center gap-2.5 h-auto p-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition-all">
                                    <Globe strokeWidth={1} className="w-3.5 h-3.5" />
                                    <span>{i18n.language}</span>
                                </Button>
                            } />

                            <div className="h-4 w-[1px] bg-secondary/10" />

                            {isAuthenticated ? (
                                <div className="flex items-center gap-6">
                                    <div
                                        className="relative"
                                        onMouseEnter={() => setIsNotifOpen(true)}
                                        onMouseLeave={() => setIsNotifOpen(false)}
                                    >
                                        <button className="relative p-2 rounded-full hover:bg-secondary/5 transition-colors z-[120]">
                                            <Bell strokeWidth={1.5} className="w-5 h-5 text-primary" />
                                            {notifications.length > 0 && (
                                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-navbar" />
                                            )}
                                        </button>

                                        <AnimatePresence>
                                            {isNotifOpen && (
                                                <motion.div variants={dropdownAnimation} initial="initial" animate="animate" exit="exit" className="absolute right-0 top-full w-80 pt-3 z-[110]">
                                                    <div className="overflow-hidden rounded-2xl border border-secondary/10 bg-navbar backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                                                        <div className="flex items-center justify-between px-4 py-3 border-b border-secondary/5">
                                                            <span className="text-xs font-bold uppercase tracking-wider text-primary">{t("Notifications")}</span>
                                                            {notifications.length > 0 && (
                                                                <button onClick={markAllAsRead} className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors hover:cursor-pointer">
                                                                    <CheckCheck className="w-3 h-3" />
                                                                    {t("Mark all as read")}
                                                                </button>
                                                            )}
                                                        </div>

                                                        <div className="max-h-[300px] overflow-y-auto">
                                                            {notifications.length === 0 ? (
                                                                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                                                                    {t("No new notifications")}
                                                                </div>
                                                            ) : (
                                                                notifications.map(notif => (
                                                                    <button
                                                                        key={notif.id}
                                                                        onClick={() => handleNotificationClick(notif)}
                                                                        className="w-full flex flex-col gap-1 p-4 text-left hover:bg-secondary/5 transition-colors border-b border-secondary/5 last:border-0 hover:cursor-pointer"
                                                                    >
                                                                        <span className="text-sm font-semibold text-secondary-foreground/70">{notif.title}</span>
                                                                        <span className="text-xs text-muted-foreground leading-relaxed">{notif.message}</span>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div
                                        className="relative"
                                        onMouseEnter={() => setIsProfileOpen(true)}
                                        onMouseLeave={() => setIsProfileOpen(false)}
                                    >
                                        <button className="group relative flex items-center gap-3 py-1 px-3 cursor-pointer outline-none z-[120]">
                                            <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary text-secondary flex items-center justify-center text-sm font-bold shadow-lg transition-transform duration-500 group-hover:scale-105 overflow-hidden">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    getInitial(name)
                                                )}
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">{name}</span>
                                                <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest leading-none">{t("Account")}</span>
                                            </div>
                                            <ChevronDown className={`w-3.5 h-3.5 text-primary/50 transition-transform duration-500 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isProfileOpen && (
                                                <motion.div variants={dropdownAnimation} initial="initial" animate="animate" exit="exit" className="absolute right-0 top-full w-56 pt-3 z-[110]">
                                                    <div className="overflow-hidden rounded-2xl border border-secondary/10 bg-navbar backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                                                        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

                                                        <div className="p-2 flex flex-col gap-1">
                                                            <div className="px-4 py-3 mb-1 border-b border-secondary/5">
                                                                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t("Signed in as")}</p>
                                                                <p className="text-xs font-bold text-secondary-foreground truncate">{user?.email}</p>
                                                            </div>
                                                            <Link to={profileRoute} className="group flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all hover:bg-secondary/5">
                                                                <User className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" strokeWidth={1.5} />
                                                                <span className="text-[11px] font-medium tracking-wide text-secondary-foreground/80 group-hover:text-primary">{t("Profile Settings")}</span>
                                                            </Link>

                                                            <button onClick={logout} className="group flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all hover:bg-destructive/5 w-full text-left cursor-pointer">
                                                                <LogOut className="w-4 h-4 text-destructive/50 group-hover:text-destructive transition-colors" strokeWidth={1.5} />
                                                                <span className="text-[11px] font-medium tracking-wide text-destructive/70 group-hover:text-destructive">{t("Logout")}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => login()} className="group relative flex items-center gap-3 py-2 px-4 cursor-pointer transition-all duration-500">
                                    <div className="absolute inset-0 rounded-full bg-primary/5 scale-0 group-hover:scale-100 transition-transform duration-500 ease-out" />
                                    <User strokeWidth={1} className="w-5 h-5 text-primary transition-all duration-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(232,157,245,0.5)]" />
                                    <span className="relative text-[12px] font-medium uppercase tracking-[0.4em] text-primary transition-all duration-500 group-hover:tracking-[0.5em]">
                                        {t("Login")}
                                        <span className="absolute -bottom-1 left-1/2 w-0 h-[1px] bg-primary/40 -translate-x-1/2 transition-all duration-500 group-hover:w-full shadow-[0_0_8px_rgba(232,157,245,0.3)]" />
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>
                </Container>
            </nav>
        </header>
    );
}