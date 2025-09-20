// Global Performance Manager for School Management System

class GlobalPerformanceManager {
    constructor() {
        this.modules = new Map();
        this.globalCache = new Map();
        this.performanceMetrics = {
            pageLoadTime: 0,
            moduleLoadTimes: {},
            memoryUsage: {},
            networkRequests: 0,
            cacheHitRate: 0
        };
        
        this.init();
    }

    init() {
        this.setupGlobalOptimizations();
        this.monitorPerformance();
        this.setupErrorHandling();
        this.initializePreloading();
    }

    // Setup global optimizations
    setupGlobalOptimizations() {
        // Optimize font loading
        this.optimizeFontLoading();
        
        // Setup critical resource hints
        this.setupResourceHints();
        
        // Optimize images
        this.setupImageOptimization();
        
        // Setup intersection observer for lazy loading
        this.setupGlobalLazyLoading();
        
        // Optimize CSS delivery
        this.optimizeCSSDelivery();
    }

    // Register a module for performance tracking
    registerModule(name, moduleInstance) {
        const startTime = performance.now();
        
        this.modules.set(name, {
            instance: moduleInstance,
            loadTime: 0,
            lastAccessed: Date.now(),
            memoryUsage: 0
        });

        // Track load time
        requestAnimationFrame(() => {
            const loadTime = performance.now() - startTime;
            this.modules.get(name).loadTime = loadTime;
            this.performanceMetrics.moduleLoadTimes[name] = loadTime;
            
            console.log(`Module ${name} loaded in ${loadTime.toFixed(2)}ms`);
        });
    }

    // Optimize font loading
    optimizeFontLoading() {
        // Preload critical fonts
        const criticalFonts = [
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2'
        ];

        criticalFonts.forEach(fontUrl => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = fontUrl;
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });

