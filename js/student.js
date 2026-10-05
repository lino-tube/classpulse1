/* Student pulse selection, validation and confirmation. */
(function () {
  function readableStatus(value) {
    return { understand: 'I Understand', unsure: 'I’m Unsure', stuck: 'I’m Stuck' }[value] || value || 'Not selected';
  }

  function initPulseForm() {
    const form = document.getElementById('pulseForm');
    if (!form) return;
    const cards = [...form.querySelectorAll('.choice-card')];
    const statusInput = document.getElementById('pulseStatus');
    const topic = document.getElementById('topic');
    const note = document.getElementById('note');
    const error = document.getElementById('pulseError');
    const saved = ClassPulse.getStoredJSON(ClassPulse.STORAGE_KEYS.studentPulse, null);

    function selectCard(card) {
      cards.forEach(item => {
        item.classList.remove('selected');
        item.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      statusInput.value = card.dataset.status;
      error.classList.remove('show');
    }

    cards.forEach(card => card.addEventListener('click', () => selectCard(card)));

    if (saved) {
      const matching = cards.find(card => card.dataset.status === saved.status);
      if (matching) selectCard(matching);
      if ([...topic.options].some(option => option.value === saved.topic)) topic.value = saved.topic;
      note.value = saved.note || '';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!statusInput.value || !topic.value) {
        error.textContent = !statusInput.value && !topic.value
          ? 'Please select how you are doing and choose the topic you are working on.'
          : !statusInput.value ? 'Please select how you are doing.' : 'Please select a topic.';
        error.classList.add('show');
        return;
      }
      const pulse = { status: statusInput.value, topic: topic.value, note: note.value.trim(), timestamp: new Date().toISOString() };
      ClassPulse.setStoredJSON(ClassPulse.STORAGE_KEYS.studentPulse, pulse);
      window.location.href = 'student-confirmation.html';
    });
  }

  function initConfirmation() {
    const container = document.querySelector('[data-confirmation]');
    if (!container) return;
    const pulse = ClassPulse.getStoredJSON(ClassPulse.STORAGE_KEYS.studentPulse, null);
    if (!pulse) {
      document.getElementById('confirmStatus').textContent = 'No pulse recorded';
      document.getElementById('confirmTopic').textContent = '—';
      document.getElementById('confirmNote').textContent = '—';
      return;
    }
    document.getElementById('confirmStatus').textContent = readableStatus(pulse.status);
    document.getElementById('confirmTopic').textContent = pulse.topic;
    document.getElementById('confirmNote').textContent = pulse.note || 'No optional note added.';
  }

  document.addEventListener('DOMContentLoaded', async function () {
    await ClassPulse.live.ready;
    initPulseForm();
    initConfirmation();
  });
})();
