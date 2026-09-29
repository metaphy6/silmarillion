'use strict';
// Documentation interactions only: no game state, network or persistence.
const nav = [...document.querySelectorAll('[data-view]')];
function showView(id) {
  for (const section of document.querySelectorAll('.study')) section.hidden = section.id !== id;
  for (const button of nav) {
    if (button.dataset.view === id) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  document.querySelector('#demo-status').textContent = 'Concept gallery · original artwork + precise live text · no game runtime';
}
for (const button of nav) button.addEventListener('click', () => showView(button.dataset.view));
document.querySelector('#text-scale').addEventListener('change', event => {
  const scale = Number(event.target.value);
  document.documentElement.style.setProperty('--scale', scale);
  document.body.classList.toggle('large-text', scale > 1);
});
for (const input of document.querySelectorAll('[data-layer]')) input.addEventListener('change', () => {
  document.querySelector('.' + input.dataset.layer).style.display = input.checked ? '' : 'none';
});
for (const button of document.querySelectorAll('[data-demo]')) button.addEventListener('click', () => {
  document.querySelector('#demo-status').textContent = button.dataset.demo;
});
for (const button of document.querySelectorAll('[data-reply]')) button.addEventListener('click', () => {
  document.querySelector('#reply').textContent = button.dataset.reply;
});
