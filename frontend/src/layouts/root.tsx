import { Outlet, useNavigation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "../components/ui/sonner";
import { Layout } from "@/components/layout.tsx";
import { useAuth } from "react-oidc-context";
import { LoadingScreen } from "@/components/loading-screen.tsx";

export default function RootLayout() {
    const navigation = useNavigation();
    const auth = useAuth();

    const isActuallyLoading = navigation.state === "loading" || auth.isLoading;

    const [visible, setVisible] = useState(isActuallyLoading);

    useEffect(() => {
        if (isActuallyLoading) {
            setVisible(true);
        } else {
            const timeout = setTimeout(() => setVisible(false), 800);
            return () => clearTimeout(timeout);
        }
    }, [isActuallyLoading]);

    return (
        <>
            <LoadingScreen isLoading={visible} />

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