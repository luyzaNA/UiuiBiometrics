import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {profileService} from "@/services/profile-service.ts";
import type {DoctorProfileI} from "@/models/doctor-model.ts";
import {getFirstName} from "@/utils/get-first-name.ts";

export function Greeting() {
    const { t } = useTranslation();
    const [fullGreeting, setFullGreeting] = useState('');
    const [displayedGreeting, setDisplayedGreeting] = useState('');
    const [isWriting, setIsWriting] = useState(true);
    const [profile, setProfile] = useState<Partial<DoctorProfileI>>({});


    useEffect(() => {
        const fetchProfile = async () => {
            try {

                const profileData = await profileService.getMe();

                console.log("PROFILE:", profileData);

                setProfile(profileData);
            } catch (error) {
                console.error("Eroare la preluarea profilului:", error);
            } finally {
            }
        };

        fetchProfile();
    }, []);

    useEffect(() => {
        const getGreetingMessage = () => {
            const hour = new Date().getHours();

            let baseGreeting = "";

            if (hour >= 5 && hour < 12) {
                baseGreeting = t("Good morning");
            } else if (hour >= 12 && hour < 18) {
                baseGreeting = t("Good afternoon");
            } else {
                baseGreeting = t("Good evening");
            }

            const firstName = getFirstName(profile.fullName)

            return profile.fullName
                ? `${baseGreeting}, ${firstName}`
                : baseGreeting;
        };

        setFullGreeting(getGreetingMessage());

        const interval = setInterval(() => {
            setFullGreeting(getGreetingMessage());
        }, 60000);

        return () => clearInterval(interval);
    }, [t, profile.fullName]);

    useEffect(() => {
        if (!fullGreeting) return;

        setDisplayedGreeting('');
        setIsWriting(true);

        let currentLength = 0;
        const typingSpeed = 70;
        const startDelay = 800;

        let typingInterval: number;

        const delayTimeout = setTimeout(() => {
            typingInterval = window.setInterval(() => {
                currentLength++;

                setDisplayedGreeting(fullGreeting.slice(0, currentLength));

                if (currentLength >= fullGreeting.length) {
                    clearInterval(typingInterval);
                    setTimeout(() => setIsWriting(false), 500);
                }
            }, typingSpeed);
        }, startDelay);

        return () => {
            clearTimeout(delayTimeout);
            if (typingInterval) clearInterval(typingInterval);
        };
    }, [fullGreeting]);

    return (
        <span className="inline-flex items-center text-3xl md:text-4xl font-extralight italic tracking-wide min-h-[48px] select-none justify-center text-center">
            <span className="bg-gradient-to-r from-secondary via-primary to-secondary/90 bg-clip-text text-transparent">
                {displayedGreeting}
            </span>

            {isWriting && (
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }}
                    className="inline-block w-[2px] h-[28px] bg-primary ml-2 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.85)] align-middle"
                />
            )}
        </span>
    );
}