        // Add font-display: swap to existing fonts
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'FontAwesome';
                font-display: swap;
            }
        `;
        document.head.appendChild(style);
    }

    // Setup resource hints
    setupResourceHints() {
        const resources = [
            { href: 'https://cdn.jsdelivr.net', rel: 'dns-prefetch' },
            { href: 'https://cdnjs.cloudflare.com', rel: 'dns-prefetch' },
            { href: 'https://cdn.jsdelivr.net/npm/chart.js@4.1.1/dist/chart.min.js', rel: 'preload', as: 'script' }
        ];

        resources.forEach(resource => {
            const link = document.createElement('link');
            Object.assign(link, resource);
            document.head.appendChild(link);
        });
    }

    // Setup image optimization
    setupImageOptimization() {
        // Use Intersection Observer for lazy loading images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.add('loaded');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            // Observe all images with data-src
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    // Setup global lazy loading
    setupGlobalLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const lazyFunction = element.dataset.lazyLoad;
                        
                        if (lazyFunction && window[lazyFunction]) {
                            window[lazyFunction](element);
                            this.lazyObserver.unobserve(element);
                        }
                    }
                });
            }, {
                rootMargin: '50px',
                threshold: 0.1
            });
        }
    }

    // Optimize CSS delivery
    optimizeCSSDelivery() {
        // Load non-critical CSS asynchronously
        const nonCriticalCSS = document.querySelectorAll('link[rel="stylesheet"][data-non-critical]');
        
        nonCriticalCSS.forEach(link => {
            const newLink = document.createElement('link');
            newLink.rel = 'preload';
            newLink.href = link.href;
            newLink.as = 'style';
            newLink.onload = function() {
                this.rel = 'stylesheet';
            };
            
            document.head.appendChild(newLink);
            link.remove();
        });
    }

    // Monitor performance
    monitorPerformance() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                this.performanceMetrics.pageLoadTime = perfData.loadEventEnd - perfData.fetchStart;
                
                console.log('Page Performance Metrics:', {
                    totalLoadTime: this.performanceMetrics.pageLoadTime,
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                    firstPaint: this.getFirstPaint(),
                    firstContentfulPaint: this.getFirstContentfulPaint()
                });
            }, 0);
        });

        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                this.performanceMetrics.memoryUsage = {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                };
            }, 10000);
        }

        // Monitor network requests
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            this.performanceMetrics.networkRequests++;
            return originalFetch.apply(this, args);
        };
    }

    // Get First Paint timing
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : 0;
    }

    // Get First Contentful Paint timing
    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : 0;
    }

    // Setup error handling
    setupErrorHandling() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.logError('JavaScript Error', event.error);
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.logError('Promise Rejection', event.reason);
        });
    }

    // Log errors for monitoring
    logError(type, error) {
        const errorData = {
            type,
            message: error.message || error,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        // Store in localStorage for later analysis
        const errors = JSON.parse(localStorage.getItem('performanceErrors') || '[]');
        errors.push(errorData);
        
        // Keep only last 50 errors
        if (errors.length > 50) {
            errors.splice(0, errors.length - 50);
        }
        
        localStorage.setItem('performanceErrors', JSON.stringify(errors));
    }

    // Initialize preloading for critical resources
    initializePreloading() {
        // Preload critical modules
        const criticalModules = [
            '/js/modules/reports-functions-optimized.js',
            '/js/modules/fees-payment-functions.js',
            '/js/modules/staff-payroll-functions.js'
        ];

        criticalModules.forEach(module => {
            const link = document.createElement('link');
            link.rel = 'modulepreload';
            link.href = module;
            document.head.appendChild(link);
        });
    }

    // Optimize module switching
    async optimizeModuleSwitch(fromModule, toModule) {
        console.log(`Switching from ${fromModule} to ${toModule}`);
        
        // Cleanup previous module
        if (this.modules.has(fromModule)) {
            const module = this.modules.get(fromModule);
            if (module.instance && typeof module.instance.cleanup === 'function') {
                module.instance.cleanup();
            }
        }

        // Preload target module if not loaded
        if (!this.modules.has(toModule)) {
            await this.preloadModule(toModule);
        }

        // Update last accessed time
        if (this.modules.has(toModule)) {
            this.modules.get(toModule).lastAccessed = Date.now();
        }
    }

    // Preload module
    async preloadModule(moduleName) {
        const moduleMap = {
            'reports': '/js/modules/reports-functions-optimized.js',
            'fees': '/js/modules/fees-payment-functions.js',
            'staff': '/js/modules/staff-payroll-functions.js',
            'procurement': '/js/modules/procurement-functions.js'
        };

        const moduleUrl = moduleMap[moduleName];
        if (!moduleUrl) return;

        try {
            const script = document.createElement('script');
            script.src = moduleUrl;
            script.async = true;
            
            return new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error(`Error preloading module ${moduleName}:`, error);
        }
    }

    // Get performance report
    getPerformanceReport() {
        return {
            ...this.performanceMetrics,
            modules: Array.from(this.modules.entries()).map(([name, data]) => ({
                name,
                loadTime: data.loadTime,
                lastAccessed: data.lastAccessed,
                memoryUsage: data.memoryUsage
            })),
            cacheSize: this.globalCache.size,
            timestamp: new Date().toISOString()
        };
    }

    // Cleanup unused modules
    cleanupUnusedModules() {
        const now = Date.now();
        const maxAge = 5 * 60 * 1000; // 5 minutes

        for (const [name, data] of this.modules) {
            if (now - data.lastAccessed > maxAge) {
                if (data.instance && typeof data.instance.cleanup === 'function') {
                    data.instance.cleanup();
                }
                this.modules.delete(name);
                console.log(`Cleaned up unused module: ${name}`);
            }
        }
    }

    // Global cache management
    setGlobalCache(key, value, ttl = 300000) {
        this.globalCache.set(key, {
            value,
            expiry: Date.now() + ttl
        });
    }

    getGlobalCache(key) {
        const cached = this.globalCache.get(key);
        if (!cached) return null;

        if (Date.now() > cached.expiry) {
            this.globalCache.delete(key);
            return null;
        }

        return cached.value;
    }

    // Optimize for mobile devices
    optimizeForMobile() {
        if (window.innerWidth <= 768) {
            // Reduce animations on mobile
            document.documentElement.style.setProperty('--animation-duration', '0.2s');
            
            // Disable some heavy features
            this.disableHeavyFeatures();
            
            // Optimize touch interactions
            this.optimizeTouchInteractions();
        }
    }

    disableHeavyFeatures() {
        // Disable complex animations
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                * {
                    animation-duration: 0.2s !important;
                    transition-duration: 0.2s !important;
                }
                .gpu-accelerated {
                    transform: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    optimizeTouchInteractions() {
        // Add touch-action optimization
        document.body.style.touchAction = 'manipulation';
        
        // Optimize scroll performance
        document.addEventListener('touchstart', () => {}, { passive: true });
        document.addEventListener('touchmove', () => {}, { passive: true });
    }

    // Start periodic cleanup
    startPeriodicCleanup() {
        setInterval(() => {
            this.cleanupUnusedModules();
            this.cleanupExpiredCache();
        }, 60000); // Every minute
    }

    cleanupExpiredCache() {
        const now = Date.now();
        for (const [key, data] of this.globalCache) {
            if (now > data.expiry) {
                this.globalCache.delete(key);
            }
        }
    }
}

// Initialize global performance manager
window.globalPerformanceManager = new GlobalPerformanceManager();

// Start periodic cleanup
window.globalPerformanceManager.startPeriodicCleanup();

// Optimize for mobile on load
window.addEventListener('load', () => {
    window.globalPerformanceManager.optimizeForMobile();
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalPerformanceManager;
}
