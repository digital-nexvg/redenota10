(() => {
  const form = document.querySelector('[data-fleet-form]');
  if (!form) return;

  const unitSelect = form.querySelector('[data-fleet-unit]');
  const neighborhoodInput = form.querySelector('[data-fleet-neighborhood]');
  if (!unitSelect || !neighborhoodInput) return;

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
    const recipient = `posto.${unitSelect.value}@redenota10.com.br`;
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
