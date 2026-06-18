import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider, type AuthProviderProps } from "react-oidc-context";
import {router} from "@/routes";

const cognitoAuthConfig: AuthProviderProps = {
    authority: import.meta.env.VITE_COGNITO_AUTHORITY,
    client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_COGNITO_REDIRECT_URI,
    response_type: "code",
    scope: "email openid phone profile",

    onSigninCallback: async (user) => {
        window.history.replaceState({}, document.title, window.location.pathname);

        const groups = (user?.profile?.["cognito:groups"] as string[]) || [];

        if (groups.includes("admin")) {
            await router.navigate("/admin/dashboard", {replace: true});
        } else if (groups.includes("doctor")) {
            await router.navigate("/doctor/dashboard", { replace: true });
        } else {
            await router.navigate("/dashboard", { replace: true });
        }
    }
};

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider {...cognitoAuthConfig}>
            <App />
        </AuthProvider>
    </StrictMode>,
)
