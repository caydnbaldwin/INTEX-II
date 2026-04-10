describe('public smoke', () => {
  it('loads the landing page', () => {
    cy.visit('/')
    cy.contains('Help Protect Girls').should('be.visible')
  })

  it('navigates to donation page from hero CTA', () => {
    cy.visit('/')
    cy.contains('a', 'Donate').first().click()
    cy.url().should('include', '/donate')
  })
})
