export const getFirstName = (fullName?: string): string => {
    return fullName?.trim().split(/\s+/)[0] || "User";
};