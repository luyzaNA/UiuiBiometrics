import {createBrowserRouter, Navigate} from "react-router-dom";

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
                element: <Navigate to={"home"}/>
            },
            {
                path: "home",
                lazy: async () => {
                    return {
                        Component: (await import('@/pages/Home/home-page.tsx')).default,
                    }
                },
            },
        ]
    }]);