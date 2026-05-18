import { handleCognitoError } from "@/utils/cognito-error.tsx";

export async function wrapCognitoCall<T>(fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (err) {
        throw handleCognitoError(err);
    }
}