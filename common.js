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
  applyTheme(config);
  activateNavigation();
});
