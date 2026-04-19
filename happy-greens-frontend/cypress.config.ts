import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:5173',
        specPattern: 'cypress/e2e/**/*.cy.{ts,tsx}',
        supportFile: 'cypress/support/e2e.ts',
        env: {
            apiUrl: 'http://localhost:3000/api',
            userEmail: 'testcustomer@example.com',
            userPassword: 'Password@123',
        },
    },
    video: false,
    screenshotOnRunFailure: true,
});
