(() => {
  const form = document.querySelector('[data-fleet-form]');
  if (!form) return;

  const subjectSelect = form.querySelector('[data-fleet-subject]');
  const groups = [...form.querySelectorAll('[data-fleet-group]')];
  if (!subjectSelect || !groups.length) return;

  const SUBJECT_GROUP = {
    'novos-negocios': 'frota',
    comercial: 'frota',
    sugestoes: 'sugestao',
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
  };

  subjectSelect.addEventListener('change', syncGroups);
  syncGroups();
})();
