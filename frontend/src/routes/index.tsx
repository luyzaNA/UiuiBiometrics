import { createBrowserRouter, Navigate } from "react-router-dom";
import { authLoader } from "@/loaders/auth-loader.ts";

export const router = createBrowserRouter([
    {
        path: '/',
        lazy: async () => {
            return {
                Component: (await import('@/layouts/root.tsx')).default,
            }
        },
        children: [
            {
                index: true,
                element: <Navigate to="home" replace />
            },
            {
                path: "home",
                lazy: async () => {
                    return {
                        Component: (await import('@/pages/Home/home-page.tsx')).default,
                    }
                },
            },
            {
                loader: authLoader,
                children: [
                    {
                        path: "profile",
                        lazy: async () => {
                            return {
                                Component: (await import('@/pages/Profile/profile-page.tsx')).ProfilePage,
                            }
                        },
                    },
                    {
                        path: "dashboard",
                        lazy: async () => {
                            return {
                                Component: (await import('@/pages/Dashboard/dashboard-page.tsx')).default,
                            }
                        },
                    },
                    {
                        path: "quiz",
                        lazy: async () => {
                            return {
                                Component: (await import('@/pages/Quiz/symptom-quiz.tsx')).default,
                            }
                        },
                    },
                    {
                        path: "assessment/:assessmentId",
                        lazy: async () => {
                            return {
                                Component: (await import('@/pages/Assessment/assessment-results-page.tsx')).default,
                            }
                        },
                    },
                    {
                        path: "assessment/:assessmentId/targeted-foods",
                        lazy: async () => {
                            return {
                                Component: (await import('@/pages/Menu/targeted-food-page.tsx')).default,
                            }
                        },
                    },
                    {
                        path: "assessments",
                        lazy: async () => {
                            return {
                                Component: (await import('@/pages/Assessment/assessments-history-page.tsx')).default,
                            }
                        }
                    }
                ]
            }
        ]
    }
]);