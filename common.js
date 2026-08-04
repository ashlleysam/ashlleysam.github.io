let themes = { light: null, dark: null };

async function loadThemeConfigs() {
  try {
    const [lightRes, darkRes] = await Promise.all([
      fetch('/light-theme.json'),
      fetch('/dark-theme.json')
    ]);
    themes.light = await lightRes.json();
    themes.dark = await darkRes.json();
  } catch (error) {
    console.error("Failed to load themes", error);
  }
}

function applyTheme(themeName) {
  const config = themes[themeName];
  if (!config) return;

  const root = document.documentElement;
  
  // Set core variables
  root.style.setProperty('--primary-color', config.primary);
  root.style.setProperty('--secondary-color', config.secondary);
  root.style.setProperty('--accent-color', config.accent);
  root.style.setProperty('--background-color', config.background);
  root.style.setProperty('--surface-color', config.surface);
  root.style.setProperty('--text-color', config.text);
  root.style.setProperty('--muted-color', config.muted);
  root.style.setProperty('--border-color', config.border);
  root.style.setProperty('--nav-text-color', config.navText);
  
  // Fallbacks corresponding to original CSS variables
  root.style.setProperty('--color-main', config.primary);
  root.style.setProperty('--color-secondary', config.secondary);
  root.style.setProperty('--color-accent', config.accent);
  root.style.setProperty('--color-background', config.background);
  root.style.setProperty('--color-surface', config.surface);
  root.style.setProperty('--color-text', config.text);
  root.style.setProperty('--color-muted', config.muted);
  root.style.setProperty('--color-border', config.border);

  if (config.font) {
    root.style.setProperty('--font-family', config.font);
  }

  // Toggle class for specific CSS overwrites (like the sun/moon icon visibility)
  root.classList.toggle('dark-mode', themeName === 'dark');
  root.classList.toggle('light-mode', themeName === 'light');

  // Cache state and raw config to prevent flickering on reload
  localStorage.setItem('site-theme', themeName);
  localStorage.setItem('site-theme-config', JSON.stringify(config));
}

function initializeThemeToggle() {
  const themeToggle = document.querySelector('.theme-toggle');
  if (!themeToggle) return;

  const storedTheme = localStorage.getItem('site-theme');
  const defaultTheme = storedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  themeToggle.setAttribute('aria-label', defaultTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');

  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark-mode');
    const nextTheme = isDark ? 'light' : 'dark';
    
    applyTheme(nextTheme);
    themeToggle.setAttribute('aria-label', nextTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
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
  await loadThemeConfigs();
  const preferredTheme = localStorage.getItem('site-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  applyTheme(preferredTheme);
  initializeThemeToggle();
  activateNavigation();
  
  // Trigger transitions once initial setup is done
  document.documentElement.classList.add('theme-ready');
  document.body.classList.add('theme-ready');
});