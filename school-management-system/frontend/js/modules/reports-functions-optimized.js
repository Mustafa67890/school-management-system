// Optimized Reports Module Functions JavaScript

class OptimizedReportsModule {
    constructor() {
        this.optimizer = window.performanceOptimizer;
        this.currentTab = 'overview';
        this.dataCache = new Map();
        this.renderQueue = [];
        this.isInitialized = false;
        
        this.bindMethods();
    }

    bindMethods() {
        this.initializeReports = this.initializeReports.bind(this);
        this.switchTab = this.switchTab.bind(this);
        this.updateReports = this.updateReports.bind(this);
        this.refreshAllData = this.refreshAllData.bind(this);
    }

    // Initialize reports module with performance optimizations
    async initializeReports() {
        if (this.isInitialized) return;
        
        console.log('Initializing optimized reports module...');
        
        try {
            // Show loading for main container
            const mainContent = document.querySelector('.main-content');
            this.optimizer.setLoading(mainContent, true);
            
            // Initialize data with caching
            await this.initializeReportsData();
            
            // Update summary cards with smooth transitions
            await this.updateSummaryCards();
            
            // Lazy load charts based on visibility
            this.setupLazyChartLoading();
            
            // Initialize current tab
            await this.renderCurrentTab();
            
            // Setup event listeners with debouncing
            this.setupOptimizedEventListeners();
            
            this.isInitialized = true;
            this.optimizer.setLoading(mainContent, false);
            
            this.showNotification('Reports module loaded successfully', 'success');
            
        } catch (error) {
            console.error('Error initializing reports:', error);
            this.showNotification('Error loading reports module', 'error');
        }
    }

    // Initialize data with caching
    async initializeReportsData() {
        const cacheKey = 'reports_data';
        let data = this.optimizer.getCache(cacheKey);
        
        if (!data) {
            // Simulate API call or use existing data
            if (typeof window.reportsData !== 'undefined') {
                data = window.reportsData;
            } else {
                data = await this.loadReportsData();
            }
            
            // Cache for 5 minutes
            this.optimizer.setCache(cacheKey, data, 300000);
        }
        
        window.reportsData = data;
        return data;
    }

