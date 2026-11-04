(() => {
  const root = document.documentElement;
  if (!root.classList.contains('fonts-pending')) return;

  if (!document.fonts) {
    root.classList.remove('fonts-pending');
    return;
  }

  Promise.all([
    document.fonts.load('500 16px NHD'),
    document.fonts.load('700 16px NHD')
  ]).catch(() => {}).finally(() => root.classList.remove('fonts-pending'));
})();
