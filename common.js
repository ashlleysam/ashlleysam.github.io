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

let activeThemeConfig = null;

function applyTheme(config, theme = 'light') {
  activeThemeConfig = config;
  const root = document.documentElement;
  if (config) {
    root.style.setProperty('--font-family', config.font || 'Inter, system-ui, sans-serif');
  }

  root.classList.toggle('dark-mode', theme === 'dark');

  if (theme === 'light') {
    root.style.removeProperty('--background-color');
    root.style.removeProperty('--surface-color');
    root.style.removeProperty('--text-color');
    root.style.removeProperty('--primary-color');
    root.style.removeProperty('--secondary-color');
    root.style.removeProperty('--accent-color');
    root.style.removeProperty('--muted-color');
    root.style.removeProperty('--border-color');
    root.style.removeProperty('--nav-text-color');
    root.style.removeProperty('--color-main');
    root.style.removeProperty('--color-secondary');
    root.style.removeProperty('--color-accent');
    root.style.removeProperty('--color-background');
    root.style.removeProperty('--color-surface');
    root.style.removeProperty('--color-text');
    root.style.removeProperty('--color-muted');
    root.style.removeProperty('--color-border');
  } else if (config) {
    root.style.setProperty('--background-color', config.background || '#07111c');
    root.style.setProperty('--surface-color', config.surface || '#12263d');
    root.style.setProperty('--text-color', config.text || '#f4f7fb');
    root.style.setProperty('--primary-color', config.primary || '#14324f');
    root.style.setProperty('--secondary-color', config.secondary || '#7da2c4');
    root.style.setProperty('--accent-color', config.accent || '#87d7f2');
    root.style.setProperty('--muted-color', config.muted || '#9eb0c5');
    root.style.setProperty('--border-color', config.border || 'rgba(255, 255, 255, 0.12)');
    root.style.setProperty('--nav-text-color', config.navText || '#f4f7fb');
    root.style.setProperty('--color-main', config.primary || '#14324f');
    root.style.setProperty('--color-secondary', config.secondary || '#7da2c4');
    root.style.setProperty('--color-accent', config.accent || '#87d7f2');
    root.style.setProperty('--color-background', config.background || '#07111c');
    root.style.setProperty('--color-surface', config.surface || '#12263d');
    root.style.setProperty('--color-text', config.text || '#f4f7fb');
    root.style.setProperty('--color-muted', config.muted || '#9eb0c5');
    root.style.setProperty('--color-border', config.border || 'rgba(255, 255, 255, 0.12)');
  }
}

function setTheme(theme) {
  const root = document.documentElement;
  root.classList.toggle('dark-mode', theme === 'dark');
  localStorage.setItem('site-theme', theme);
  if (activeThemeConfig) {
    applyTheme(activeThemeConfig, theme);
  }
}

function initializeThemeState() {
  const storedTheme = localStorage.getItem('site-theme');
  const preferredTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark-mode', preferredTheme === 'dark');
  document.documentElement.classList.add('theme-ready');
  document.body.classList.add('theme-ready');
  return preferredTheme;
}

function initializeThemeToggle() {
  const themeToggle = document.querySelector('.theme-toggle');
  if (!themeToggle) {
    return;
  }

  const storedTheme = localStorage.getItem('site-theme');
  const defaultTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setTheme(defaultTheme);
  themeToggle.setAttribute('aria-label', defaultTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.classList.contains('light-mode') ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    setTheme(next);
    themeToggle.setAttribute('aria-label', next === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
  });
}

function activateNavigation() {
  const links = Array.from(document.querySelectorAll('nav.site-nav a'));
  const sections = Array.from(document.querySelectorAll('main [id]'))
    .filter((section) => section.id);

  const getSectionTarget = (link) => {
    const href = link.getAttribute('href') || '';
    if (!href.includes('#')) {
      return null;
    }
    return href.split('#')[1] || null;
  };

  const getLinkPage = (link) => {
    try {
      return new URL(link.href, document.baseURI);
    } catch (e) {
      return null;
    }
  };

  const updateActiveLink = () => {
    const currentUrl = new URL(window.location.href);
    const offset = Math.max(120, document.querySelector('nav.site-nav')?.offsetHeight || 120);
    const scrollPosition = window.scrollY || window.pageYOffset;

    let currentSection = 'home';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      if (scrollPosition >= sectionTop - offset - 8) {
        currentSection = section.id;
      }
    });

    links.forEach((link) => {
      const parentItem = link.closest('li');
      if (parentItem) {
        parentItem.classList.remove('active');
      }
      link.classList.remove('active');

      const linkUrl = getLinkPage(link);
      const linkHash = getSectionTarget(link);
      const samePage = linkUrl && linkUrl.pathname === currentUrl.pathname;
      const isCurrentAnchor = samePage && linkHash === currentSection;
      const isCurrentHome = samePage && (linkHash === 'home' || linkHash === '' || linkUrl.hash === '');
      const isPageLink = linkUrl && !linkUrl.hash && linkUrl.pathname === currentUrl.pathname;

      if (isCurrentAnchor || (currentSection === 'home' && isCurrentHome) || (!linkHash && isPageLink)) {
        link.classList.add('active');
        if (parentItem) {
          parentItem.classList.add('active');
        }
      }
    });
  };

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  window.addEventListener('resize', updateActiveLink);
  window.addEventListener('hashchange', updateActiveLink);
  links.forEach((link) => link.addEventListener('click', () => setTimeout(updateActiveLink, 0)));
  updateActiveLink();
}

window.addEventListener('DOMContentLoaded', async () => {
  const config = await loadThemeConfig();
  const preferredTheme = initializeThemeState();
  applyTheme(config, preferredTheme);
  initializeThemeToggle();
  activateNavigation();
});
