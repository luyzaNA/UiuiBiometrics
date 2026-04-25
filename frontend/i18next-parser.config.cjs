module.exports = {
    locales: ['en', 'ro'],
    output: 'src/locales/$LOCALE.json',
    input: ['src/**/*.{ts,tsx}'],
    defaultValue: null,
    useKeysAsDefaultValue: true,
    createOldCatalogs: true,
    keepRemoved: true,
    keySeparator: true,
    namespaceSeparator: false,
};
