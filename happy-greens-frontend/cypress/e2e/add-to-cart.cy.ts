describe('Add item to cart', () => {
    it('adds a product from shop to cart', () => {
        cy.visit('/shop');
        cy.get('[data-product-card-id]').first().within(() => {
            cy.get('button[title="Add to cart"]').click();
        });

        cy.visit('/cart');
        cy.contains('Shopping Cart').should('be.visible');
        cy.get('img[alt]').should('have.length.at.least', 1);
    });
});
