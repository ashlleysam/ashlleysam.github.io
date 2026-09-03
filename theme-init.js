try {
    const storedTheme = localStorage.getItem('site-theme');
    const cachedConfig = localStorage.getItem('site-theme-config');
    
    if (storedTheme === 'dark') {
    document.documentElement.classList.add('dark-mode');
    } else if (storedTheme === 'light') {
    document.documentElement.classList.add('light-mode');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark-mode');
    }

    if (cachedConfig) {
    const config = JSON.parse(cachedConfig);
    const root = document.documentElement;
    root.style.setProperty('--primary-color', config.primary);
    root.style.setProperty('--secondary-color', config.secondary);
    root.style.setProperty('--accent-color', config.accent);
    root.style.setProperty('--background-color', config.background);
    root.style.setProperty('--surface-color', config.surface);
    root.style.setProperty('--text-color', config.text);
    root.style.setProperty('--muted-color', config.muted);
    root.style.setProperty('--border-color', config.border);
    root.style.setProperty('--nav-text-color', config.navText);
    root.style.setProperty('--color-main', config.primary);
    root.style.setProperty('--color-secondary', config.secondary);
    root.style.setProperty('--color-accent', config.accent);
    root.style.setProperty('--color-background', config.background);
    root.style.setProperty('--color-surface', config.surface);
    root.style.setProperty('--color-text', config.text);
    root.style.setProperty('--color-muted', config.muted);
    root.style.setProperty('--color-border', config.border);
    if (config.font) root.style.setProperty('--font-family', config.font);
    }
} catch (e) {}