/* Typed participation demo. All messages stay in this browser's storage. */
(function () {
  'use strict';
  const KEY = 'classpulse_voice_messages';
  const synth = window.speechSynthesis;
  const supported = !!(synth && window.SpeechSynthesisUtterance);
  let voices = [];
  const $ = id => document.getElementById(id);
  function messages() {
    const items = ClassPulse.getStoredJSON(KEY, []);
    return Array.isArray(items) ? items.filter(m => m && typeof m.id === 'string' && typeof m.text === 'string' && typeof m.name === 'string' && ['private', 'classroom'].includes(m.delivery)) : [];
  }
  function feedback(text) { $('voiceFeedback').textContent = text; }
  function save(items) {
    try { ClassPulse.setStoredJSON(KEY, items); render(); return true; }
    catch (e) { feedback('Your message could not be saved. Enable browser storage and try again.'); return false; }
  }
  function intro(m) {
    return m.name + ({question:' has a question. ', answer:' would like to answer. ', help:' needs help understanding. '}[m.intent] || ' would like to contribute. ') + m.text;
  }
  function speak(m, done) {
    if (!supported) { feedback('Speech is unavailable in this browser. You can still send and read typed messages.'); return; }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(intro(m));
    utterance.voice = voices.find(v => v.voiceURI === m.voice) || null;
    utterance.rate = [0.8, 1, 1.2].includes(Number(m.rate)) ? Number(m.rate) : 1;
    feedback('Speaking. Use Stop voice to stop playback.');
    utterance.onend = () => { feedback('Playback finished.'); if (done) done(); };
    utterance.onerror = e => { if (!['canceled','interrupted'].includes(e.error)) feedback('Voice playback failed. Check your device audio and try again.'); };
    synth.speak(utterance);
  }
  function element(tag, text, cls) { const el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; return el; }
  function action(card, label, callback) {
    const button = element('button', label, 'btn btn-secondary'); button.type = 'button'; button.addEventListener('click', callback); card.append(button); return button;
  }
  function update(id, state) { const items = messages(); const m = items.find(m => m.id === id); if (m) { m.state = state; save(items); } }
  function renderList(target, items, lecturer) {
    target.replaceChildren();
    if (!items.length) { target.append(element('p', 'No contributions yet.', 'voice-empty')); return; }
    items.slice().reverse().forEach(m => {
      const card = element('article', '', 'voice-message');
      const status = {sent:'Awaiting lecturer', played:'Played to class', read:'Read by lecturer', withdrawn:'Withdrawn'}[m.state] || 'Awaiting lecturer';
      card.append(element('strong', m.name + ' · ' + ({question:'Question',answer:'Answer',help:'Needs help'}[m.intent] || 'Contribution')));
      card.append(element('div', (m.delivery === 'private' ? 'Private' : 'Classroom') + ' · ' + status, 'voice-meta'));
      if (m.state !== 'withdrawn') card.append(element('p', m.text));
      if (lecturer && m.delivery === 'classroom') {
        action(card, m.state === 'played' ? 'Play again' : 'Play to class', () => speak(m, () => update(m.id, 'played')));
      }
      if (lecturer && m.delivery === 'private' && m.state !== 'read') action(card, 'Mark as read', () => update(m.id, 'read'));
      if (!lecturer && m.state === 'sent') action(card, 'Withdraw', () => {
        const items = messages(); const item = items.find(x => x.id === m.id);
        if (item && item.state === 'sent') { item.state = 'withdrawn'; item.text = ''; save(items); }
      });
      target.append(card);
    });
  }
  function render() {
    const items = messages();
    if ($('voiceSent')) renderList($('voiceSent'), items, false);
    if ($('voiceQueue')) renderList($('voiceQueue'), items.filter(m => m.delivery === 'classroom' && m.state !== 'withdrawn'), true);
    if ($('voicePrivate')) renderList($('voicePrivate'), items.filter(m => m.delivery === 'private' && m.state !== 'withdrawn'), true);
  }
  function populateVoices() {
    voices = supported ? synth.getVoices() : [];
    const select = $('voiceChoice'); if (!select) return;
    const old = select.value;
    select.replaceChildren(); const option = element('option', 'Device default voice'); option.value = ''; select.append(option);
    voices.forEach(v => { const o = element('option', v.name + ' (' + v.lang + ')'); o.value = v.voiceURI; select.append(o); });
    if (voices.some(v => v.voiceURI === old)) select.value = old;
  }
  function draft() {
    return {name:$('voiceName').value.trim(), intent:$('voiceIntent').value, text:$('voiceText').value.trim(), delivery:document.querySelector('[name="voiceDelivery"]:checked').value, voice:$('voiceChoice').value, rate:Number($('voiceRate').value)};
  }
  document.addEventListener('DOMContentLoaded', async () => {
    await ClassPulse.live.ready;
    const form = $('voiceForm');
    populateVoices(); if (supported) synth.addEventListener('voiceschanged', populateVoices);
    document.querySelectorAll('[data-stop-voice]').forEach(b => b.addEventListener('click', () => { if (supported) synth.cancel(); feedback('Voice stopped.'); }));
    if (form) {
      $('voiceText').addEventListener('input', () => { $('voiceCount').textContent = $('voiceText').value.length + ' / 1000 characters'; });
      document.querySelectorAll('[name="voiceDelivery"]').forEach(r => r.addEventListener('change', () => { $('voiceSend').textContent = r.value === 'private' ? 'Send privately' : 'Send to classroom queue'; feedback(''); }));
      $('voicePreview').disabled = false;
      if (!supported) feedback('Speech is unavailable here. Typed participation still works.');
      $('voicePreview').addEventListener('click', () => { if (!supported) { feedback('Speech playback is unavailable in this browser. You can still send your typed contribution.'); return; } if (form.reportValidity()) { const m = draft(); if (!m.name || !m.text) { feedback('Please enter a name and message.'); return; } speak(m); } });
      form.addEventListener('submit', event => {
        event.preventDefault(); const m = draft();
        if (!m.name || !m.text) { feedback('Please enter a name and message.'); return; }
        m.id = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
        m.state = 'sent'; m.timestamp = new Date().toISOString();
        if (save([...messages(), m])) {
          $('voiceText').value = ''; $('voiceCount').textContent = '0 / 1000 characters';
          feedback(m.delivery === 'private' ? 'Sent to the lecturer’s private demo inbox. This message will not be read aloud.' : 'Added to the classroom queue. Your lecturer can play it when it is your turn.');
        }
      });
    }
    render(); window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) render(); });
    window.addEventListener('pagehide', () => { if (supported) synth.cancel(); });
  });
})();
