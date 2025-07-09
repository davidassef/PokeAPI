describe('Captura Pokémon - Autenticação', () => {
  it('não permite capturar sem login', () => {
    cy.visit('/home');
    cy.get('[data-cy=capture-btn]').click();
    cy.contains('Você precisa estar logado').should('exist');
  });

  it('permite capturar após login', () => {
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type('usuario1@email.com');
    cy.get('[data-cy=senha-input]').type('senha123');
    cy.get('[data-cy=login-btn]').click();
    cy.url().should('include', '/home');
    cy.get('[data-cy=capture-btn]').click();
    cy.contains('Captura realizada com sucesso').should('exist');
  });
}); 