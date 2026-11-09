/* Notify — toast modern & ringan (vanilla JS, tanpa dependensi) */
(function () {
  if (window.Notify) return;
  var ICONS = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
  var container = null;

  function getContainer() {
    if (container && document.body.contains(container)) return container;
    container = document.createElement('div');
    container.className = 'hz-toasts';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
    return container;
  }

  function show(type, message, opts) {
    opts = opts || {};
    if (!ICONS[type]) type = 'info';
    var el = document.createElement('div');
    el.className = 'hz-toast hz-' + type;
    el.setAttribute('role', 'alert');
    el.innerHTML =
      '<i class="bi ' + ICONS[type] + ' hz-ico"></i>' +
      '<div class="hz-msg"></div>' +
      '<button type="button" class="hz-x" aria-label="Tutup">&times;</button>' +
      '<div class="hz-bar"></div>';
    el.querySelector('.hz-msg').textContent = message == null ? '' : String(message);
    getContainer().appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });

    var dur = opts.duration || (type === 'error' ? 6500 : 4000);
    var bar = el.querySelector('.hz-bar');
    bar.style.transition = 'transform ' + dur + 'ms linear';
    requestAnimationFrame(function () { bar.style.transform = 'scaleX(0)'; });

    var timer = setTimeout(close, dur);
    function close() {
      clearTimeout(timer);
      el.classList.remove('show');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    }
    el.querySelector('.hz-x').addEventListener('click', close);
    el.addEventListener('mouseenter', function () { clearTimeout(timer); bar.style.transition = 'none'; });
    el.addEventListener('mouseleave', function () { setTimeout(close, 1500); });
    return el;
  }

  window.Notify = {
    show: show,
    success: function (m, o) { return show('success', m, o); },
    error: function (m, o) { return show('error', m, o); },
    warning: function (m, o) { return show('warning', m, o); },
    info: function (m, o) { return show('info', m, o); }
  };
})();
