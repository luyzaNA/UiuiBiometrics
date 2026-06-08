import { createBrowserRouter, Navigate } from "react-router-dom";
import {userAuthLoader, doctorAuthLoader} from "@/loaders/auth-loader.ts";

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
                loader: userAuthLoader,
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
                        path: "assessments",
                        lazy: async () => {
                            return {
                                Component: (await import('@/pages/Assessment/assessments-history-page.tsx')).default,
                            }
                        }
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
                        path: "assessment/:assessmentId/food-base-menu",
                        lazy: async () => {
                            return {
                                Component: (await import('@/pages/Menu/food-base/food-base-page.tsx')).default,
                            }
                        },
                    },
                    {
                        path: "assessment/:assessmentId/meal-base-menu",
                        lazy: async () => {
                            return {
                                Component: (await import('@/pages/Menu/meal-base/meal-base-page.tsx')).default,
                            }
                        }
                    },
                    {
                        path: "doctors",
                        lazy: async () => {
                            return {
                                Component: (await import('@/pages/Doctor/doctor-list-page.tsx')).default,
                            }
                        }
                    }
                ]
             },
            {
                loader: doctorAuthLoader,
                children: [
                    {
                        path: "doctor/profile",
                        lazy: async () => {
                            return {
                                Component: (await import('@/pages/Doctor/doctor-profile-page.tsx')).default,
                            }
                        },
                    },
                    {
                        path: "doctor/dashboard",
                        lazy: async () => {
                            return {
                                Component: (await import('@/pages/Doctor/doctor-dashboard-page.tsx')).default,
                            }
                        },
                    }
                ]
            }
        ]
    }
]);