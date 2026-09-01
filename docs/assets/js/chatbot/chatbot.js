// Bootstrap do Assistente Nota 10: injeta o botão flutuante + janela e liga os eventos.
(() => {
  const UI = window.RN10_CHATBOT_UI;
  const FLOWS = window.RN10_CHATBOT_FLOWS;
  if (!UI || !FLOWS) return;

  const elements = UI.build();
  let started = false;

  const toggleOpen = () => {
    if (UI.isOpen()) {
      UI.closeWindow();
      return;
    }
    UI.openWindow();
    if (!started) {
      started = true;
      FLOWS.init();
    }
  };

  elements.toggleButton.addEventListener('click', toggleOpen);
  elements.closeButton.addEventListener('click', UI.closeWindow);
  elements.homeButton.addEventListener('click', () => {
    FLOWS.resetSession();
    UI.clearMessages();
    FLOWS.showMainMenu();
  });

  // Dica avisando que o ícone abre o assistente: aparece a cada carregamento da página.
  elements.hintCloseButton.addEventListener('click', (event) => {
    event.stopPropagation();
    UI.hideHint();
  });

  window.setTimeout(() => {
    if (!UI.isOpen()) UI.showHint();
  }, 1600);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && UI.isOpen()) UI.closeWindow();
  });

  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = elements.input.value.trim();
    if (!text) return;
    elements.input.value = '';
    FLOWS.handleFreeText(text);
  });
})();
