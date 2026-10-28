// Busy state on submit (stops double payments), auto-post to PayOne, print receipt, confirm risky actions.
document.addEventListener('submit', function (ev) {
  var form = ev.target;
  if (form.dataset.confirm && !window.confirm(form.dataset.confirm)) { ev.preventDefault(); return; }
  var btn = form.querySelector('button[data-busy]');
  if (!btn) return;
  if (btn.disabled) { ev.preventDefault(); return; }
  setTimeout(function () { btn.disabled = true; btn.textContent = btn.dataset.busy; }, 0);
});

document.addEventListener('click', function (ev) {
  if (ev.target.closest('[data-print]')) window.print();
});

// The redirect page posts the signed form to PayOne's hosted payment page by itself.
document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('form[data-autosubmit]');
  if (form) setTimeout(function () { form.submit(); }, 600);
});
