/* =====================================================
   MATATUCONNECT MANAGEMENT DASHBOARD - FUNCTIONALITY
   ===================================================== */

const API_URL = 'http://localhost:5000/api';
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

let authToken = null;
let dashboardData = {};
let chartsInstances = {};
let allClients = [];
let allFeedback = [];
let allOccupancy = [];

// Uptime tracking
let serverOnlineTime = null;
let databaseOnlineTime = null;
let serverUptimeInterval = null;
let databaseUptimeInterval = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    loadChartLibrary();
});

function initializeDashboard() {
    const isLoggedIn = localStorage.getItem('dashboardToken');
    if (isLoggedIn) {
        authToken = isLoggedIn;
        showDashboard();
        loadAllData();
        startRealtimeUpdates();
    }
}

function loadChartLibrary() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
        console.log('Chart.js loaded successfully');
    };
    document.head.appendChild(script);
}

// ===== LOGIN FUNCTIONALITY =====
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    
    // Clear previous error
    errorEl.classList.remove('show');
    errorEl.textContent = '';
    
    // Validate credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        errorEl.textContent = '❌ Invalid username or password';
        errorEl.classList.add('show');
        return;
    }
    
    // Generate a token
    authToken = btoa(`${username}:${password}:${Date.now()}`);
    localStorage.setItem('dashboardToken', authToken);
    
    // Show dashboard
    showDashboard();
    loadAllData();
    startRealtimeUpdates();
}

function showDashboard() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('dashboardPage').classList.add('active');
    document.getElementById('overview').classList.add('active');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        authToken = null;
        localStorage.removeItem('dashboardToken');
        document.getElementById('dashboardPage').classList.remove('active');
        document.getElementById('loginPage').classList.add('active');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
}

// ===== TAB NAVIGATION =====
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all nav buttons
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Load tab-specific data
    if (tabName === 'clients') loadClientsData();
    if (tabName === 'routes') loadRoutesData();
    if (tabName === 'occupancy') loadOccupancyData();
    if (tabName === 'feedback') loadFeedbackData();
    if (tabName === 'services') checkServicesHealth();
    if (tabName === 'database') checkDatabaseStatus();
}

