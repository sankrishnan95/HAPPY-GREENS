import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    base: '/',
    plugins: [react()],
    build: {
        cssCodeSplit: true,
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    ui: ['lucide-react', 'react-hot-toast'],
                    auth: ['@react-oauth/google', 'axios'],
                },
            },
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'https://happy-greens-18n3.onrender.com',
                changeOrigin: true,
            }
        }
    }
})
