/** Shared by both root layouts; runs before paint without making them dynamic. */
export const THEME_STORAGE_KEY = "site-theme";
export type SiteTheme = "dark" | "light";

export const themeBootstrapScript = `(function(){var t;try{t=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t})();`;
