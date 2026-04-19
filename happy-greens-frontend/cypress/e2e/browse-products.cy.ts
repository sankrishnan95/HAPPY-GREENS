describe('Browse products', () => {
    it('loads the shop page and shows products', () => {
        cy.visit('/shop');
        cy.contains('All groceries').should('be.visible');
        cy.get('[data-product-card-id]').should('have.length.greaterThan', 0);
    });
});
