(() => {
  const form = document.querySelector('[data-fleet-form]');
  if (!form) return;

  const unitSelect = form.querySelector('[data-fleet-unit]');
  const neighborhoodInput = form.querySelector('[data-fleet-neighborhood]');
  if (!unitSelect || !neighborhoodInput) return;

  const UNIT_EMAILS = {
    joinha: 'posto.joinha@redenota10.com.br',
    'via-gas': 'posto.viagas@redenota10.com.br',
    cremoneze: 'posto.cremoneze@redenota10.com.br',
    'mega-engenho-novo': 'posto.mega@redenota10.com.br',
    grajau: 'posto.grajau@redenota10.com.br',
    senna: 'posto.senna@redenota10.com.br',
    'cruzada-peninsula': 'posto.peninsula@redenota10.com.br',
  };

  const syncNeighborhood = () => {
    const selectedOption = unitSelect.selectedOptions[0];
    neighborhoodInput.value = selectedOption.dataset.neighborhood || '';
  };
  unitSelect.addEventListener('change', syncNeighborhood);
  syncNeighborhood();

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const selectedOption = unitSelect.selectedOptions[0];
    const unitName = selectedOption.textContent.trim();
    const recipient = UNIT_EMAILS[unitSelect.value];
    if (!recipient) {
      console.error(`E-mail de cadastro de frota não configurado para a unidade "${unitSelect.value}".`);
      return;
    }

    const subject = `Cadastro de frota - ${unitName}`;
    const body = [
      `Olá! Gostaria de cadastrar minha frota na unidade ${unitName}.`,
      '',
      'Nome da empresa:',
      'Responsável:',
      'E-mail:',
      'Telefone:',
      'Quantidade de veículos:',
      'Observações:',
    ].join('\n');

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
