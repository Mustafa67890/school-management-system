// Performance Optimization Utilities for School Management System

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.loadingStates = new Map();
        this.observers = new Map();
        this.chartInstances = new Map();
        this.debounceTimers = new Map();
        
        this.initializeOptimizations();
    }

    initializeOptimizations() {
        // Initialize intersection observer for lazy loading
        this.setupIntersectionObserver();
        
        // Setup performance monitoring
        this.setupPerformanceMonitoring();
        
        // Initialize service worker for caching (if supported)
        this.initializeServiceWorker();
        
        // Setup memory management
        this.setupMemoryManagement();
    }

    // Caching System
    setCache(key, data, ttl = 300000) { // 5 minutes default TTL
        const expiry = Date.now() + ttl;
        this.cache.set(key, { data, expiry });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    clearCache(pattern = null) {
        if (pattern) {
            for (const [key] of this.cache) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }

    // Loading State Management
    setLoading(element, isLoading = true) {
        const elementId = element.id || element.className || 'unknown';
        this.loadingStates.set(elementId, isLoading);
        
        if (isLoading) {
            this.showLoadingIndicator(element);
        } else {
            this.hideLoadingIndicator(element);
        }
    }

    showLoadingIndicator(element) {
        // Remove existing loading indicator
        const existingLoader = element.querySelector('.loading-overlay');
        if (existingLoader) {
            existingLoader.remove();
        }

        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span class="loading-text">Loading...</span>
            </div>
        `;

        // Position overlay
        const rect = element.getBoundingClientRect();
        loadingOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            border-radius: inherit;
        `;

        // Make parent relative if not already positioned
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(loadingOverlay);
    }

    hideLoadingIndicator(element) {
        const loadingOverlay = element.querySelector('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                if (loadingOverlay.parentNode) {
                    loadingOverlay.remove();
                }
            }, 300);
        }
    }

    // Debouncing for performance
    debounce(key, func, delay = 300) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }

        const timer = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);

        this.debounceTimers.set(key, timer);
    }

    // Chart Management with proper cleanup
    createChart(canvasId, config) {
        // Destroy existing chart if it exists
        this.destroyChart(canvasId);

        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`Canvas with id '${canvasId}' not found`);
            return null;
        }

        try {
            const chart = new Chart(canvas, config);
            this.chartInstances.set(canvasId, chart);
            return chart;
        } catch (error) {
            console.error(`Error creating chart '${canvasId}':`, error);
            return null;
        }
    }

    destroyChart(canvasId) {
        const chart = this.chartInstances.get(canvasId);
        if (chart) {
            chart.destroy();
            this.chartInstances.delete(canvasId);
        }
    }

    destroyAllCharts() {
        for (const [canvasId, chart] of this.chartInstances) {
            chart.destroy();
        }
        this.chartInstances.clear();
    }

    // Lazy Loading Setup
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported');
            return;
        }

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const lazyFunction = element.dataset.lazyFunction;
                    
                    if (lazyFunction && window[lazyFunction]) {
                        window[lazyFunction](element);
                        this.intersectionObserver.unobserve(element);
                    }
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.1
        });
    }

    observeElement(element, callback) {
        if (this.intersectionObserver) {
            element.dataset.lazyFunction = callback.name;
            window[callback.name] = callback;
            this.intersectionObserver.observe(element);
        }
    }

    // Performance Monitoring
    setupPerformanceMonitoring() {
        if ('performance' in window) {
            // Monitor page load performance
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    console.log('Page Load Performance:', {
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
                        totalTime: perfData.loadEventEnd - perfData.fetchStart
                    });
                }, 0);
            });
        }
    }

    // Memory Management
    setupMemoryManagement() {
        // Clean up cache periodically
        setInterval(() => {
            this.cleanupExpiredCache();
        }, 60000); // Every minute

        // Monitor memory usage if available
        if ('memory' in performance) {
            setInterval(() => {
                const memInfo = performance.memory;
                if (memInfo.usedJSHeapSize > memInfo.jsHeapSizeLimit * 0.9) {
                    console.warn('High memory usage detected, cleaning up...');
                    this.performMemoryCleanup();
                }
            }, 30000); // Every 30 seconds
        }
    }

    cleanupExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache) {
            if (now > value.expiry) {
                this.cache.delete(key);
            }
        }
    }

    performMemoryCleanup() {
        // Clear expired cache
        this.cleanupExpiredCache();
        
        // Destroy unused charts
        const visibleCharts = new Set();
        document.querySelectorAll('canvas').forEach(canvas => {
            if (canvas.offsetParent !== null) { // Visible
                visibleCharts.add(canvas.id);
            }
        });

        for (const [canvasId] of this.chartInstances) {
            if (!visibleCharts.has(canvasId)) {
                this.destroyChart(canvasId);
            }
        }

        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }

    // Service Worker for caching
    initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
    }

    // Batch DOM operations
    batchDOMUpdates(updates) {
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                updates.forEach(update => update());
                resolve();
            });
        });
    }

    // Smooth transitions
    smoothTransition(element, properties, duration = 300) {
        return new Promise(resolve => {
            const startTime = performance.now();
            const startValues = {};
            
            // Get initial values
            for (const prop in properties) {
                startValues[prop] = parseFloat(getComputedStyle(element)[prop]) || 0;
            }

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3);
                
                for (const prop in properties) {
                    const start = startValues[prop];
                    const end = properties[prop];
                    const current = start + (end - start) * easeOut;
                    element.style[prop] = current + (prop.includes('opacity') ? '' : 'px');
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    // Resource preloading
    preloadResource(url, type = 'script') {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = url;
            link.as = type;
            
            link.onload = resolve;
            link.onerror = reject;
            
            document.head.appendChild(link);
        });
    }

    // Async script loading
    loadScript(src, options = {}) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = options.async !== false;
            script.defer = options.defer || false;
            
            script.onload = resolve;
            script.onerror = reject;
            
            document.head.appendChild(script);
        });
    }

    // CSS optimization
    optimizeCSS() {
        // Remove unused CSS rules (basic implementation)
        const stylesheets = Array.from(document.styleSheets);
        const usedSelectors = new Set();
        
        // Collect used selectors
        document.querySelectorAll('*').forEach(element => {
            usedSelectors.add(element.tagName.toLowerCase());
            if (element.id) usedSelectors.add(`#${element.id}`);
            element.classList.forEach(cls => usedSelectors.add(`.${cls}`));
        });

        console.log('CSS Optimization - Used selectors:', usedSelectors.size);
    }

    // Network optimization
    optimizeNetworkRequests() {
        // Implement request batching and caching
        const originalFetch = window.fetch;
        const requestCache = new Map();
        
        window.fetch = function(url, options = {}) {
            const cacheKey = `${url}_${JSON.stringify(options)}`;
            
            if (requestCache.has(cacheKey)) {
                return Promise.resolve(requestCache.get(cacheKey).clone());
            }
            
            return originalFetch(url, options).then(response => {
                if (response.ok && options.method !== 'POST') {
                    requestCache.set(cacheKey, response.clone());
                }
                return response;
            });
        };
    }

    // Get performance metrics
    getPerformanceMetrics() {
        return {
            cacheSize: this.cache.size,
            activeCharts: this.chartInstances.size,
            loadingStates: this.loadingStates.size,
            memory: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null
        };
    }
}

// Global instance
window.performanceOptimizer = new PerformanceOptimizer();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}
