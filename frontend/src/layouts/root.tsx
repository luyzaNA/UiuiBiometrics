import {
    Outlet,
    useNavigation,
    type Navigation,
} from "react-router-dom";
import {Progress} from "@/components/ui/progress";
import {useEffect, useState} from "react";
import {Toaster} from "../components/ui/sonner";
import {Layout} from "@/components/layout.tsx";

export default function RootLayout() {
    const navigation: Navigation = useNavigation();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let interval: number | undefined;

        if (navigation.state === "loading") {
            setVisible(true);
            setProgress(10);

            interval = window.setInterval(() => {
                setProgress((prev) => {
                    if (prev < 80) return prev + 2 + Math.random();
                    return prev;
                });
            }, 33);
        } else {
            setProgress(100);
            const timeout = setTimeout(() => {
                setVisible(false);
                setProgress(0);
            }, 500);

            return () => clearTimeout(timeout);
        }

        return () => clearInterval(interval);
    }, [navigation.state]);

    return (
        <>
            {visible && (
                <Progress
                    style={{zIndex: 9999}}
                    className="h-1 fixed top-0 left-0right-0 animate-pulse z-50 rounded-none transition-all duration-500"
                    value={progress}
                />
            )}
            <Layout>
                <Outlet/>
            </Layout>
            <Toaster
                visibleToasts={50}
                duration={5 * 1000}
                position="top-center"
                className={"pointer-events-auto"}
                toastOptions={{
                    closeButton: true,
                    classNames: {
                        toast: "lg:!w-max",
                    },
                }}
            />
        </>
    );
}