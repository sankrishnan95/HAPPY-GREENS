describe('Checkout flow', () => {
    beforeEach(() => {
        cy.loginByApi();
    });

    it('completes a COD checkout flow', () => {
        cy.visit('/shop');
        cy.get('[data-product-card-id]').first().within(() => {
            cy.get('button[title="Add to cart"]').click();
        });

        cy.visit('/checkout');
        cy.get('input[name="name"], input[placeholder*="name" i]').first().type('Test Customer', { force: true });
        cy.get('input[name="phone"], input[placeholder*="phone" i]').first().clear().type('9876543210', { force: true });
        cy.get('textarea, input[name="address"], input[placeholder*="address" i]').first().type('12 Market Street', { force: true });
        cy.get('input[name="city"], input[placeholder*="city" i]').first().clear().type('Puducherry', { force: true });
        cy.get('input[name="zip"], input[placeholder*="pin" i]').first().clear().type('605005', { force: true });
        cy.contains(/continue|payment/i).click({ force: true });
        cy.contains(/place order|cash on delivery|cod/i).should('exist');
    });
});
