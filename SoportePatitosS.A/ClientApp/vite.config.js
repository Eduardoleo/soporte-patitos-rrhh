import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Puerto 3000: lo esperan SpaProxy (SpaProxyServerUrl en el .csproj) y la
// política CORS de la API. El proxy reemplaza al campo "proxy" de CRA.
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    const apiUrl = env.VITE_API_PROXY_TARGET || 'http://localhost:5067';

    const proxy = {
        '/api': { target: apiUrl, changeOrigin: true },
        '/health': { target: apiUrl, changeOrigin: true }
    };

    return {
        plugins: [react()],
        server: { port: 3000, strictPort: true, proxy },
        preview: { port: 3000, strictPort: true, proxy },
        build: {
            outDir: 'build'
        },
        test: {
            environment: 'jsdom',
            globals: true,
            setupFiles: './src/setupTests.js'
        }
    };
});
