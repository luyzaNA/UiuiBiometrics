export const getInitial = (name: string | null | undefined): string => {
    if (!name || name.trim() === "") return "U";

    return name.trim()[0].toUpperCase();
};