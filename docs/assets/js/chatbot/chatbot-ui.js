// Camada de interface do Assistente Nota 10: cria o DOM do widget e expõe primitivas de renderização.
// Não contém lógica de negócio/fluxo — isso fica em chatbot-flows.js.
window.RN10_CHATBOT_UI = (() => {
  let elements = null;

  const build = () => {
    if (elements) return elements;

    const root = document.createElement('div');
    root.className = 'rn10-chatbot';
    root.innerHTML = `
      <div class="rn10-chatbot__hint" data-rn10-chat-hint hidden>
        <span class="rn10-chatbot__hint-text">
          <span class="rn10-chatbot__hint-line">Fale com nosso assistente</span>
          <span class="rn10-chatbot__hint-line">virtual 💬</span>
        </span>
        <button type="button" class="rn10-chatbot__hint-close" data-rn10-chat-hint-close aria-label="Fechar dica">×</button>
      </div>
      <button type="button" class="rn10-chatbot__toggle" data-rn10-chat-toggle aria-haspopup="dialog" aria-expanded="false" aria-controls="rn10-chatbot-window" aria-label="Abrir assistente virtual da Rede Nota 10">
        <img src="${document.body.classList.contains('inner-page') ? '..' : '.'}/assets/images/logo/favicon.webp" alt="" aria-hidden="true">
      </button>
      <section id="rn10-chatbot-window" class="rn10-chatbot__window" role="dialog" aria-modal="false" aria-label="Assistente virtual da Rede Nota 10" aria-hidden="true" hidden>
        <header class="rn10-chatbot__header">
          <div class="rn10-chatbot__header-title">
            <strong>Assistente Nota 10</strong>
            <span>Rede Nota 10</span>
          </div>
          <div class="rn10-chatbot__header-actions">
            <button type="button" class="rn10-chatbot__icon-btn" data-rn10-chat-home aria-label="Voltar ao início">🏠</button>
            <button type="button" class="rn10-chatbot__icon-btn" data-rn10-chat-close aria-label="Fechar assistente">×</button>
          </div>
        </header>
        <div class="rn10-chatbot__messages" data-rn10-chat-messages role="log" aria-live="polite"></div>
        <form class="rn10-chatbot__composer" data-rn10-chat-form>
          <label class="sr-only" for="rn10-chat-input">Digite sua mensagem</label>
          <input id="rn10-chat-input" type="text" autocomplete="off" placeholder="Digite sua mensagem..." data-rn10-chat-input>
          <button type="submit" class="rn10-chatbot__send" aria-label="Enviar mensagem">➤</button>
        </form>
      </section>
    `;
    document.body.append(root);

    elements = {
      root,
      toggleButton: root.querySelector('[data-rn10-chat-toggle]'),
      window: root.querySelector('#rn10-chatbot-window'),
      homeButton: root.querySelector('[data-rn10-chat-home]'),
      closeButton: root.querySelector('[data-rn10-chat-close]'),
      messages: root.querySelector('[data-rn10-chat-messages]'),
      form: root.querySelector('[data-rn10-chat-form]'),
      input: root.querySelector('[data-rn10-chat-input]'),
      hint: root.querySelector('[data-rn10-chat-hint]'),
      hintCloseButton: root.querySelector('[data-rn10-chat-hint-close]'),
    };

    return elements;
  };

  const scrollToBottom = () => {
    elements.messages.scrollTop = elements.messages.scrollHeight;
  };

  const addBotMessage = (html) => {
    const bubble = document.createElement('div');
    bubble.className = 'rn10-chatbot__bubble rn10-chatbot__bubble--bot';
    bubble.innerHTML = html;
    elements.messages.append(bubble);
    scrollToBottom();
  };

  const addUserMessage = (text) => {
    const bubble = document.createElement('div');
    bubble.className = 'rn10-chatbot__bubble rn10-chatbot__bubble--user';
    bubble.textContent = text;
    elements.messages.append(bubble);
    scrollToBottom();
  };

  const clearOptions = () => {
    elements.messages.querySelectorAll('[data-rn10-chat-options]').forEach((node) => node.remove());
  };

  // Renderiza um conjunto de botões de opção; onSelect recebe o "value" da opção clicada.
  const addOptions = (options, onSelect) => {
    clearOptions();
    const wrap = document.createElement('div');
    wrap.className = 'rn10-chatbot__options';
    wrap.setAttribute('data-rn10-chat-options', '');

    options.forEach(({ label, value }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'rn10-chatbot__option';
      button.textContent = label;
      button.addEventListener('click', () => {
        clearOptions();
        onSelect(value, label);
      });
      wrap.append(button);
    });

    elements.messages.append(wrap);
    scrollToBottom();
  };

  const setTyping = (isTyping) => {
    elements.root.classList.toggle('is-typing', isTyping);
  };

  const clearMessages = () => {
    elements.messages.innerHTML = '';
  };

  const showHint = () => {
    elements.hint.hidden = false;
  };

  const hideHint = () => {
    elements.hint.hidden = true;
  };

  const openWindow = () => {
    elements.window.hidden = false;
    elements.window.setAttribute('aria-hidden', 'false');
    elements.toggleButton.setAttribute('aria-expanded', 'true');
    elements.root.classList.add('is-open');
    hideHint();
    window.setTimeout(() => elements.input.focus(), 50);
  };

  const closeWindow = () => {
    elements.window.hidden = true;
    elements.window.setAttribute('aria-hidden', 'true');
    elements.toggleButton.setAttribute('aria-expanded', 'false');
    elements.root.classList.remove('is-open');
    elements.toggleButton.focus();
  };

  const isOpen = () => elements.root.classList.contains('is-open');

  return {
    build,
    addBotMessage,
    addUserMessage,
    addOptions,
    clearOptions,
    clearMessages,
    setTyping,
    showHint,
    hideHint,
    openWindow,
    closeWindow,
    isOpen,
  };
})();
