import { useAuth } from "react-oidc-context";
import { useMemo } from "react";
import type { UserI } from "@/models/user-model.ts";

export const useUser = () => {
    const auth = useAuth();

    const user = useMemo((): UserI | null => {
        if (!auth.user) return null;

        const { profile, access_token } = auth.user;
        const groups = (profile["cognito:groups"] as string[]) || [];

        return {
            id: profile.sub || "",
            email: (profile.email as string) || "",
            username: (profile["cognito:username"] as string) || "",
            firstName: (profile.given_name as string) || "",
            lastName: (profile.family_name as string) || "",
            groups,
            isAdmin: groups.includes("admin"),
            accessToken: access_token,
            auth_time: profile.iat as number,
        };
    }, [auth.user]);

    const login = async () => {
        if (auth.activeNavigator || auth.isLoading) {
            return;
        }
        if (!auth.isAuthenticated) {
            await auth.signinRedirect();
        }
    };

    const logout = async () => {
        if (auth.activeNavigator || auth.isLoading) return;

        await auth.removeUser();

        const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
        const logoutUri =import.meta.env.VITE_COGNITO_LOGOUT_URI;
        const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;

        window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    };

    return {
        user,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
        isNavigating: !!auth.activeNavigator,
        error: auth.error,

        login,
        logout,
    };
};