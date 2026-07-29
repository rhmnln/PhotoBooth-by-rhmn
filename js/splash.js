document.addEventListener('DOMContentLoaded', function () {
  const splash = document.getElementById('splashScreen');
  if (!splash) return;

  if (sessionStorage.getItem('pb_splash_shown')) {
    splash.classList.add('is-hidden');
    return;
  }

  function dismiss() {
    sessionStorage.setItem('pb_splash_shown', '1');
    splash.classList.add('is-leaving');
    setTimeout(() => splash.classList.add('is-hidden'), 650);
  }

  splash.addEventListener('click', dismiss);
  setTimeout(dismiss, 2200);
});