import { toast } from "sonner";

export function handleCognitoError(err: any, showToast = true): Error {
    const type = err?.__type || err?.code;
    const message = err?.message || "An unexpected error occurred. Please try again.";

    let userMessage = message;

    switch (type) {
        case "NotAuthorizedException":
            userMessage = "Incorrect email or password.";
            break;
        case "UserNotFoundException":
            userMessage = "No account found with that email.";
            break;
        case "UserNotConfirmedException":
            userMessage = "Please verify your email before logging in.";
            break;
        case "LimitExceededException":
            userMessage = "Too many attempts. Try again later.";
            break;
        case "InvalidPasswordException":
            userMessage = "Password does not meet the required criteria.";
            break;
        default:
            userMessage = message;
    }

    if (showToast) {
        toast.error(userMessage);
    }

    return new Error(userMessage);
}
