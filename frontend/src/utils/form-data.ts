import i18n from "i18next";

export const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    const currentLanguage = i18n.language || 'en-US';

    return new Date(timestamp * 1000).toLocaleDateString(currentLanguage, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};