// Injected into index.html by vite.config.ts during `vite serve` only (never in production builds).
// Runtime Environment: HMR is disabled in this environment.
// Suppress Vite HMR WebSocket connection failure messages so they don't trigger platform error overlays.
(function() {
  const isViteMessage = (item) => {
    if (!item) return false;
    const str = typeof item === 'string'
      ? item
      : item.message
      ? String(item.message)
      : item.stack
      ? String(item.stack)
      : String(item);
    return (
      str.includes('[vite]') ||
      str.includes('vite-hmr') ||
      str.includes('WebSocket') ||
      str.includes('websocket')
    );
  };

  const _origError = console.error;
  console.error = function(...args) {
    if (args.some(isViteMessage)) return;
    _origError.apply(console, args);
  };

  const _origWarn = console.warn;
  console.warn = function(...args) {
    if (args.some(isViteMessage)) return;
    _origWarn.apply(console, args);
  };

  window.addEventListener('error', function(event) {
    if (isViteMessage(event.message) || isViteMessage(event.error) || isViteMessage(event.filename)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', function(event) {
    if (isViteMessage(event.reason)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  if (typeof window.WebSocket !== 'undefined') {
    const OrigWS = window.WebSocket;
    window.WebSocket = function(url, protocols) {
      const proto = Array.isArray(protocols)
        ? protocols.join(' ')
        : typeof protocols === 'string'
        ? protocols
        : '';
      const urlStr = String(url);

      const isVite =
        proto.includes('vite-hmr') ||
        proto.includes('vite-ping') ||
        urlStr.includes('token=') ||
        urlStr.includes('@vite');

      if (isVite) {
        const target = new EventTarget();
        target.url = urlStr;
        target.readyState = 1;
        target.OPEN = 1;
        target.CLOSED = 3;
        target.CLOSING = 2;
        target.CONNECTING = 0;
        target.send = function() {};
        target.close = function() { target.readyState = 3; };
        setTimeout(() => {
          try {
            target.dispatchEvent(new Event('open'));
          } catch {}
        }, 10);
        return target;
      }
      return new OrigWS(url, protocols);
    };
    window.WebSocket.prototype = OrigWS.prototype;
    window.WebSocket.CONNECTING = 0;
    window.WebSocket.OPEN = 1;
    window.WebSocket.CLOSING = 2;
    window.WebSocket.CLOSED = 3;
  }
})();
