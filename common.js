const themeVariables = {
  primary: '--primary-color',
  secondary: '--secondary-color',
  accent: '--accent-color',
  background: '--background-color',
  surface: '--surface-color',
  text: '--text-color',
  muted: '--muted-color',
  border: '--border-color',
  navText: '--nav-text-color'
};

let themes = { light: null, dark: null };

function siteRoot() {
  return new URL(document.body.dataset.siteRoot || (window.location.pathname.includes('/fun/') ? '../' : './'), document.baseURI);
}

function renderSiteChrome() {
  const inFunPage = window.location.pathname.includes('/fun/');
  const home = (section) => inFunPage ? `../index.html#${section}` : `#${section}`;
  const fun = inFunPage ? 'index.html' : 'fun/index.html';

  const headerTarget = document.querySelector('[data-site-header]') || document.querySelector('.site-header');
  headerTarget.outerHTML = `
    <header class="site-header">
      <div class="site-brand">
        <h1>Ashley Samuelson</h1>
        <p>Computer Science Ph.D. Candidate | UW-Madison</p>
      </div>
    </header>`;

  const navTarget = document.querySelector('[data-site-nav]') || document.querySelector('.site-nav');
  navTarget.outerHTML = `
    <nav class="site-nav" aria-label="Site navigation">
      <div class="menu-overlay" aria-hidden="true"></div>
      <div class="site-nav-container">
        <div class="nav-menu">
          <button class="close-menu" aria-label="Close Menu">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <ul>
            <li class="nav-item section-link"><a href="${home('home')}">Home</a></li>
            <li class="nav-item section-link"><a href="${home('about')}">About</a></li>
            <li class="nav-item section-link"><a href="${home('research')}">Research</a></li>
            <li class="nav-item section-link"><a href="${home('teaching')}">Teaching</a></li>
            <li class="nav-item section-link"><a href="${home('talks')}">Talks</a></li>
            <li class="nav-item page-link"><a href="${fun}">Fun</a></li>
          </ul>
        </div>
        <button class="theme-toggle" type="button" aria-label="Toggle theme">
          <svg class="theme-icon sun" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l-1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
          <svg class="theme-icon moon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
        <button class="hamburger-menu" aria-label="Open Menu">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>
    </nav>`;

  const footerTarget = document.querySelector('[data-site-footer]');
  if (footerTarget) {
    footerTarget.innerHTML = `
      <footer><div class="site-footer">
        <span class="credit-icon" aria-hidden="true"></span>
        <span>Theme adapted from the <a href="https://github.com/HugoBlox/hugo-theme-academic-cv/tree/main">Hugo Academic CV theme</a>.</span>
      </div></footer>`;
  }

  const closeMenu = () => document.body.classList.remove('menu-open');
  document.querySelector('.menu-overlay').addEventListener('click', closeMenu);
  document.querySelector('.close-menu').addEventListener('click', closeMenu);
  document.querySelector('.hamburger-menu').addEventListener('click', () => document.body.classList.add('menu-open'));
}

async function loadThemeConfigs() {
  const root = siteRoot();
  const [lightResponse, darkResponse] = await Promise.all([
    fetch(new URL('light-theme.json', root)),
    fetch(new URL('dark-theme.json', root))
  ]);
  if (!lightResponse.ok || !darkResponse.ok) throw new Error('Unable to load theme configuration');
  themes.light = await lightResponse.json();
  themes.dark = await darkResponse.json();
}

function applyTheme(name) {
  const config = themes[name];
  if (!config) return;
  const root = document.documentElement;
  Object.entries(themeVariables).forEach(([key, variable]) => root.style.setProperty(variable, config[key]));
  Object.entries({ main: config.primary, secondary: config.secondary, accent: config.accent, background: config.background, surface: config.surface, text: config.text, muted: config.muted, border: config.border })
    .forEach(([key, value]) => root.style.setProperty(`--color-${key}`, value));
  if (config.font) root.style.setProperty('--font-family', config.font);
  root.classList.toggle('dark-mode', name === 'dark');
  root.classList.toggle('light-mode', name === 'light');
  localStorage.setItem('site-theme', name);
  localStorage.setItem('site-theme-config', JSON.stringify(config));
}

function initializeThemeToggle() {
  const toggle = document.querySelector('.theme-toggle');
  if (!toggle) return;
  const preferred = localStorage.getItem('site-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  toggle.setAttribute('aria-label', preferred === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
  toggle.addEventListener('click', () => {
    const next = document.documentElement.classList.contains('dark-mode') ? 'light' : 'dark';
    applyTheme(next);
    toggle.setAttribute('aria-label', next === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
  });
}

function activateNavigation() {
  const links = [...document.querySelectorAll('nav.site-nav a')];
  const sections = [...document.querySelectorAll('main [id]')];
  const update = () => {
    const currentUrl = new URL(window.location.href);
    const currentSection = sections.reduce((current, section) => window.scrollY >= section.offsetTop - 128 ? section.id : current, 'home');
    links.forEach((link) => {
      const url = new URL(link.href);
      const active = url.pathname === currentUrl.pathname && (!url.hash || url.hash === `#${currentSection}`);
      link.closest('li')?.classList.toggle('active', active);
      link.classList.toggle('active', active);
    });
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  addEventListener('hashchange', update);
  update();
}

document.addEventListener('DOMContentLoaded', async () => {
  renderSiteChrome();
  await loadThemeConfigs();
  applyTheme(localStorage.getItem('site-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  initializeThemeToggle();
  activateNavigation();
  document.documentElement.classList.add('theme-ready');
  document.body.classList.add('theme-ready');
});