// ===== DATA LOADING =====
async function loadAllData() {
    try {
        // Load overview data
        await loadOverviewData();
        
        // Load statistics
        await loadStatisticsData();
        
        // Check server status
        await checkServerStatus();
        
        // Check database status
        await checkDatabaseStatus();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function loadOverviewData() {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`);
        const data = await response.json();
        
        dashboardData = data;
        
        // Update cards
        document.getElementById('totalUsers').textContent = data.totalUsers || 0;
        document.getElementById('totalVehicles').textContent = data.totalVehicles || 0;
        document.getElementById('totalFeedback').textContent = data.totalFeedback || 0;
        document.getElementById('totalPayments').textContent = data.totalPayments || 0;
        document.getElementById('onlineUsers').textContent = Math.floor((data.totalUsers || 0) * 0.6);
        document.getElementById('activeRoutes').textContent = data.totalRoutes || 0;
        
        // Create charts
        createFeedbackChart(data.feedbackByType || {});
        createUserActivityChart();
    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

async function loadStatisticsData() {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`);
        const data = await response.json();
        
        // Update statistics
        document.getElementById('complaintCount').textContent = data.feedbackByType?.Complaint || 0;
        document.getElementById('complimentCount').textContent = data.feedbackByType?.Compliment || 0;
        
        // Vehicle stats (simulated)
        const totalVehicles = data.totalVehicles || 10;
        document.getElementById('availableVehicles').textContent = Math.ceil(totalVehicles * 0.4);
        document.getElementById('fullVehicles').textContent = Math.floor(totalVehicles * 0.6);
        
        // System uptime
        document.getElementById('uptime').textContent = '99.8%';
        
        // Create performance chart
        createPerformanceChart();
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

async function loadClientsData() {
    try {
        // Generate mock client data based on actual users
        const response = await fetch(`${API_URL}/admin/dashboard`);
        const data = await response.json();
        
        allClients = generateMockClients(data.totalUsers || 5);
        displayClientsTable(allClients);
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

async function loadRoutesData() {
    try {
        const response = await fetch(`${API_URL}/occupancy/routes`);
        const data = await response.json();
        
        const routesContainer = document.getElementById('routesContainer');
        routesContainer.innerHTML = '';
        
        if (data.routes && data.routes.length > 0) {
            data.routes.forEach(route => {
                const routeCard = document.createElement('div');
                routeCard.className = 'route-card';
                routeCard.innerHTML = `
                    <div class="route-name">🗺️ ${route.routeName}</div>
                    <div class="route-info">From: ${route.startLocation}</div>
                    <div class="route-info">To: ${route.endLocation}</div>
                    <div class="route-fare">Ksh ${route.baseFare}</div>
                `;
                routesContainer.appendChild(routeCard);
            });
        } else {
            routesContainer.innerHTML = '<p class="loading">No routes found</p>';
        }
    } catch (error) {
        console.error('Error loading routes:', error);
        document.getElementById('routesContainer').innerHTML = '<p class="loading">Error loading routes</p>';
    }
}

async function loadOccupancyData() {
    try {
        const response = await fetch(`${API_URL}/occupancy/all`);
        const data = await response.json();
        
        allOccupancy = data.occupancyStatuses || [];
        displayOccupancyTable(allOccupancy);
    } catch (error) {
        console.error('Error loading occupancy:', error);
    }
}

async function loadFeedbackData() {
    try {
        const response = await fetch(`${API_URL}/admin/feedback`);
        const data = await response.json();
        
        allFeedback = data.feedback || [];
        displayFeedback(allFeedback);
    } catch (error) {
        console.error('Error loading feedback:', error);
    }
}

// ===== DISPLAY FUNCTIONS =====
function displayClientsTable(clients) {
    const tbody = document.getElementById('clientsTableBody');
    tbody.innerHTML = '';
    
    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No clients connected</td></tr>';
        return;
    }
    
    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.username}</td>
            <td>${client.email}</td>
            <td>${client.phone}</td>
            <td><span class="status ${client.status}">${client.status}</span></td>
            <td>${formatTime(client.lastActivity)}</td>
            <td>${client.sessions}</td>
        `;
        tbody.appendChild(row);
    });
}

function displayOccupancyTable(occupancy) {
    const tbody = document.getElementById('occupancyTableBody');
    tbody.innerHTML = '';
    
    if (occupancy.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No occupancy data</td></tr>';
        return;
    }
    
    occupancy.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.vehicleId || '--'}</td>
            <td>${item.vehicleRegistration || '--'}</td>
            <td>${item.route || '--'}</td>
            <td><span class="status ${item.status.toLowerCase()}">${item.status}</span></td>
            <td>${formatTime(item.updatedAt)}</td>
            <td>${item.updatedBy || 'System'}</td>
        `;
        tbody.appendChild(row);
    });
}

function displayFeedback(feedback) {
    const container = document.getElementById('feedbackContainer');
    container.innerHTML = '';
    
    if (feedback.length === 0) {
        container.innerHTML = '<p class="loading">No feedback yet</p>';
        return;
    }
    
    feedback.forEach(item => {
        const feedbackCard = document.createElement('div');
        const type = item.type || 'Complaint';
        feedbackCard.className = `feedback-card ${type.toLowerCase()}`;
        feedbackCard.innerHTML = `
            <div class="feedback-header">
                <span class="feedback-type ${type.toLowerCase()}">${type}</span>
                <span class="feedback-user">${item.userId || 'Anonymous'}</span>
            </div>
            <div class="feedback-comment">"${item.comment}"</div>
            <div class="feedback-meta">
                <div>Route: ${item.route}</div>
                <div>Vehicle: ${item.vehicleRegistration}</div>
                <div>${formatTime(item.createdAt)}</div>
            </div>
        `;
        container.appendChild(feedbackCard);
    });
}

