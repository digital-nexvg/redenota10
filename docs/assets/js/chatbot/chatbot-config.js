// Configuração central do Assistente Nota 10 — não espalhar e-mails/links/telefones em outros arquivos.
window.RN10_CHATBOT_CONFIG = (() => {
  const PENDING = 'PENDENTE_CONFIGURAR';

  // RH: fixo, não depende de unidade.
  const rh = {
    email: 'rh.tag@redenota10.com.br',
  };

  // Números de gerentes ainda não foram fornecidos: mantidos como placeholder interno,
  // nunca exibidos na interface (usados só por openManagerWhatsapp).
  const gerentes = {
    'joinha-loja': PENDING,
    'joinha-pista': PENDING,
    'via-gas-loja': PENDING,
    'via-gas-pista': PENDING,
    'cremoneze-loja': PENDING,
    'cremoneze-pista': PENDING,
    'mega-engenho-novo-loja': PENDING,
    'mega-engenho-novo-pista': PENDING,
    'grajau-loja': PENDING,
    'grajau-pista': PENDING,
    'senna-loja': PENDING,
    'senna-pista': PENDING,
    'cruzada-peninsula-loja': PENDING,
    'cruzada-peninsula-pista': PENDING,
  };

  const links = {
    site: 'https://www.redenota10.com.br/',
    sobreNos: 'pages/sobre.html',
    trabalheConosco: 'pages/trabalhe-conosco.html',
    cadastroFrota: 'pages/frota.html',
    contato: 'pages/contato.html',
    unidades: 'pages/unidades.html',
    ifood: 'https://www.ifood.com.br/',
    food99: 'https://99app.com/',
    kmv: 'https://www.kmv.com.br/',
    instagram: 'https://www.instagram.com/rede.nota10/',
    facebook: PENDING,
    linkedin: PENDING,
  };

  return { PENDING, rh, gerentes, links };
})();
