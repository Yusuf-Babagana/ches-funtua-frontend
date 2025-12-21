// lib/debug-fetch.ts
export function enableFetchDebugging() {
    if (typeof window === 'undefined') return;

    console.log('🔧 Fetch debugging enabled');

    const originalFetch = window.fetch;

    window.fetch = function (...args) {
        const url = args[0];
        const method = args[1]?.method || 'GET';

        // Log ALL API calls
        if (typeof url === 'string' && url.includes('/api/')) {
            console.group('🔍 FETCH INTERCEPTED:');
            console.log('URL:', url);
            console.log('Method:', method);
            console.log('Body:', args[1]?.body);
            console.trace(); // This shows the EXACT call location
            console.groupEnd();

            // If it's the wrong register endpoint, THROW ERROR to stop it
            if (url.includes('/api/auth/register') && !url.includes('/student') && !url.includes('/staff') && !url.includes('/lecturer')) {
                console.error('🚨🚨🚨 BLOCKED WRONG ENDPOINT:', url);
                throw new Error(`WRONG ENDPOINT: ${url}. Use specific endpoints: /student, /staff, or /lecturer`);
            }
        }

        return originalFetch.apply(this, args);
    };
}