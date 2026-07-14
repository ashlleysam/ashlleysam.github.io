const themePaths = [
  '/theme.json',
  'theme.json',
  '../theme.json',
  '../../theme.json'
];

async function loadThemeConfig() {
  for (const path of themePaths) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        continue;
      }
      return await response.json();
    } catch (error) {
      continue;
    }
  }
  return null;
}

function applyTheme(config) {
  if (!config) {
    return;
  }
  const root = document.documentElement;
  root.style.setProperty('--font-family', config.font || 'Inter, system-ui, sans-serif');
  root.style.setProperty('--background-color', config.background || '#f5f7fb');
  root.style.setProperty('--surface-color', config.surface || '#ffffff');
  root.style.setProperty('--text-color', config.text || '#1d2939');
  root.style.setProperty('--primary-color', config.primary || '#1f4e79');
  root.style.setProperty('--accent-color', config.accent || '#dd6b20');
  root.style.setProperty('--muted-color', config.muted || '#4b5563');
  root.style.setProperty('--border-color', config.border || '#d1d5db');
  root.style.setProperty('--nav-text-color', config.navText || '#ffffff');
}

function activateNavigation() {
  const links = Array.from(document.querySelectorAll('nav.site-nav a'));
  const currentUrl = new URL(window.location.href);
  const currentPath = currentUrl.pathname.replace(/\/index\.html$/, '/');
  const currentHash = currentUrl.hash || '#home';

  for (const link of links) {
    try {
      const href = link.getAttribute('href');
      const linkUrl = new URL(href, window.location.href);
      const linkPath = linkUrl.pathname.replace(/\/index\.html$/, '/');
      const linkHash = linkUrl.hash || '#home';

      const isSamePage = linkPath === currentPath;
      const isActive = isSamePage && (linkHash === currentHash || (linkHash === '#home' && currentHash === ''));
      if (isActive) {
        link.classList.add('active');
      }
    } catch (_) {
      continue;
    }
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  const config = await loadThemeConfig();
  applyTheme(config);
  activateNavigation();
});
