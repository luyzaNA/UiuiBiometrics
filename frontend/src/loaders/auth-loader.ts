const OIDC_STORAGE_KEY = import.meta.env.VITE_OIDC_STORAGE_KEY;
const PUBLIC_HOME_PATH = import.meta.env.VITE_PUBLIC_HOME_PATH || "/home";

type JwtPayload = {
    exp?: number;
    [key: string]: unknown;
};

function redirectToPublicHome(): never {
    window.location.href = PUBLIC_HOME_PATH;
    throw new Error("Redirecting to public home page.");
}

function clearStoredSession(): void {
    sessionStorage.removeItem(OIDC_STORAGE_KEY);
}

function getStoredSession(): string | null {
    return sessionStorage.getItem(OIDC_STORAGE_KEY);
}

function extractIdToken(rawSession: string): string {
    if (rawSession.trim().startsWith("ey")) {
        return rawSession.trim();
    }

    const parsed = JSON.parse(rawSession);
    const idToken = parsed.id_token;

    if (!idToken) {
        throw new Error("ID token is missing.");
    }

    return idToken;
}

function decodeJwt(token: string): JwtPayload {
    const payloadBase64 = token.split(".")[1];

    if (!payloadBase64) {
        throw new Error("Invalid JWT format.");
    }

    const normalizedBase64 = payloadBase64
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    return JSON.parse(window.atob(normalizedBase64));
}

function isTokenExpired(payload: JwtPayload): boolean {
    if (!payload.exp) {
        return false;
    }

    const currentUnixTime = Math.floor(Date.now() / 1000);

    return payload.exp < currentUnixTime;
}

function isAuthenticationCallback(): boolean {
    return (
        window.location.search.includes("code=") ||
        window.location.hash.includes("id_token=") ||
        window.location.hash.includes("access_token=")
    );
}

function isHostedUiPage(): boolean {
    return window.location.href.includes("/oauth2/authorize");
}

export function checkTokenAndRedirect(): JwtPayload {
    const rawSession = getStoredSession();

    if (!rawSession) {
        redirectToPublicHome();
    }

    try {
        const idToken = extractIdToken(rawSession);
        const payload = decodeJwt(idToken);

        if (isTokenExpired(payload)) {
            clearStoredSession();
            redirectToPublicHome();
        }

        return payload;
    } catch (error) {
        console.error("Failed to validate the authentication token.", error);
        clearStoredSession();
        redirectToPublicHome();
    }
}

export async function baseAuthLoader() {
    if (isHostedUiPage()) {
        return null;
    }

    if (isAuthenticationCallback()) {
        return null;
    }

    return checkTokenAndRedirect();
}

export async function userAuthLoader() {
    const payload = await baseAuthLoader();

    if (!payload) return null;

    const groups = (payload["cognito:groups"] as string[]) || [];

    if (groups.includes("doctor")) {
        console.warn("Doctors are restricted from patient routes.");
        window.location.href = "/doctor/dashboard";
        throw new Error("Redirecting doctor to their dashboard.");
    }

    // if (groups.includes("admin")) {
    //     console.warn("Admins are restricted from patient routes.");
    //     window.location.href = "/admin/dashboard";
    //     throw new Error("Redirecting admin to admin panel.");
    // }

    return payload;
}

export async function doctorAuthLoader() {
    const payload = await baseAuthLoader();

    if (!payload) return null;

    const groups = (payload["cognito:groups"] as string[]) || [];

    if (!groups.includes("doctor")) {
        console.warn("User access denied. Requires 'doctor' role.");
        window.location.href = PUBLIC_HOME_PATH;
        throw new Error("Redirecting non-doctor user.");
    }

    return payload;
}