    // Load reports data (placeholder for API integration)
    async loadReportsData() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    summary: {
                        fees: {
                            totalRevenue: 15750000,
                            totalOutstanding: 2350000,
                            collectionRate: 87,
                            outstandingRate: 13
                        },
                        procurement: {
                            totalSpent: 8500000,
                            utilizationRate: 72
                        },
                        payroll: {
                            totalPayroll: 12000000
                        }
                    },
                    fees: [],
                    payroll: [],
                    procurement: []
                });
            }, 100);
        });
    }

    // Update summary cards with smooth animations
    async updateSummaryCards() {
        console.log('Updating summary cards...');
        const summary = window.reportsData.summary;
        
        const updates = [
            () => this.updateCardValue('totalRevenue', summary.fees.totalRevenue),
            () => this.updateCardValue('totalExpenses', summary.procurement.totalSpent),
            () => this.updateCardValue('totalPayroll', summary.payroll.totalPayroll),
            () => this.updateCardValue('outstandingFees', summary.fees.totalOutstanding)
        ];
        
        await this.optimizer.batchDOMUpdates(updates);
        
        // Update trends with animation
        this.updateTrends();
    }

    async updateCardValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const formattedValue = this.formatCurrency(value);
        
        // Animate value change
        element.style.opacity = '0.7';
        await new Promise(resolve => setTimeout(resolve, 150));
        element.textContent = formattedValue;
        
        await this.optimizer.smoothTransition(element, { opacity: 1 }, 200);
    }

    updateTrends() {
        const trends = [
            { id: 'revenueTrend', value: '+12%', type: 'positive' },
            { id: 'expensesTrend', value: '+8%', type: 'negative' },
            { id: 'payrollTrend', value: '+3%', type: 'neutral' },
            { id: 'outstandingTrend', value: '-5%', type: 'positive' }
        ];

        trends.forEach(trend => {
            const element = document.getElementById(trend.id);
            if (element) {
                element.textContent = trend.value;
                element.className = `trend ${trend.type}`;
            }
        });
    }

    // Optimized tab switching with lazy loading
    async switchTab(tabName) {
        if (this.currentTab === tabName) return;
        
        // Hide all tabs with fade out
        const allTabs = document.querySelectorAll('.tab-content');
        const allButtons = document.querySelectorAll('.tab-btn');
        
        await Promise.all([
            ...Array.from(allTabs).map(tab => 
                this.optimizer.smoothTransition(tab, { opacity: 0 }, 200)
            )
        ]);
        
        // Update active states
        allTabs.forEach(tab => tab.classList.remove('active'));
        allButtons.forEach(btn => btn.classList.remove('active'));
        
        // Show selected tab
        const selectedTab = document.getElementById(tabName + 'Tab');
        const selectedButton = event?.target?.closest('.tab-btn');
        
        if (selectedTab) {
            selectedTab.classList.add('active');
            await this.optimizer.smoothTransition(selectedTab, { opacity: 1 }, 300);
        }
        
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
        
        this.currentTab = tabName;
        
        // Lazy load tab content
        await this.renderTabContent(tabName);
    }

    // Render tab content with performance optimization
    async renderTabContent(tabName) {
        const cacheKey = `tab_${tabName}`;
        
        // Check if already rendered recently
        if (this.optimizer.getCache(cacheKey)) {
            return;
        }
        
        const tabElement = document.getElementById(tabName + 'Tab');
        if (!tabElement) return;
        
        this.optimizer.setLoading(tabElement, true);
        
        try {
            switch(tabName) {
                case 'overview':
                    await this.renderOverviewCharts();
                    break;
                case 'financial':
                    await this.renderFinancialReports();
                    break;
                case 'payroll':
                    await this.renderPayrollReports();
                    break;
                case 'procurement':
                    await this.renderProcurementReports();
                    break;
                case 'analytics':
                    await this.renderAnalytics();
                    break;
            }
            
            // Cache rendered state for 2 minutes
            this.optimizer.setCache(cacheKey, true, 120000);
            
        } catch (error) {
            console.error(`Error rendering ${tabName} tab:`, error);
            this.showNotification(`Error loading ${tabName} data`, 'error');
        } finally {
            this.optimizer.setLoading(tabElement, false);
        }
    }

    // Render current tab
    async renderCurrentTab() {
        await this.renderTabContent(this.currentTab);
    }

    // Setup lazy chart loading
    setupLazyChartLoading() {
        const chartContainers = document.querySelectorAll('.chart-container');
        
        chartContainers.forEach(container => {
            const canvas = container.querySelector('canvas');
            if (canvas) {
                this.optimizer.observeElement(container, () => {
                    this.renderChartWhenVisible(canvas.id);
                });
            }
        });
    }

    // Render chart when visible
    async renderChartWhenVisible(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        // Add loading state
        const container = canvas.closest('.chart-container');
        this.optimizer.setLoading(container, true);
        
        try {
            await this.renderSpecificChart(canvasId);
        } catch (error) {
            console.error(`Error rendering chart ${canvasId}:`, error);
        } finally {
            this.optimizer.setLoading(container, false);
        }
    }

    // Render specific chart with optimization
    async renderSpecificChart(canvasId) {
        const chartConfig = this.getChartConfig(canvasId);
        if (!chartConfig) return;
        
        return new Promise(resolve => {
            requestAnimationFrame(() => {
                this.optimizer.createChart(canvasId, chartConfig);
                resolve();
            });
        });
    }

    // Get chart configuration
    getChartConfig(canvasId) {
        const configs = {
            'revenueChart': this.getRevenueChartConfig(),
            'outstandingChart': this.getOutstandingChartConfig(),
            'expenseChart': this.getExpenseChartConfig(),
            'unpaidClassesChart': this.getUnpaidClassesChartConfig(),
            'monthlyFeeChart': this.getMonthlyFeeChartConfig(),
            'feeTypeChart': this.getFeeTypeChartConfig(),
            'monthlySalaryChart': this.getMonthlySalaryChartConfig(),
            'departmentCostChart': this.getDepartmentCostChartConfig(),
            'budgetVarianceChart': this.getBudgetVarianceChartConfig(),
            'supplierPerformanceChart': this.getSupplierPerformanceChartConfig(),
            'trendAnalysisChart': this.getTrendAnalysisChartConfig(),
            'comparativeChart': this.getComparativeChartConfig(),
            'forecastChart': this.getForecastChartConfig()
        };
        
        return configs[canvasId] || null;
    }

    // Chart configurations with performance optimizations
    getRevenueChartConfig() {
        const sampleData = [
            { month: 'Jan 2024', value: 2500000 },
            { month: 'Feb 2024', value: 2800000 },
            { month: 'Mar 2024', value: 2200000 },
            { month: 'Apr 2024', value: 3100000 },
            { month: 'May 2024', value: 2900000 },
            { month: 'Jun 2024', value: 3300000 }
        ];
        
        return {
            type: 'line',
            data: {
                labels: sampleData.map(item => item.month),
                datasets: [{
                    label: 'Revenue (TZS)',
                    data: sampleData.map(item => item.value),
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#4361ee',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#4361ee',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        };
    }

    // Setup optimized event listeners
    setupOptimizedEventListeners() {
        // Debounced date range updates
        const startDateInput = document.getElementById('dateRangeStart');
        const endDateInput = document.getElementById('dateRangeEnd');
        
        if (startDateInput) {
            startDateInput.addEventListener('change', () => {
                this.optimizer.debounce('dateRangeUpdate', () => {
                    this.updateReports();
                }, 500);
            });
        }
        
        if (endDateInput) {
            endDateInput.addEventListener('change', () => {
                this.optimizer.debounce('dateRangeUpdate', () => {
                    this.updateReports();
                }, 500);
            });
        }
        
        // Optimized filter listeners
        this.setupFilterListeners();
        
        // Window resize handler with debouncing
        window.addEventListener('resize', () => {
            this.optimizer.debounce('windowResize', () => {
                this.handleWindowResize();
            }, 250);
        });
    }

    setupFilterListeners() {
        const filters = [
            'paymentClassFilter',
            'paymentTypeFilter',
            'payrollDepartmentFilter',
            'payrollMonthFilter',
            'procurementDepartmentFilter',
            'procurementSupplierFilter'
        ];
        
        filters.forEach(filterId => {
            const element = document.getElementById(filterId);
            if (element) {
                element.addEventListener('change', () => {
                    this.optimizer.debounce(`filter_${filterId}`, () => {
                        this.applyFilters();
                    }, 300);
                });
            }
        });
    }

    // Handle window resize
    handleWindowResize() {
        // Resize charts
        for (const [canvasId, chart] of this.optimizer.chartInstances) {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        }
    }

    // Optimized data updates
    async updateReports() {
        const startDate = document.getElementById('dateRangeStart')?.value;
        const endDate = document.getElementById('dateRangeEnd')?.value;
        
        // Clear relevant cache
        this.optimizer.clearCache('reports_data');
        this.optimizer.clearCache('tab_');
        
        // Show loading
        const mainContent = document.querySelector('.main-content');
        this.optimizer.setLoading(mainContent, true);
        
        try {
            // Reinitialize data
            await this.initializeReportsData();
            
            // Update summary cards
            await this.updateSummaryCards();
            
            // Re-render current tab
            await this.renderCurrentTab();
            
            this.showNotification('Reports updated successfully', 'success');
            
        } catch (error) {
            console.error('Error updating reports:', error);
            this.showNotification('Error updating reports', 'error');
        } finally {
            this.optimizer.setLoading(mainContent, false);
        }
    }

    // Refresh all data
    async refreshAllData() {
        // Clear all cache
        this.optimizer.clearCache();
        
        // Destroy all charts
        this.optimizer.destroyAllCharts();
        
        // Reinitialize
        await this.initializeReports();
    }

    // Utility functions
    formatCurrency(amount) {
        if (typeof amount !== 'number') return 'TZS 0';
        return new Intl.NumberFormat('sw-TZ', {
            style: 'currency',
            currency: 'TZS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    showNotification(message, type = 'info') {
        // Use existing notification system or create optimized one
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Placeholder methods for chart configs (implement as needed)
    getOutstandingChartConfig() { return this.getRevenueChartConfig(); }
    getExpenseChartConfig() { return this.getRevenueChartConfig(); }
    getUnpaidClassesChartConfig() { return this.getRevenueChartConfig(); }
    getMonthlyFeeChartConfig() { return this.getRevenueChartConfig(); }
    getFeeTypeChartConfig() { return this.getRevenueChartConfig(); }
    getMonthlySalaryChartConfig() { return this.getRevenueChartConfig(); }
    getDepartmentCostChartConfig() { return this.getRevenueChartConfig(); }
    getBudgetVarianceChartConfig() { return this.getRevenueChartConfig(); }
    getSupplierPerformanceChartConfig() { return this.getRevenueChartConfig(); }
    getTrendAnalysisChartConfig() { return this.getRevenueChartConfig(); }
    getComparativeChartConfig() { return this.getRevenueChartConfig(); }
    getForecastChartConfig() { return this.getRevenueChartConfig(); }

    // Render methods (implement as needed)
    async renderOverviewCharts() {
        const charts = ['revenueChart', 'outstandingChart', 'expenseChart', 'unpaidClassesChart'];
        await Promise.all(charts.map(chartId => this.renderSpecificChart(chartId)));
    }

    async renderFinancialReports() {
        await this.renderPaymentReports();
        await Promise.all([
            this.renderSpecificChart('monthlyFeeChart'),
            this.renderSpecificChart('feeTypeChart')
        ]);
    }

    async renderPayrollReports() {
        await this.renderPayrollTable();
        await Promise.all([
            this.renderSpecificChart('monthlySalaryChart'),
            this.renderSpecificChart('departmentCostChart')
        ]);
    }

    async renderProcurementReports() {
        await this.renderProcurementTable();
        await Promise.all([
            this.renderSpecificChart('budgetVarianceChart'),
            this.renderSpecificChart('supplierPerformanceChart')
        ]);
    }

    async renderAnalytics() {
        await Promise.all([
            this.renderSpecificChart('trendAnalysisChart'),
            this.renderSpecificChart('comparativeChart'),
            this.renderSpecificChart('forecastChart')
        ]);
        this.updateKPIs();
    }

    async renderPaymentReports() {
        // Implement payment reports rendering
        console.log('Rendering payment reports...');
    }

    async renderPayrollTable() {
        // Implement payroll table rendering
        console.log('Rendering payroll table...');
    }

    async renderProcurementTable() {
        // Implement procurement table rendering
        console.log('Rendering procurement table...');
    }

    updateKPIs() {
        // Implement KPI updates
        console.log('Updating KPIs...');
    }

    applyFilters() {
        // Implement filter application
        console.log('Applying filters...');
    }
}

// Initialize optimized reports module
window.optimizedReportsModule = new OptimizedReportsModule();

// Export functions for backward compatibility
window.initializeReports = () => window.optimizedReportsModule.initializeReports();
window.switchTab = (tabName) => window.optimizedReportsModule.switchTab(tabName);
window.updateReports = () => window.optimizedReportsModule.updateReports();
window.refreshAllData = () => window.optimizedReportsModule.refreshAllData();
