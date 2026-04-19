declare global {
    namespace Cypress {
        interface Chainable {
            loginByApi(): Chainable<void>;
        }
    }
}

Cypress.Commands.add('loginByApi', () => {
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, {
        email: Cypress.env('userEmail'),
        password: Cypress.env('userPassword'),
    }).then(({ body }) => {
        cy.window().then((win) => {
            const persisted = win.localStorage.getItem('happy-greens-storage');
            const parsed = persisted ? JSON.parse(persisted) : { state: {} };
            parsed.state = {
                ...(parsed.state || {}),
                user: body.user,
                token: body.token,
            };
            win.localStorage.setItem('happy-greens-storage', JSON.stringify(parsed));
        });
    });
});

export {};
