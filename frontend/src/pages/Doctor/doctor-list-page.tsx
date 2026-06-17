import {useState, useEffect, useMemo, useRef} from 'react';
import {motion} from 'framer-motion';
import {useTranslation} from "react-i18next";
import {Search, Star, User, SlidersHorizontal, Loader2} from 'lucide-react';
import {useSearchParams} from 'react-router-dom';

import {doctorService} from "@/services/doctor-service.ts";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import type {DoctorProfileI} from "@/models/doctor-model.ts";
import {toast} from "sonner";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select.tsx";

type SortOption = 'none' | 'rating-desc';

export default function DoctorsPage() {
    const {t} = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const assessmentId = searchParams.get('assessmentId');
    const paymentSuccess = searchParams.get('success');
    const paymentCanceled = searchParams.get('canceled');

    const [doctors, setDoctors] = useState<DoctorProfileI[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [sortBy, setSortBy] = useState<SortOption>('none');


    const paymentHandled = useRef(false);

    useEffect(() => {
        if (paymentHandled.current) return;

        if (paymentSuccess) {
            paymentHandled.current = true;

            setSearchParams((prev) => {
                prev.delete('success');
                return prev;
            }, {replace: true});

            setTimeout(() => {
                toast.success(t("Payment successful! Your report has been sent to the doctor."));
            }, 1500);
        }

        if (paymentCanceled) {
            paymentHandled.current = true;

            setSearchParams((prev) => {
                prev.delete('canceled');
                return prev;
            }, {replace: true});

            toast.error(t("Payment was canceled. You can try again when you're ready."));
        }
    }, [paymentSuccess, paymentCanceled, setSearchParams, t]);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                setLoading(true);
                const data = await doctorService.getAll();
                setDoctors(data);
            } catch (error) {
                console.error("The doctors list couldn't be loaded", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDoctors();
    }, []);

    const filteredAndSortedDoctors = useMemo(() => {
        let result = [...doctors];

        if (searchQuery.trim() !== '') {
            result = result.filter(doc =>
                doc.fullName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return result;
    }, [doctors, searchQuery, sortBy]);

    return (
        <div
            className="min-h-screen max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 bg-secondary-foreground text-foreground">

            {assessmentId && !paymentSuccess && (
                <div
                    className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-sm text-secondary font-medium animate-fadeIn">
                    {t("Select a specialist below to share your report and get an expert review.")}
                </div>
            )}

            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5}}
                className="space-y-2"
            >
                <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">
                    {t("Our Specialists")}
                </p>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-secondary">
                    {t("Find the Right Doctor")}
                </h1>
            </motion.div>

            <motion.div
                initial={{opacity: 0, y: 10}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.5, delay: 0.1}}
                className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 bg-secondary/5 border border-secondary/10 rounded-xl"
            >
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <input
                        type="text"
                        placeholder={t("Search by doctor's name...")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-secondary-foreground border border-secondary/20 rounded-lg text-sm text-secondary placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <SlidersHorizontal className="w-4 h-4 text-primary"/>
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                        <SelectTrigger
                            className="w-[180px] bg-secondary-foreground text-secondary border border-secondary/20 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary">
                            <SelectValue placeholder={t("Sort by: Default")}/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="rating-desc">{t("Highest Rated")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </motion.div>

            {loading ? (
                <div className="text-center py-20 text-muted-foreground animate-pulse">
                    {t("Loading specialists...")}
                </div>
            ) : filteredAndSortedDoctors.length === 0 ? (
                <div className="text-center py-20 bg-secondary/5 rounded-xl border border-dashed border-secondary/10">
                    <p className="text-muted-foreground">{t("No doctors found matching your criteria.")}</p>
                </div>
            ) : (
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{duration: 0.5, delay: 0.2}}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {filteredAndSortedDoctors.map((doctor) => (
                        <DoctorCard
                            key={doctor.profileId}
                            doctor={doctor}
                            t={t}
                            assessmentId={assessmentId}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
}

interface DoctorCardProps {
    doctor: DoctorProfileI;
    t: any;
    assessmentId: string | null;
}

function DoctorCard({doctor, t, assessmentId}: DoctorCardProps) {
    const cleanName = doctor.fullName.replace(/^Dr\.\s*/i, "");
    const displayName = `Dr. ${cleanName}`;

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleCheckout = async () => {
        if (!assessmentId) return;

        try {
            setIsSubmitting(true);

            const data = await doctorService.checkout(assessmentId, doctor.cognitoSub);

            if (data && data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned from server.');
            }

        } catch (error) {
            console.error('Error creating checkout session:', error);
            toast.error(t("Could not initiate payment. Please try again later."));
            setIsSubmitting(false);
        }
    };

    return (
        <Card
            className="bg-secondary/5 border-secondary/10 hover:border-primary/30 transition-all duration-300 flex flex-col justify-between group h-full">
            <CardHeader className="space-y-4">
                <div className="flex items-center gap-4">
                    {doctor.avatarUrl ? (
                        <img
                            src={doctor.avatarUrl}
                            alt={displayName}
                            className="w-14 h-14 rounded-full object-cover border border-secondary/20 group-hover:border-primary/50 transition-colors"
                        />
                    ) : (
                        <div
                            className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20">
                            <User className="w-6 h-6 text-muted-foreground"/>
                        </div>
                    )}

                    <div>
                        <CardTitle
                            className="text-xl font-bold text-secondary group-hover:text-primary transition-colors">
                            {displayName}
                        </CardTitle>
                        <div className="flex items-center gap-1.5 mt-1">
                            <Star className="w-4 h-4 fill-primary text-primary"/>
                            <span className="text-sm font-bold text-secondary">
                                {doctor.averageRating?.toFixed(1) || "5.0"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                ({doctor.totalReviews || 0} {t("reviews")})
                            </span>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 flex-grow flex flex-col justify-between">
                <p className="text-sm text-muted-foreground line-clamp-3 italic leading-relaxed">
                    {doctor.bio ? `"${doctor.bio}"` : t("No biography available.")}
                </p>

                <div className="pt-4 border-t border-secondary/10 flex items-center justify-between mt-auto">
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {t("Consultation Fee")}
                        </p>
                        <div className="flex items-center text-secondary font-extrabold text-xl mt-0.5">
                            <span>30</span>
                            <span className="text-xs font-semibold text-primary ml-1">RON</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={isSubmitting || !assessmentId}
                        className={`px-4 py-2 font-bold text-xs rounded-lg uppercase tracking-wider transition-colors flex items-center gap-2
                            ${assessmentId
                            ? 'bg-secondary text-secondary-foreground hover:bg-primary hover:text-secondary-foreground hover:cursor-pointer'
                            : 'bg-secondary/20 text-muted-foreground cursor-not-allowed opacity-50'
                        }`}
                        title={!assessmentId ? t("No active assessment report to send.") : ""}
                    >
                        {isSubmitting && <Loader2 size={14} className="animate-spin"/>}
                        {assessmentId ? (isSubmitting ? t("Processing...") : t("Pay & Send")) : t("View Profile")}
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}