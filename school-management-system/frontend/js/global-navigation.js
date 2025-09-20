// Global Navigation Helper for modules
// Ensures all navigation targets resolve within the `frontend/modules/` folder
(function(){
  function isAbsolute(url) {
    return /^https?:\/\//i.test(url);
  }

  function normalizeModuleUrl(path) {
    if (isAbsolute(path)) return path;

    // Current location
    const { origin, pathname } = window.location;
    // Find the modules base in the current path
    const parts = pathname.split('/');
    const idx = parts.lastIndexOf('modules');
    let base = pathname;
    if (idx !== -1) {
      base = parts.slice(0, idx + 1).join('/') + '/';
    } else {
      // Fallback: use current directory
      base = pathname.substring(0, pathname.lastIndexOf('/') + 1);
    }
    // Use URL to resolve any ./ or ../ segments safely
    const resolved = new URL(path, origin + base).href;
    return resolved;
  }

  // Public API
  window.navigateToModule = function(path) {
    const target = normalizeModuleUrl(path);
    window.location.href = target;
  };

  // Backward-compatible name
  window.navigateToPage = function(path) {
    window.navigateToModule(path);
  };
})();
