import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

// Equivalente a las reglas que aplicaba CRA (eslint-config-react-app):
// variables sin uso y reglas de hooks. `npm run lint` no admite advertencias.
export default [
    { ignores: ['build/', 'dist/', 'node_modules/'] },
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser },
            parserOptions: { ecmaFeatures: { jsx: true } }
        },
        plugins: { 'react-hooks': reactHooks },
        rules: {
            'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^React$' }],
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn'
        }
    },
    {
        files: ['**/*.test.{js,jsx}', 'src/setupTests.js'],
        languageOptions: { globals: { ...globals.node, ...globals.vitest } }
    },
    {
        files: ['vite.config.js', 'eslint.config.js'],
        languageOptions: { globals: { ...globals.node } }
    }
];
