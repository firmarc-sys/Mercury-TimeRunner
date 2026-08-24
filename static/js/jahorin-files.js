/* THOTH / SCRIBE — real local file ingestion routed through ARI */
(() => {
  'use strict';
  const MAX_BYTES = 1024 * 1024;
  const ACCEPT = 'text/*,.md,.txt,.json,.csv,.html,.css,.js,.jsx,.ts,.tsx,.py,.xml,.yaml,.yml';

  function resultText(result) {
    return result?.result?.text || result?.reply?.text || result?.message || JSON.stringify(result, null, 2);
  }

  function bind(root=document) {
    const doc = root.querySelector?.('#doc');
    if (!doc || doc.dataset.jtFiles === '1') return;
    doc.dataset.jtFiles = '1';
    const row = root.querySelector('.panel .row');
    const output = root.querySelector('#out');
    if (!row) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPT;
    input.hidden = true;
    input.setAttribute('aria-label','Open text file in Scribe');

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'action secondary';
    open.textContent = 'Files';
    open.addEventListener('click',() => input.click());

    input.addEventListener('change',async() => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > MAX_BYTES) {
        if (output) {
          output.classList.remove('hidden');
          output.textContent = 'File is larger than the 1 MB browser ingestion limit.';
        }
        return;
      }

      try {
        const text = await file.text();
        doc.value = text;
        localStorage.setItem('mercury.scribe',text);
        if (output) {
          output.classList.remove('hidden');
          output.textContent = `Loaded ${file.name}. Sending document context to Jahorin…`;
        }
        const result = await Mercury.dispatch('scribe',`Read and work with ${file.name}`,{
          instrument:'files',
          file:{ name:file.name, type:file.type || 'text/plain', size:file.size, text }
        });
        if (output) output.textContent = resultText(result);
      } catch (error) {
        if (output) {
          output.classList.remove('hidden');
          output.textContent = error.message;
        }
      } finally {
        input.value = '';
      }
    });

    row.prepend(open);
    row.append(input);
  }

  const viewport = document.querySelector('#ari-viewport');
  if (viewport) {
    new MutationObserver(() => bind(viewport)).observe(viewport,{ childList:true, subtree:true });
    bind(viewport);
  } else {
    document.addEventListener('DOMContentLoaded',() => bind(document),{ once:true });
  }
})();
