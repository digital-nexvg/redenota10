(() => {
  const form = document.querySelector('[data-fleet-form]');
  if (!form) return;

  const subjectSelect = form.querySelector('[data-fleet-subject]');
  const subjectInput = form.querySelector('[data-fleet-subject-input]');
  const statusEl = form.querySelector('[data-fleet-status]');
  const formSection = document.querySelector('[data-fleet-form-section]');
  const successSection = document.querySelector('[data-fleet-success]');
  const groups = [...form.querySelectorAll('[data-fleet-group]')];
  if (!subjectSelect || !groups.length) return;

  const SUBJECT_GROUP = {
    'novos-negocios': 'frota',
    comercial: 'frota',
    sugestoes: 'sugestao',
  };

  const SUBJECT_LABEL = {
    'novos-negocios': 'Cadastre sua Frota - Novos negócios',
    comercial: 'Cadastre sua Frota - Comercial',
    sugestoes: 'Cadastre sua Frota - Sugestões',
  };

  const setGroupVisible = (group, isVisible) => {
    group.hidden = !isVisible;
    group.querySelectorAll('input, textarea, select').forEach((field) => {
      if (isVisible) {
        if (field.dataset.wasRequired === 'true') field.required = true;
        field.disabled = false;
      } else {
        field.dataset.wasRequired = String(field.required);
        field.required = false;
        field.disabled = true;
      }
    });
  };

  const syncGroups = () => {
    const activeGroup = SUBJECT_GROUP[subjectSelect.value] || 'frota';
    groups.forEach((group) => {
      setGroupVisible(group, group.dataset.fleetGroup === activeGroup);
    });
    if (subjectInput) {
      subjectInput.value = SUBJECT_LABEL[subjectSelect.value] || 'Cadastre sua Frota - Rede Nota 10';
    }
  };

  subjectSelect.addEventListener('change', syncGroups);
  syncGroups();

  const showStatus = (message, isError) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.hidden = false;
    statusEl.classList.toggle('form-status--error', Boolean(isError));
    statusEl.classList.toggle('form-status--success', !isError);
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';
    }
    if (statusEl) statusEl.hidden = true;

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        if (!response.ok) throw new Error('Falha no envio do formulário.');
        form.reset();
        syncGroups();
        if (formSection && successSection) {
          formSection.hidden = true;
          successSection.hidden = false;
          successSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          showStatus('Cadastro enviado com sucesso! Em breve nossa equipe entrará em contato.', false);
        }
      })
      .catch(() => {
        showStatus('Não foi possível enviar agora. Tente novamente em alguns instantes.', true);
      })
      .finally(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Enviar cadastro';
        }
      });
  });
})();

