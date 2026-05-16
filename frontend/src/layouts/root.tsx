import { Outlet, useNavigation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "../components/ui/sonner";
import { Layout } from "@/components/layout.tsx";
import { useAuth } from "react-oidc-context";
import { LoadingScreen } from "@/components/loading-screen.tsx";

export default function RootLayout() {
    const navigation = useNavigation();
    const auth = useAuth();

    // Logic: We show the loader if the router is fetching a page OR auth is checking the session
    const isActuallyLoading = navigation.state === "loading" || auth.isLoading;

    // This state controls the mounting/unmounting for the exit animation
    const [visible, setVisible] = useState(isActuallyLoading);

    useEffect(() => {
        if (isActuallyLoading) {
            setVisible(true);
        } else {
            // Small delay to ensure the exit animation from LoadingScreen feels "Wow"
            const timeout = setTimeout(() => setVisible(false), 800);
            return () => clearTimeout(timeout);
        }
    }, [isActuallyLoading]);

    return (
        <>
            <LoadingScreen isLoading={visible} />

            {/* Render the app only when auth is initialized to avoid UI flickering */}
            {!auth.isLoading && (
                <Layout>
                    <Outlet />
                </Layout>
            )}

            <Toaster
                visibleToasts={50}
                duration={5000}
                position="top-center"
                className="pointer-events-auto"
            />
        </>
    );
}