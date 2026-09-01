// Detecção simples de intenção por palavras-chave (linguagem natural básica, sem IA externa).
window.RN10_CHATBOT_NLU = (() => {
  // Ordem importa: intenções mais específicas (ex.: pagamento) são checadas antes de
  // termos genéricos (ex.: "ifood"/"pedir" também aparecem em reclamações de pagamento).
  const INTENTS = [
    { intent: 'find_unit', keywords: ['posto mais perto', 'posto proximo', 'encontrar posto', 'unidade mais perto', 'onde fica', 'localizar posto'] },
    { intent: 'fleet', keywords: ['cadastrar frota', 'cadastro de frota', 'minha frota', 'cadastrar minha empresa', 'cadastrar empresa'] },
    { intent: 'promotions', keywords: ['promocao', 'promocoes', 'desconto', 'kmv', 'oferta'] },
    { intent: 'careers', keywords: ['curriculo', 'trabalhar', 'vaga', 'emprego', 'trabalhe conosco'] },
    { intent: 'about', keywords: ['sobre a rede', 'sobre nos', 'quem sao voces', 'conhecer a empresa'] },
    { intent: 'social', keywords: ['instagram', 'facebook', 'linkedin', 'redes sociais'] },
    { intent: 'payment_problem', keywords: ['pagamento', 'cartao nao passou', 'cartao', 'cobranca', 'cobrado', 'nao recebi', 'pix'] },
    { intent: 'delivery', keywords: ['delivery', 'pedir', 'ifood', '99food', '99 food', 'entrega'] },
    { intent: 'contact', keywords: ['falar com alguem', 'falar com atendente', 'contato', 'suporte', 'solucoes', 'reclamar'] },
  ];

  const APP_KEYWORDS = [
    { app: 'ifood', keywords: ['ifood'] },
    { app: '99food', keywords: ['99food', '99 food', '99app'] },
  ];

  const AREA_KEYWORDS = [
    { area: 'loja', keywords: ['loja', 'conveniencia'] },
    { area: 'pista', keywords: ['pista', 'bomba', 'abastecimento'] },
    { area: 'frota', keywords: ['frota'] },
    { area: 'pagamento', keywords: ['pagamento', 'cartao', 'cobranca'] },
  ];

  // Saudações de início de conversa (oi, olá, bom dia...) — checadas isoladamente,
  // sem entrar na lista de INTENTS, pois não levam a um fluxo específico.
  const GREETING_KEYWORDS = ['oi', 'ola', 'opa', 'eae', 'e ai', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hey', 'tudo bem', 'tudo bom'];

  const normalize = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const matchByKeywords = (text, table, key) => {
    const normalized = normalize(text);
    const found = table.find(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)));
    return found ? found[key] : null;
  };

  const detectIntent = (text) => matchByKeywords(text, INTENTS, 'intent');
  const detectApp = (text) => matchByKeywords(text, APP_KEYWORDS, 'app');
  const detectArea = (text) => matchByKeywords(text, AREA_KEYWORDS, 'area');

  // Usa limites de palavra para não confundir "oi" com trechos de outras palavras ("loja", "histórico"...).
  const detectGreeting = (text) => {
    const normalized = normalize(text);
    return GREETING_KEYWORDS.some((keyword) => new RegExp(`(^|[^a-z])${keyword}([^a-z]|$)`).test(normalized));
  };

  return { normalize, detectIntent, detectApp, detectArea, detectGreeting };
})();