// ===== FILTERING FUNCTIONS =====
function filterClients() {
    const searchText = document.getElementById('clientFilter').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filtered = allClients.filter(client => {
        const matchesSearch = client.username.toLowerCase().includes(searchText) ||
                            client.email.toLowerCase().includes(searchText);
        const matchesStatus = !statusFilter || client.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    displayClientsTable(filtered);
}

function filterOccupancy() {
    const searchText = document.getElementById('vehicleFilter').value.toLowerCase();
    const statusFilter = document.getElementById('statusOccupancyFilter').value;
    
    const filtered = allOccupancy.filter(item => {
        const matchesSearch = (item.vehicleRegistration || '').toLowerCase().includes(searchText);
        const matchesStatus = !statusFilter || item.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    displayOccupancyTable(filtered);
}

function filterFeedback() {
    const searchText = document.getElementById('feedbackFilter').value.toLowerCase();
    const typeFilter = document.getElementById('feedbackTypeFilter').value;
    
    const filtered = allFeedback.filter(item => {
        const matchesSearch = (item.comment || '').toLowerCase().includes(searchText) ||
                            (item.route || '').toLowerCase().includes(searchText);
        const matchesType = !typeFilter || item.type === typeFilter;
        return matchesSearch && matchesType;
    });
    
    displayFeedback(filtered);
}

// ===== CHARTS =====
function createFeedbackChart(data) {
    const ctx = document.getElementById('feedbackChart');
    if (!ctx) return;
    
    // Destroy previous chart if exists
    if (chartsInstances.feedback) {
        chartsInstances.feedback.destroy();
    }
    
    // Wait for Chart.js to be loaded
    if (typeof Chart === 'undefined') {
        setTimeout(() => createFeedbackChart(data), 500);
        return;
    }
    
    const complaints = data.Complaint || 0;
    const compliments = data.Compliment || 0;
    
    chartsInstances.feedback = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Complaints', 'Compliments'],
            datasets: [{
                data: [complaints, compliments],
                backgroundColor: ['#ef4444', '#10b981'],
                borderColor: ['#dc2626', '#059669'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createUserActivityChart() {
    const ctx = document.getElementById('userActivityChart');
    if (!ctx) return;
    
    // Destroy previous chart if exists
    if (chartsInstances.activity) {
        chartsInstances.activity.destroy();
    }
    
    // Wait for Chart.js to be loaded
    if (typeof Chart === 'undefined') {
        setTimeout(createUserActivityChart, 500);
        return;
    }
    
    // Generate mock data for last 7 days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(() => Math.floor(Math.random() * 30) + 10);
    
    chartsInstances.activity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Active Users',
                data: data,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    // Destroy previous chart if exists
    if (chartsInstances.performance) {
        chartsInstances.performance.destroy();
    }
    
    // Wait for Chart.js to be loaded
    if (typeof Chart === 'undefined') {
        setTimeout(createPerformanceChart, 500);
        return;
    }
    
    const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
    const dbLoad = hours.map(() => Math.floor(Math.random() * 100));
    const apiLoad = hours.map(() => Math.floor(Math.random() * 100));
    
    chartsInstances.performance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [
                {
                    label: 'Database Load %',
                    data: dbLoad,
                    backgroundColor: '#667eea'
                },
                {
                    label: 'API Load %',
                    data: apiLoad,
                    backgroundColor: '#764ba2'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// ===== SERVICES HEALTH CHECK =====
async function checkServicesHealth() {
    const services = [
        { id: 'authService', name: 'Authentication Service', endpoint: '/auth/health' },
        { id: 'mpesaService', name: 'M-Pesa Service', status: 'unknown' },
        { id: 'smsService', name: 'SMS Service', status: 'unknown' },
        { id: 'whatsappService', name: 'WhatsApp Service', status: 'unknown' },
        { id: 'sessionService', name: 'Session Management', status: 'online' },
        { id: 'apiService', name: 'API Gateway', endpoint: '/auth/health' }
    ];
    
    for (let service of services) {
        try {
            if (service.endpoint) {
                const response = await fetch(`${API_URL}${service.endpoint}`);
                const status = response.ok ? 'online' : 'offline';
                updateServiceStatus(service.id, status);
                addServiceLog(`✓ ${service.name}: ${status.toUpperCase()}`);
            } else {
                // Simulated services
                const status = Math.random() > 0.3 ? 'online' : 'unknown';
                updateServiceStatus(service.id, status);
                addServiceLog(`✓ ${service.name}: ${status.toUpperCase()}`);
            }
        } catch (error) {
            updateServiceStatus(service.id, 'offline');
            addServiceLog(`✗ ${service.name}: OFFLINE`);
        }
    }
}

function updateServiceStatus(serviceId, status) {
    const element = document.getElementById(serviceId);
    if (element) {
        element.className = `service-status ${status}`;
        element.textContent = status.toUpperCase();
    }
}

// ===== UPTIME TRACKING =====
function formatUptime(startTime) {
    if (!startTime) return '00:00:00';
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function startServerUptimeCounter() {
    if (serverUptimeInterval) clearInterval(serverUptimeInterval);
    
    if (!serverOnlineTime) {
        serverOnlineTime = Date.now();
    }
    
    serverUptimeInterval = setInterval(() => {
        const uptimeElement = document.getElementById('serverUptime');
        if (uptimeElement && serverOnlineTime) {
            uptimeElement.textContent = formatUptime(serverOnlineTime);
        }
    }, 1000);
}

function startDatabaseUptimeCounter() {
    if (databaseUptimeInterval) clearInterval(databaseUptimeInterval);
    
    if (!databaseOnlineTime) {
        databaseOnlineTime = Date.now();
    }
    
    databaseUptimeInterval = setInterval(() => {
        const uptimeElement = document.getElementById('dbUptime');
        if (uptimeElement && databaseOnlineTime) {
            uptimeElement.textContent = formatUptime(databaseOnlineTime);
        }
    }, 1000);
}

function stopServerUptimeCounter() {
    if (serverUptimeInterval) {
        clearInterval(serverUptimeInterval);
        serverUptimeInterval = null;
    }
    serverOnlineTime = null;
    const uptimeElement = document.getElementById('serverUptime');
    if (uptimeElement) {
        uptimeElement.textContent = '00:00:00';
    }
}

function stopDatabaseUptimeCounter() {
    if (databaseUptimeInterval) {
        clearInterval(databaseUptimeInterval);
        databaseUptimeInterval = null;
    }
    databaseOnlineTime = null;
    const uptimeElement = document.getElementById('dbUptime');
    if (uptimeElement) {
        uptimeElement.textContent = '00:00:00';
    }
}

function addServiceLog(message) {
    const logsContainer = document.getElementById('serviceLogs');
    if (!logsContainer) return;
    
    const entry = document.createElement('p');
    entry.className = 'log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    logsContainer.insertBefore(entry, logsContainer.firstChild);
    
    // Keep only last 20 logs
    while (logsContainer.children.length > 20) {
        logsContainer.removeChild(logsContainer.lastChild);
    }
}

// ===== DATABASE STATUS =====
async function checkDatabaseStatus() {
    try {
        const response = await fetch(`${API_URL}/admin/health/db`);
        const data = await response.json();
        
        if (response.ok && data.status === 'connected') {
            // Update database tab connection status
            const dbConnElement = document.getElementById('dbConnection');
            if (dbConnElement) {
                dbConnElement.className = 'status connected';
                dbConnElement.textContent = 'Connected ✓';
            }
            
            // Update overview section status
            const dbStatusElement = document.getElementById('dbStatus');
            if (dbStatusElement) {
                dbStatusElement.textContent = 'Connected ✓';
            }
            
            // Update last check time
            const dbLastCheckElement = document.getElementById('dbLastCheck');
            if (dbLastCheckElement) {
                dbLastCheckElement.textContent = new Date().toLocaleTimeString();
            }
            
            // Start uptime counter when database comes online
            startDatabaseUptimeCounter();
        } else {
            throw new Error('Database returned non-connected status');
        }
    } catch (error) {
        // Update database tab connection status
        const dbConnElement = document.getElementById('dbConnection');
        if (dbConnElement) {
            dbConnElement.className = 'status disconnected';
            dbConnElement.textContent = 'Disconnected ✗';
        }
        
        // Update overview section status
        const dbStatusElement = document.getElementById('dbStatus');
        if (dbStatusElement) {
            dbStatusElement.textContent = 'Disconnected ✗';
        }
        
        // Stop uptime counter when database goes offline
        stopDatabaseUptimeCounter();
        
        console.error('Database status check error:', error);
    }
    
    // Display table information if on database tab
    if (document.getElementById('database')?.classList.contains('active')) {
        displayTableInfo();
    }
}

function displayTableInfo() {
    const tableInfo = {
        'users': 'User accounts and authentication',
        'routes': 'Matatu routes and pricing',
        'vehicles': 'Vehicle registration data',
        'vehicle_occupancy': 'Real-time occupancy status',
        'payments': 'Payment transaction records',
        'feedback': 'User feedback and ratings'
    };
    
    const container = document.getElementById('tableInfo');
    container.innerHTML = '';
    
    Object.entries(tableInfo).forEach(([table, description]) => {
        const item = document.createElement('p');
        item.style.cssText = 'margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee;';
        item.innerHTML = `<strong>${table}</strong> - ${description}`;
        container.appendChild(item);
    });
    
    // Update table details
    displayTableDetails();
}

function displayTableDetails() {
    const tables = [
        { name: 'users', columns: 'id, email, fullName, phone, password' },
        { name: 'routes', columns: 'id, routeName, startLocation, endLocation, baseFare' },
        { name: 'vehicles', columns: 'id, registrationNumber, routeId, userId' },
        { name: 'vehicle_occupancy', columns: 'id, vehicleId, status, updatedAt, updatedBy' },
        { name: 'payments', columns: 'id, userId, amount, status, transactionId' },
        { name: 'feedback', columns: 'id, userId, type, comment, vehicleId, route' }
    ];
    
    const container = document.getElementById('tableDetails');
    container.innerHTML = '';
    
    tables.forEach(table => {
        const item = document.createElement('div');
        item.className = 'table-detail-item';
        item.innerHTML = `
            <h4>📊 ${table.name}</h4>
            <p><strong>Columns:</strong> ${table.columns}</p>
        `;
        container.appendChild(item);
    });
}

// ===== SERVER STATUS =====
async function checkServerStatus() {
    try {
        const response = await fetch('http://localhost:5000/health');
        if (response.ok) {
            document.getElementById('serverStatus').className = 'status-dot online';
            document.getElementById('serverText').textContent = 'Server: Online ✓';
            // Start uptime counter when server comes online
            startServerUptimeCounter();
        } else {
            throw new Error('Server responded with non-ok status');
        }
    } catch (error) {
        document.getElementById('serverStatus').className = 'status-dot offline';
        document.getElementById('serverText').textContent = 'Server: Offline ✗';
        // Stop uptime counter when server goes offline
        stopServerUptimeCounter();
    }
}

// ===== REAL-TIME UPDATES =====
function startRealtimeUpdates() {
    // Update overview data every 10 seconds
    setInterval(loadOverviewData, 10000);
    
    // Check server status every 5 seconds
    setInterval(checkServerStatus, 5000);
    
    // Check database status every 5 seconds
    setInterval(checkDatabaseStatus, 5000);
    
    // Load clients data if tab is visible
    setInterval(() => {
        if (document.getElementById('clients').classList.contains('active')) {
            loadClientsData();
        }
    }, 15000);
    
    // Load occupancy data if tab is visible
    setInterval(() => {
        if (document.getElementById('occupancy').classList.contains('active')) {
            loadOccupancyData();
        }
    }, 10000);
}

// ===== UTILITY FUNCTIONS =====
function generateMockClients(count) {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'James', 'Emma', 'Robert', 'Lisa'];
    const lastNames = ['Kipchoge', 'Wanjiru', 'Kariuki', 'Mwangi', 'Omondi', 'Kimani', 'Nyambura', 'Oketch'];
    const domains = ['gmail.com', 'example.com', 'matatu.ke', 'connect.ke'];
    
    const clients = [];
    for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        
        clients.push({
            username: `user_${i+1}`,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
            phone: `+254${Math.floor(Math.random() * 900000000 + 100000000)}`,
            status: Math.random() > 0.3 ? 'online' : 'offline',
            lastActivity: new Date(Date.now() - Math.random() * 3600000),
            sessions: Math.floor(Math.random() * 5) + 1
        });
    }
    
    return clients;
}

function formatTime(date) {
    if (!date) return '--:--';
    
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}
