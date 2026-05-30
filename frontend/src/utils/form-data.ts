import i18n from "i18next";

export const formatDateUnix = (timestamp: number | undefined) => {
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


export const formatDateMs = (timestamp: number | undefined) => {
    if (!timestamp) return 'N/A';
    const currentLanguage = i18n.language || 'en-US';

    return new Date(timestamp).toLocaleDateString(currentLanguage, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export const formatChartShortDate = (timestamp: number | undefined) => {
    if (!timestamp) return '';
    const currentLanguage = i18n.language || 'en-US';
    return new Date(timestamp).toLocaleDateString(currentLanguage, {
        day: 'numeric',
        month: 'short',
    });
};

export const formatChartFullDate = (timestamp: number | undefined) => {
    if (!timestamp) return '';
    const currentLanguage = i18n.language || 'en-US';
    return new Date(timestamp).toLocaleDateString(currentLanguage, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};