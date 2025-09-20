// Performance Testing Script for School Management System

class PerformanceTester {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
    }

    // Run comprehensive performance tests
    async runAllTests() {
        if (this.isRunning) {
            console.log('Performance tests already running...');
            return;
        }

        this.isRunning = true;
        console.log('🚀 Starting comprehensive performance tests...');

        try {
            const results = {
                timestamp: new Date().toISOString(),
                tests: {}
            };

            // Test 1: Page Load Performance
            results.tests.pageLoad = await this.testPageLoadPerformance();

            // Test 2: Memory Usage
            results.tests.memory = this.testMemoryUsage();

            // Test 3: Chart Rendering Performance
            results.tests.chartRendering = await this.testChartRendering();

            // Test 4: Cache Performance
            results.tests.cache = await this.testCachePerformance();

            // Test 5: Network Performance
            results.tests.network = await this.testNetworkPerformance();

            // Test 6: DOM Manipulation Performance
            results.tests.domManipulation = await this.testDOMPerformance();

            // Test 7: Animation Performance
            results.tests.animations = await this.testAnimationPerformance();

            this.testResults.push(results);
            this.displayResults(results);

        } catch (error) {
            console.error('Performance test error:', error);
        } finally {
            this.isRunning = false;
        }
    }

    // Test page load performance
    async testPageLoadPerformance() {
        const perfData = performance.getEntriesByType('navigation')[0];
        
        return {
            domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
            loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
            totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint(),
            score: this.calculateLoadScore(perfData)
        };
    }

    // Test memory usage
    testMemoryUsage() {
        if (!performance.memory) {
            return { error: 'Memory API not available' };
        }

        const memory = performance.memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
        const usagePercent = Math.round((usedMB / limitMB) * 100);

        return {
            used: usedMB,
            total: totalMB,
            limit: limitMB,
            usagePercent,
            score: this.calculateMemoryScore(usagePercent)
        };
    }

    // Test chart rendering performance
    async testChartRendering() {
        const testCanvas = document.createElement('canvas');
        testCanvas.id = 'performance-test-chart';
        testCanvas.width = 400;
        testCanvas.height = 300;
        testCanvas.style.display = 'none';
        document.body.appendChild(testCanvas);

        const startTime = performance.now();

        try {
            // Create test chart
            const chart = new Chart(testCanvas, {
                type: 'line',
                data: {
                    labels: Array.from({length: 100}, (_, i) => `Point ${i}`),
                    datasets: [{
                        label: 'Test Data',
                        data: Array.from({length: 100}, () => Math.random() * 100),
                        borderColor: '#4361ee',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: false,
                    animation: { duration: 0 }
                }
            });

            await new Promise(resolve => {
                chart.update();
                requestAnimationFrame(resolve);
            });

            const renderTime = performance.now() - startTime;
            
            // Cleanup
            chart.destroy();
            document.body.removeChild(testCanvas);

            return {
                renderTime: Math.round(renderTime),
                score: this.calculateChartScore(renderTime)
            };

        } catch (error) {
            document.body.removeChild(testCanvas);
            return { error: error.message };
        }
    }

    // Test cache performance
    async testCachePerformance() {
        const iterations = 1000;
        const testData = { test: 'data', timestamp: Date.now() };

        // Test localStorage
        const localStorageStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            localStorage.setItem(`test_${i}`, JSON.stringify(testData));
            JSON.parse(localStorage.getItem(`test_${i}`));
        }
        const localStorageTime = performance.now() - localStorageStart;

        // Cleanup localStorage
        for (let i = 0; i < iterations; i++) {
            localStorage.removeItem(`test_${i}`);
        }

        // Test Map cache
        const mapCache = new Map();
        const mapStart = performance.now();
        for (let i = 0; i < iterations; i++) {
            mapCache.set(`test_${i}`, testData);
            mapCache.get(`test_${i}`);
        }
        const mapTime = performance.now() - mapStart;

        return {
            localStorage: Math.round(localStorageTime),
            mapCache: Math.round(mapTime),
            improvement: Math.round(((localStorageTime - mapTime) / localStorageTime) * 100),
            score: this.calculateCacheScore(localStorageTime, mapTime)
        };
    }

    // Test network performance
    async testNetworkPerformance() {
        const testUrls = [
            'https://cdn.jsdelivr.net/npm/chart.js@4.1.1/dist/chart.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
        ];

        const results = [];

        for (const url of testUrls) {
            const startTime = performance.now();
            try {
                const response = await fetch(url, { method: 'HEAD' });
                const endTime = performance.now();
                
                results.push({
                    url: url.split('/').pop(),
                    time: Math.round(endTime - startTime),
                    status: response.status,
                    cached: response.headers.get('cache-control') ? true : false
                });
            } catch (error) {
                results.push({
                    url: url.split('/').pop(),
                    error: error.message
                });
            }
        }

        const avgTime = results.reduce((sum, r) => sum + (r.time || 0), 0) / results.length;

        return {
            requests: results,
            averageTime: Math.round(avgTime),
            score: this.calculateNetworkScore(avgTime)
        };
    }

    // Test DOM manipulation performance
    async testDOMPerformance() {
        const container = document.createElement('div');
        container.style.display = 'none';
        document.body.appendChild(container);

        // Test DOM creation
        const createStart = performance.now();
        for (let i = 0; i < 1000; i++) {
            const element = document.createElement('div');
            element.textContent = `Element ${i}`;
            element.className = 'test-element';
            container.appendChild(element);
        }
        const createTime = performance.now() - createStart;

        // Test DOM query
        const queryStart = performance.now();
        for (let i = 0; i < 100; i++) {
            container.querySelectorAll('.test-element');
        }
        const queryTime = performance.now() - queryStart;

        // Test DOM modification
        const modifyStart = performance.now();
        const elements = container.querySelectorAll('.test-element');
        elements.forEach((el, i) => {
            el.style.color = i % 2 ? 'red' : 'blue';
        });
        const modifyTime = performance.now() - modifyStart;

        // Cleanup
        document.body.removeChild(container);

        return {
            creation: Math.round(createTime),
            querying: Math.round(queryTime),
            modification: Math.round(modifyTime),
            total: Math.round(createTime + queryTime + modifyTime),
            score: this.calculateDOMScore(createTime + queryTime + modifyTime)
        };
    }

    // Test animation performance
    async testAnimationPerformance() {
        const testElement = document.createElement('div');
        testElement.style.cssText = `
            position: fixed;
            top: -100px;
            left: -100px;
            width: 50px;
            height: 50px;
            background: red;
            transition: transform 0.3s ease;
        `;
        document.body.appendChild(testElement);

        const startTime = performance.now();
        let frameCount = 0;

        return new Promise(resolve => {
            const measureFrames = () => {
                frameCount++;
                if (frameCount < 60) {
                    requestAnimationFrame(measureFrames);
                } else {
                    const totalTime = performance.now() - startTime;
                    const fps = Math.round((frameCount / totalTime) * 1000);
                    
                    document.body.removeChild(testElement);
                    
                    resolve({
                        fps,
                        totalTime: Math.round(totalTime),
                        frameCount,
                        score: this.calculateAnimationScore(fps)
                    });
                }
            };

            // Start animation
            testElement.style.transform = 'translateX(100px)';
            requestAnimationFrame(measureFrames);
        });
    }

    // Scoring functions
    calculateLoadScore(perfData) {
        const totalTime = perfData.loadEventEnd - perfData.fetchStart;
        if (totalTime < 1000) return 'Excellent';
        if (totalTime < 2000) return 'Good';
        if (totalTime < 3000) return 'Fair';
        return 'Poor';
    }

    calculateMemoryScore(usagePercent) {
        if (usagePercent < 30) return 'Excellent';
        if (usagePercent < 50) return 'Good';
        if (usagePercent < 70) return 'Fair';
        return 'Poor';
    }

    calculateChartScore(renderTime) {
        if (renderTime < 50) return 'Excellent';
        if (renderTime < 100) return 'Good';
        if (renderTime < 200) return 'Fair';
        return 'Poor';
    }

    calculateCacheScore(localStorageTime, mapTime) {
        const improvement = ((localStorageTime - mapTime) / localStorageTime) * 100;
        if (improvement > 80) return 'Excellent';
        if (improvement > 60) return 'Good';
        if (improvement > 40) return 'Fair';
        return 'Poor';
    }

    calculateNetworkScore(avgTime) {
        if (avgTime < 100) return 'Excellent';
        if (avgTime < 300) return 'Good';
        if (avgTime < 500) return 'Fair';
        return 'Poor';
    }

    calculateDOMScore(totalTime) {
        if (totalTime < 50) return 'Excellent';
        if (totalTime < 100) return 'Good';
        if (totalTime < 200) return 'Fair';
        return 'Poor';
    }

    calculateAnimationScore(fps) {
        if (fps >= 55) return 'Excellent';
        if (fps >= 45) return 'Good';
        if (fps >= 30) return 'Fair';
        return 'Poor';
    }

    // Helper functions
    getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? Math.round(firstPaint.startTime) : 0;
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? Math.round(fcp.startTime) : 0;
    }

    // Display results
    displayResults(results) {
        console.log('📊 Performance Test Results:');
        console.log('================================');
        
        Object.entries(results.tests).forEach(([testName, result]) => {
            console.log(`\n${testName.toUpperCase()}:`);
            if (result.error) {
                console.log(`❌ Error: ${result.error}`);
            } else {
                Object.entries(result).forEach(([key, value]) => {
                    if (key === 'score') {
                        const emoji = this.getScoreEmoji(value);
                        console.log(`${emoji} Score: ${value}`);
                    } else {
                        console.log(`  ${key}: ${value}`);
                    }
                });
            }
        });

        // Overall score
        const scores = Object.values(results.tests)
            .filter(test => test.score && !test.error)
            .map(test => test.score);
        
        const overallScore = this.calculateOverallScore(scores);
        console.log(`\n🎯 Overall Performance: ${overallScore}`);
        
        // Save to localStorage for analysis
        this.saveResults(results);
    }

    getScoreEmoji(score) {
        switch(score) {
            case 'Excellent': return '🟢';
            case 'Good': return '🟡';
            case 'Fair': return '🟠';
            case 'Poor': return '🔴';
            default: return '⚪';
        }
    }

    calculateOverallScore(scores) {
        const scoreValues = { 'Excellent': 4, 'Good': 3, 'Fair': 2, 'Poor': 1 };
        const avgScore = scores.reduce((sum, score) => sum + scoreValues[score], 0) / scores.length;
        
        if (avgScore >= 3.5) return 'Excellent';
        if (avgScore >= 2.5) return 'Good';
        if (avgScore >= 1.5) return 'Fair';
        return 'Poor';
    }

    saveResults(results) {
        const savedResults = JSON.parse(localStorage.getItem('performanceTestResults') || '[]');
        savedResults.push(results);
        
        // Keep only last 10 results
        if (savedResults.length > 10) {
            savedResults.splice(0, savedResults.length - 10);
        }
        
        localStorage.setItem('performanceTestResults', JSON.stringify(savedResults));
    }

    // Get historical results
    getHistoricalResults() {
        return JSON.parse(localStorage.getItem('performanceTestResults') || '[]');
    }

    // Generate performance report
    generateReport() {
        const results = this.getHistoricalResults();
        if (results.length === 0) {
            console.log('No performance test results available');
            return;
        }

        console.log('📈 Performance Trend Report:');
        console.log('============================');

        // Analyze trends
        const trends = this.analyzeTrends(results);
        Object.entries(trends).forEach(([metric, trend]) => {
            console.log(`${metric}: ${trend.direction} (${trend.change}%)`);
        });
    }

    analyzeTrends(results) {
        if (results.length < 2) return {};

        const latest = results[results.length - 1];
        const previous = results[results.length - 2];
        const trends = {};

        // Compare key metrics
        const metrics = ['pageLoad.totalTime', 'memory.usagePercent', 'chartRendering.renderTime'];
        
        metrics.forEach(metric => {
            const [category, property] = metric.split('.');
            const latestValue = latest.tests[category]?.[property];
            const previousValue = previous.tests[category]?.[property];
            
            if (latestValue && previousValue) {
                const change = ((latestValue - previousValue) / previousValue) * 100;
                trends[metric] = {
                    direction: change > 0 ? '📈 Increased' : '📉 Decreased',
                    change: Math.abs(Math.round(change))
                };
            }
        });

        return trends;
    }
}

// Global instance
window.performanceTester = new PerformanceTester();

// Auto-run tests on load (optional)
if (localStorage.getItem('autoRunPerformanceTests') === 'true') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            window.performanceTester.runAllTests();
        }, 2000);
    });
}

// Console commands
window.runPerformanceTests = () => window.performanceTester.runAllTests();
window.getPerformanceReport = () => window.performanceTester.generateReport();
