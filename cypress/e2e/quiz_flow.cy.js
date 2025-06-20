describe('Квиз: полный пользовательский сценарий', () => {
  it('Проходит квиз от начала до конца, включая блок опыта', () => {
    cy.visit('http://localhost:3000/quiz.html');

    // Контактные данные
    cy.get('#contact-name').type('Тестовый Пользователь');
    cy.get('#contact-email').type('test@example.com');
    cy.get('#contact-phone').type('+7 999 123 45-67');
    cy.get('#contact-consent').check();
    cy.get('#contact-next').should('not.be.disabled').click();

    // Первый вопрос (выбираем любой вариант)
    cy.get('.quiz-option input[type="radio"]').first().check({ force: true });
    cy.get('#test-next').should('not.be.disabled').click();

    // Пройти до вопроса с requireExplanation (например, 11-й)
    for (let i = 1; i < 10; i++) {
      cy.get('.quiz-option input[type="radio"]').first().check({ force: true });
      cy.get('#test-next').should('not.be.disabled').click();
    }

    // На вопросе с requireExplanation появляется textarea
    cy.get('.quiz-option input[type="radio"]').eq(2).check({ force: true });
    cy.get('.quiz-wide-textarea').should('be.visible').type('Потому что это рабочий способ');
    cy.get('#test-next').should('not.be.disabled').click();

    // Последний вопрос (если есть)
    cy.get('#test-next').should('exist').click({ multiple: true, force: true });

    // Блок "Опыт и мотивация"
    cy.contains('Опыт и мотивация').should('be.visible');
    cy.get('input[name="age"][value="20-25"]').check({ force: true });
    cy.get('input[name="exp"][value="3-5"]').check({ force: true });
    cy.get('input[name="projects"][value="3-5"]').check({ force: true });
    cy.get('input[name="hardware"][value="regular"]').check({ force: true });
    cy.get('textarea[name="portfolio"]').type('github.com/test, pet-проекты, задачи');
    cy.get('textarea[name="expectations"]').type('100-150k, удалёнка, гибкий график');
    cy.get('input[name="testtask"][value="yes"]').check({ force: true });
    cy.get('button[type="submit"]').contains('Отправить').click();

    // Финальный экран
    cy.contains('Спасибо!').should('be.visible');
  });

  it('Проверяет отображение в админке', () => {
    cy.visit('http://localhost:3000/quiz_admin.html');
    cy.get('.user-card').first().should('contain.text', 'Тестовый Пользователь');
    cy.get('.details-btn').first().click();
    cy.get('.answers-content').should('contain.text', 'Дополнительные ответы');
    cy.get('.answers-content').should('contain.text', '20-25');
    cy.get('.answers-content').should('contain.text', '3-5 года');
    cy.get('.answers-content').should('contain.text', 'github.com/test');
    cy.get('.answers-content').should('contain.text', '100-150k');
  });
}); 