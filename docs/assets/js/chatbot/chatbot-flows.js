// Máquina de estados do Assistente Nota 10: decide o que perguntar/mostrar em cada passo.
// Depende de RN10_CHATBOT_CONFIG, RN10_CHATBOT_DATA, RN10_CHATBOT_NLU e RN10_CHATBOT_UI (já carregados antes).
window.RN10_CHATBOT_FLOWS = (() => {
  const { CONFIG, DATA, NLU, UI } = {
    CONFIG: window.RN10_CHATBOT_CONFIG,
    DATA: window.RN10_CHATBOT_DATA,
    NLU: window.RN10_CHATBOT_NLU,
    UI: window.RN10_CHATBOT_UI,
  };

  const isInnerPage = document.body.classList.contains('inner-page');
  const pathPrefix = isInnerPage ? '..' : '.';
  const withPrefix = (relativePath) => (/^https?:/.test(relativePath) ? relativePath : `${pathPrefix}/${relativePath}`);

  // Contexto mantido apenas durante a sessão da página atual (spec item 25).
  const session = { intent: null, unit: null, area: null, misunderstoodCount: 0 };
  // Controla se o usuário já digitou algo em texto livre nesta conversa,
  // para nunca abrir a primeira resposta a um texto com "não entendi".
  let hasSentFreeText = false;

  const resetSession = () => {
    session.intent = null;
    session.unit = null;
    session.area = null;
    session.misunderstoodCount = 0;
  };

  const UNIT_LABELS = {
    joinha: 'Joinha',
    'via-gas': 'Viagás',
    cremoneze: 'Cremoneze',
    'mega-engenho-novo': 'Mega',
    grajau: 'Grajaú',
    senna: 'Senna',
    'cruzada-peninsula': 'Península',
  };

  const unitOptions = (units) => units.map((unit) => ({ label: UNIT_LABELS[unit.slug] || unit.nome, value: unit.slug }));

  const calculateDistanceKm = (fromLat, fromLng, toLat, toLng) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const deltaLat = toRad(toLat - fromLat);
    const deltaLng = toRad(toLng - fromLng);
    const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(deltaLng / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const mailtoLink = (email, subject, body) => {
    const params = new URLSearchParams({ subject, body });
    return `mailto:${email}?${params.toString()}`;
  };

  const showMainMenu = () => {
    UI.addBotMessage('Como posso ajudar você?');
    UI.addOptions(
      [
        { label: '📍 Encontrar um posto', value: 'find_unit' },
        { label: '🚚 Cadastre sua frota', value: 'fleet' },
        { label: '🛍️ Delivery', value: 'delivery' },
        { label: '🎁 Promoções', value: 'promotions' },
        { label: '🛠️ Soluções e suporte', value: 'contact' },
        { label: '🏢 Sobre nós', value: 'about' },
        { label: '💼 Trabalhe conosco', value: 'careers' },
        { label: '📞 Contato', value: 'contact' },
        { label: '📱 Redes sociais', value: 'social' },
        { label: '❓ Outros assuntos', value: 'fallback_menu' },
      ],
      handleMenuChoice
    );
  };

  const showHomeBar = () => {
    UI.addOptions([{ label: '🏠 Voltar ao início', value: 'home' }], handleGlobalOption);
  };

  const handleGlobalOption = (value) => {
    if (value === 'home') {
      resetSession();
      UI.addUserMessage('🏠 Voltar ao início');
      showMainMenu();
    }
  };

  // --- Encontrar posto -------------------------------------------------
  const startFindUnit = () => {
    session.intent = 'find_unit';
    UI.addBotMessage('📍 Podemos usar sua localização para encontrar a unidade Rede Nota 10 mais próxima.');
    UI.addOptions(
      [
        { label: '📍 Permitir localização', value: 'geo_yes' },
        { label: '✍️ Informar bairro/cidade', value: 'geo_no' },
      ],
      handleFindUnitChoice
    );
  };

  const renderNearestUnit = (units, origin) => {
    const ranked = [...units].sort(
      (a, b) => calculateDistanceKm(origin.lat, origin.lng, a.lat, a.lng) - calculateDistanceKm(origin.lat, origin.lng, b.lat, b.lng)
    );
    const nearest = ranked[0];
    const distance = calculateDistanceKm(origin.lat, origin.lng, nearest.lat, nearest.lng);
    UI.addBotMessage(
      `A unidade mais próxima é <strong>${nearest.nome}</strong> (${distance.toFixed(1)} km).<br>${nearest.endereco}`
    );
    UI.addOptions([{ label: '🗺️ Ver no mapa completo', value: 'open_units_page' }], (value) => {
      if (value === 'open_units_page') window.open(withPrefix(CONFIG.links.unidades), '_blank', 'noopener');
    });
    showHomeBar();
  };

  const handleFindUnitChoice = (value) => {
    if (value === 'geo_yes') {
      UI.addUserMessage('📍 Permitir localização');
      if (!navigator.geolocation) {
        UI.addBotMessage('Seu navegador não permite localização automática. Informe seu bairro, cidade ou região.');
        promptNeighborhood();
        return;
      }
      UI.addBotMessage('Solicitando sua localização...');
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          const units = await DATA.getUnits();
          renderNearestUnit(units, { lat: coords.latitude, lng: coords.longitude });
        },
        () => {
          UI.addBotMessage('Não foi possível acessar sua localização. Informe seu bairro, cidade ou região para encontrarmos uma unidade próxima.');
          promptNeighborhood();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
      return;
    }

    UI.addUserMessage('✍️ Informar bairro/cidade');
    UI.addBotMessage('Sem problema! Informe seu bairro, cidade ou região para encontrarmos uma unidade próxima.');
    promptNeighborhood();
  };

  const promptNeighborhood = () => {
    session.intent = 'find_unit_text';
  };

  const handleNeighborhoodText = async (text) => {
    const units = await DATA.getUnits();
    const match = DATA.findUnitByText(units, text);
    if (match) {
      UI.addBotMessage(`Encontrei a unidade <strong>${match.nome}</strong>: ${match.endereco}`);
    } else {
      UI.addBotMessage('Não encontrei uma unidade exata para esse local. Veja o mapa completo para conferir a mais próxima:');
    }
    UI.addOptions([{ label: '🗺️ Ver no mapa completo', value: 'open_units_page' }], (value) => {
      if (value === 'open_units_page') window.open(withPrefix(CONFIG.links.unidades), '_blank', 'noopener');
    });
    showHomeBar();
    session.intent = null;
  };

  // --- Frota -------------------------------------------------------------
  const startFleet = () => {
    UI.addBotMessage('🚚 Sua empresa possui uma frota?<br>A Rede Nota 10 possui soluções para facilitar o abastecimento e a gestão da sua operação.');
    UI.addOptions(
      [
        { label: '🚚 Cadastrar minha frota', value: 'fleet_new' },
        { label: '📋 Já tenho cadastro', value: 'fleet_existing' },
        { label: '🛠️ Preciso de suporte', value: 'contact' },
        { label: '💬 Falar com equipe', value: 'contact' },
      ],
      handleMenuChoice
    );
  };

  // --- Delivery ------------------------------------------------------------
  const startDelivery = () => {
    UI.addBotMessage('🛍️ Quer pedir produtos da nossa loja de conveniência?<br>Escolha seu aplicativo preferido:');
    UI.addOptions(
      [
        { label: 'iFood', value: 'ifood' },
        { label: '99Food', value: 'food99' },
      ],
      (value) => {
        UI.addUserMessage(value === 'ifood' ? 'iFood' : '99Food');
        window.open(CONFIG.links[value], '_blank', 'noopener');
        showHomeBar();
      }
    );
  };

  // --- Promoções -------------------------------------------------------------
  const startPromotions = () => {
    UI.addBotMessage('🎁 Quer aproveitar nossas promoções?<br>Confira os benefícios disponíveis no app KMV e acompanhe nosso Instagram para não perder nenhuma novidade.');
    UI.addOptions(
      [
        { label: '📱 Ver benefícios no KMV', value: 'kmv' },
        { label: '📸 Ver promoções no Instagram', value: 'instagram' },
      ],
      (value) => {
        UI.addUserMessage(value === 'kmv' ? 'Ver benefícios no KMV' : 'Ver promoções no Instagram');
        window.open(CONFIG.links[value], '_blank', 'noopener');
        showHomeBar();
      }
    );
  };

  // --- Redes sociais -----------------------------------------------------------
  const startSocial = () => {
    UI.addBotMessage('📱 Redes sociais da Rede Nota 10:');
    UI.addOptions(
      [
        { label: 'Instagram', value: 'instagram' },
        { label: 'Facebook', value: 'facebook' },
        { label: 'LinkedIn', value: 'linkedin' },
      ],
      (value) => {
        UI.addUserMessage(value);
        const link = CONFIG.links[value];
        if (link === CONFIG.PENDING) {
          UI.addBotMessage('Esse link ainda não foi configurado. Em breve estará disponível.');
        } else {
          window.open(link, '_blank', 'noopener');
        }
        showHomeBar();
      }
    );
  };

  // --- Sobre / Trabalhe conosco ------------------------------------------------
  const startAbout = () => {
    UI.addBotMessage('🏢 Conheça a Rede Nota 10');
    UI.addOptions([{ label: 'Ver página Sobre Nós', value: 'go' }], () => {
      window.open(withPrefix(CONFIG.links.sobreNos), '_blank', 'noopener');
      showHomeBar();
    });
  };

  const startCareers = () => {
    UI.addBotMessage('💼 Quer fazer parte da Rede Nota 10?<br>Para assuntos relacionados a currículo, oportunidades e processos seletivos, entre em contato com nosso RH.');
    UI.addOptions(
      [
        { label: '📝 Enviar currículo pelo site', value: 'page' },
        { label: '✉️ Falar com o RH por e-mail', value: 'email' },
      ],
      (value) => {
        if (value === 'page') {
          window.open(withPrefix(CONFIG.links.trabalheConosco), '_blank', 'noopener');
        } else {
          window.location.href = mailtoLink(CONFIG.rh.email, 'Trabalhe Conosco', 'Olá, gostaria de enviar meu currículo.');
        }
        showHomeBar();
      }
    );
  };

  // --- Contato / Soluções / Suporte -------------------------------------------------
  const startContact = async () => {
    session.intent = 'contact';
    UI.addBotMessage('📍 Para direcionarmos seu atendimento para a equipe correta, qual unidade você deseja contatar?');
    const units = await DATA.getUnits();
    UI.addOptions(
      [...unitOptions(units), { label: '📍 Usar minha localização', value: 'use_location' }],
      (value) => handleUnitChoice(value, units)
    );
  };

  const handleUnitChoice = (value, units) => {
    if (value === 'use_location') {
      UI.addUserMessage('📍 Usar minha localização');
      if (!navigator.geolocation) {
        UI.addBotMessage('Não consegui acessar sua localização. Escolha a unidade na lista.');
        UI.addOptions(unitOptions(units), (unitSlug) => handleUnitChoice(unitSlug, units));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const ranked = [...units].sort(
            (a, b) => calculateDistanceKm(coords.latitude, coords.longitude, a.lat, a.lng) - calculateDistanceKm(coords.latitude, coords.longitude, b.lat, b.lng)
          );
          session.unit = ranked[0];
          UI.addBotMessage(`Unidade mais próxima: <strong>${session.unit.nome}</strong>.`);
          askArea();
        },
        () => {
          UI.addBotMessage('Não consegui acessar sua localização. Escolha a unidade na lista.');
          UI.addOptions(unitOptions(units), (unitSlug) => handleUnitChoice(unitSlug, units));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      );
      return;
    }

    const unit = units.find((item) => item.slug === value);
    session.unit = unit;
    UI.addUserMessage(UNIT_LABELS[value] || value);
    askArea();
  };

  const askArea = () => {
    UI.addBotMessage('Perfeito! Agora precisamos saber qual área pode ajudar você.');
    UI.addOptions(
      [
        { label: '🏪 Loja', value: 'loja' },
        { label: '⛽ Pista', value: 'pista' },
        { label: '🚚 Cadastro de frota', value: 'frota' },
        { label: '💳 Problema com pagamento', value: 'pagamento' },
      ],
      handleAreaChoice
    );
  };

  const AREA_LABELS = { loja: '🏪 Loja', pista: '⛽ Pista', frota: '🚚 Cadastro de frota', pagamento: '💳 Problema com pagamento' };

  const handleAreaChoice = (value) => {
    UI.addUserMessage(AREA_LABELS[value] || value);
    session.area = value;

    if (value === 'frota') {
      startFleet();
      return;
    }
    if (value === 'pagamento') {
      startPaymentProblem();
      return;
    }
    // Loja ou pista: direciona para formulário de contato pré-preenchido (mailto).
    openContactForm(value);
  };

  const openContactForm = (area) => {
    const unit = session.unit;
    if (!unit) {
      UI.addBotMessage('Não identifiquei a unidade. Vamos recomeçar essa etapa.');
      startContact();
      return;
    }

    const email = area === 'loja' ? unit.lojaEmail : unit.pistaEmail;
    const areaLabel = area === 'loja' ? 'Loja' : 'Pista';
    UI.addBotMessage(
      `Vamos abrir seu e-mail para falar com a equipe de <strong>${areaLabel}</strong> da unidade <strong>${unit.nome}</strong>. Preencha nome, mensagem e envie.`
    );
    UI.addOptions([{ label: `✉️ Abrir e-mail para ${areaLabel}`, value: 'send' }], () => {
      window.location.href = mailtoLink(
        email,
        `Contato Nota 10 - ${areaLabel} - ${unit.nome}`,
        `Olá, meu nome é ___.\nUnidade: ${unit.nome}\nÁrea: ${areaLabel}\nMensagem: `
      );
      showHomeBar();
    });
  };

  // --- Problema de pagamento --------------------------------------------------------
  const startPaymentProblem = () => {
    session.intent = 'payment_problem';
    UI.addBotMessage('💳 Onde ocorreu o problema com o pagamento?');
    UI.addOptions(
      [
        { label: '🏪 Loja', value: 'loja' },
        { label: '📱 Aplicativo', value: 'app' },
        { label: '⛽ Pista', value: 'pista' },
      ],
      handlePaymentLocationChoice
    );
  };

  const handlePaymentLocationChoice = (value) => {
    UI.addUserMessage(value === 'loja' ? '🏪 Loja' : value === 'app' ? '📱 Aplicativo' : '⛽ Pista');

    if (value === 'app') {
      UI.addBotMessage('📱 Qual aplicativo você utilizou?');
      UI.addOptions(
        [
          { label: 'iFood', value: 'ifood' },
          { label: '99Food', value: 'food99' },
          { label: 'Outro', value: 'outro' },
        ],
        handlePaymentAppChoice
      );
      return;
    }

    if (!session.unit) {
      UI.addBotMessage('Antes de continuar, me diga: em qual unidade isso aconteceu?');
      DATA.getUnits().then((units) => {
        UI.addOptions(unitOptions(units), (unitSlug) => {
          session.unit = units.find((item) => item.slug === unitSlug);
          UI.addUserMessage(UNIT_LABELS[unitSlug] || unitSlug);
          routeManagerContact(value);
        });
      });
      return;
    }

    routeManagerContact(value);
  };

  const handlePaymentAppChoice = (value) => {
    if (value === 'ifood') {
      UI.addUserMessage('iFood');
      UI.addBotMessage('Para pedidos feitos por aplicativo, o atendimento sobre pagamento deve ser feito diretamente pelo canal oficial do iFood.');
      UI.addOptions([{ label: 'Abrir atendimento iFood', value: 'go' }], () => window.open(CONFIG.links.ifood, '_blank', 'noopener'));
      showHomeBar();
      return;
    }
    if (value === 'food99') {
      UI.addUserMessage('99Food');
      UI.addBotMessage('Para pedidos feitos por aplicativo, o atendimento sobre pagamento deve ser feito diretamente pelo canal oficial do 99Food.');
      UI.addOptions([{ label: 'Abrir atendimento 99Food', value: 'go' }], () => window.open(CONFIG.links.food99, '_blank', 'noopener'));
      showHomeBar();
      return;
    }
    UI.addUserMessage('Outro aplicativo');
    UI.addBotMessage('Não temos um canal específico para esse aplicativo. Vou te encaminhar para o atendimento humano.');
    handoffToHuman();
  };

  // Direciona para o gerente correto sem nunca expor telefone na interface (spec item 23).
  const routeManagerContact = (locationType) => {
    const unit = session.unit;
    const key = `${unit.slug}-${locationType}`;
    const phone = CONFIG.gerentes[key];
    const label = locationType === 'loja' ? 'gerente responsável pela loja' : 'gerente da unidade';

    UI.addBotMessage(
      locationType === 'loja'
        ? `💳 Vamos direcionar você para a ${label}.`
        : `💳 Como se trata de um problema de pagamento ocorrido na pista, vamos direcionar você para o ${label}.`
    );

    UI.addOptions([{ label: '💬 Falar com o(a) gerente', value: 'go' }], () => {
      openManagerWhatsapp(unit.slug, locationType, phone);
      showHomeBar();
    });
  };

  // Número fica só nesta função — nunca renderizado em texto/HTML visível.
  const openManagerWhatsapp = (unitSlug, department, phone) => {
    if (!phone || phone === CONFIG.PENDING) {
      UI.addBotMessage('O contato direto do gerente ainda não foi configurado. Vou te encaminhar para o atendimento humano.');
      handoffToHuman();
      return;
    }
    const digits = String(phone).replace(/\D/g, '');
    window.open(`https://wa.me/${digits}`, '_blank', 'noopener');
  };

  // --- Fallback / atendimento humano ------------------------------------------------
  const showFallback = () => {
    session.misunderstoodCount += 1;
    if (session.misunderstoodCount > 2) {
      UI.addBotMessage('Vou encaminhar você para nossa equipe para que possamos ajudar da melhor maneira.');
      handoffToHuman();
      return;
    }
    UI.addBotMessage('🤔 Não consegui entender exatamente o que você precisa.<br>Você pode escolher uma das opções abaixo ou explicar sua dúvida com outras palavras.');
    UI.addOptions(
      [
        { label: '📍 Encontrar um posto', value: 'find_unit' },
        { label: '🚚 Frota', value: 'fleet' },
        { label: '🛍️ Delivery', value: 'delivery' },
        { label: '🎁 Promoções', value: 'promotions' },
        { label: '🛠️ Suporte', value: 'contact' },
        { label: '📞 Contato', value: 'contact' },
        { label: '💬 Falar com atendimento', value: 'human' },
      ],
      handleMenuChoice
    );
  };

  const handoffToHuman = () => {
    UI.addBotMessage('Você pode falar diretamente com nossa equipe pelo e-mail de contato geral:');
    UI.addOptions([{ label: '✉️ Enviar e-mail', value: 'go' }], () => {
      window.location.href = mailtoLink('contato@redenota10.com.br', 'Atendimento Assistente Nota 10', 'Olá, preciso de ajuda.');
      showHomeBar();
    });
  };

  // --- Roteador central de opções do menu -------------------------------------------
  const handleMenuChoice = (value, label) => {
    if (label) UI.addUserMessage(label);
    resetSession();

    switch (value) {
      case 'find_unit': startFindUnit(); break;
      case 'fleet': startFleet(); break;
      case 'delivery': startDelivery(); break;
      case 'promotions': startPromotions(); break;
      case 'contact': startContact(); break;
      case 'about': startAbout(); break;
      case 'careers': startCareers(); break;
      case 'social': startSocial(); break;
      case 'human': handoffToHuman(); break;
      case 'fleet_new':
        window.open(withPrefix(CONFIG.links.cadastroFrota), '_blank', 'noopener');
        showHomeBar();
        break;
      case 'fleet_existing':
        UI.addBotMessage('Certo! Nossa equipe comercial pode localizar seu cadastro. Vamos te direcionar para o contato.');
        startContact();
        break;
      case 'fallback_menu':
        UI.addBotMessage('Descreva com suas palavras o que você precisa, ou escolha uma opção:');
        showMainMenu();
        break;
      default:
        showFallback();
    }
  };

  // --- Linguagem natural (texto livre digitado pelo usuário) --------------------------
  const GREETING_REPLIES = [
    'Olá! 😊 Que bom falar com você.',
    'Oi! Tudo bem? Fico feliz em ajudar.',
    'Olá, seja bem-vindo(a) novamente!',
  ];

  const respondToGreeting = () => {
    const reply = GREETING_REPLIES[Math.floor(Math.random() * GREETING_REPLIES.length)];
    UI.addBotMessage(reply);
    showMainMenu();
  };

  const handleFreeText = async (text) => {
    UI.addUserMessage(text);

    if (session.intent === 'find_unit_text') {
      await handleNeighborhoodText(text);
      return;
    }

    // Cumprimentos (oi, olá, bom dia...) sempre recebem resposta cordial + menu,
    // e nunca a mensagem de "não entendi".
    if (NLU.detectGreeting(text)) {
      hasSentFreeText = true;
      session.misunderstoodCount = 0;
      respondToGreeting();
      return;
    }

    const intent = NLU.detectIntent(text);
    const unitHint = await DATA.getUnits().then((units) => DATA.findUnitByText(units, text));
    const areaHint = NLU.detectArea(text);
    const appHint = NLU.detectApp(text);

    if (!intent) {
      // A primeira mensagem em texto livre do usuário nunca deve começar com "não entendi":
      // cumprimentamos e mostramos o menu antes de considerar uma resposta como não compreendida.
      if (!hasSentFreeText) {
        hasSentFreeText = true;
        respondToGreeting();
        return;
      }
      showFallback();
      return;
    }

    hasSentFreeText = true;
    session.misunderstoodCount = 0;

    if (intent === 'payment_problem') {
      if (unitHint && (areaHint === 'loja' || areaHint === 'pista')) {
        session.unit = unitHint;
        UI.addBotMessage(`Entendi: problema de pagamento na <strong>${areaHint}</strong> da unidade <strong>${unitHint.nome}</strong>.`);
        routeManagerContact(areaHint);
        return;
      }
      if (appHint) {
        UI.addBotMessage('Entendi que foi um problema com pedido por aplicativo.');
        handlePaymentAppChoice(appHint);
        return;
      }
      startPaymentProblem();
      return;
    }

    if (intent === 'contact' && unitHint) {
      session.unit = unitHint;
      if (areaHint === 'loja' || areaHint === 'pista') {
        UI.addBotMessage(`Entendi: você quer falar com a área de <strong>${areaHint}</strong> da unidade <strong>${unitHint.nome}</strong>.`);
        handleAreaChoice(areaHint);
        return;
      }
      UI.addBotMessage(`Entendi: você quer falar com a unidade <strong>${unitHint.nome}</strong>.`);
      askArea();
      return;
    }

    handleMenuChoice(intent);
  };

  const init = () => {
    UI.addBotMessage('👋 Olá! Eu sou o Assistente Nota 10!<br>Seja bem-vindo(a) à Rede Nota 10. ⛽');
    showMainMenu();
  };

  return { init, resetSession, handleFreeText, handleMenuChoice, showMainMenu };
})();
