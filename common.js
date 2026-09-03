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

const siteRootUrl = new URL('./', import.meta.url);

function relativeUrl(target) {
  const pageDirectory = new URL('./', window.location.href);
  const targetUrl = new URL(target, siteRoot());
  const fromParts = pageDirectory.pathname.split('/').filter(Boolean);
  const targetParts = targetUrl.pathname.split('/').filter(Boolean);
  let commonParts = 0;
  while (commonParts < fromParts.length && commonParts < targetParts.length && fromParts[commonParts] === targetParts[commonParts]) {
    commonParts += 1;
  }
  const path = `${'../'.repeat(fromParts.length - commonParts)}${targetParts.slice(commonParts).join('/')}`;
  return `${path || './'}${targetUrl.search}${targetUrl.hash}`;
}

function siteRoot() {
  return new URL(document.body.dataset.siteRoot || siteRootUrl, document.baseURI);
}

async function renderSiteChrome() {
  const headerTarget = document.querySelector('[data-site-header]') || document.querySelector('.site-header');
  headerTarget.outerHTML = `
    <header class="site-header">
      <div class="site-brand">
        <h1>Ashley Samuelson</h1>
        <p>Computer Science Ph.D. Candidate | UW-Madison</p>
      </div>
    </header>`;

  const navTarget = document.querySelector('[data-site-nav]') || document.querySelector('.site-nav');
  const navResponse = await fetch(new URL('nav.html', siteRoot()));
  if (!navResponse.ok) throw new Error('Unable to load navigation');
  navTarget.outerHTML = await navResponse.text();
  const nav = document.querySelector('.site-nav');
  nav.querySelectorAll('[data-nav-target]').forEach((link) => {
    link.href = relativeUrl(link.dataset.navTarget);
  });

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
  await renderSiteChrome();
  await loadThemeConfigs();
  applyTheme(localStorage.getItem('site-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  initializeThemeToggle();
  activateNavigation();
  document.documentElement.classList.add('theme-ready');
  document.body.classList.add('theme-ready');
});
