// Registers the service worker so the app can be installed and work offline.

export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('./sw.js').catch(console.error);
}
