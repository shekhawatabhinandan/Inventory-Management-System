// Global Variables
let currentUser = null;
let currentRole = null;
let stockData = [];
let activityLog = [];
let orderChart = null;

// Sample Data
const sampleStockData = [
    { id: 1, name: "Laptop Computers", category: "electronics", quantity: 45, threshold: 10, status: "in-stock" },
    { id: 2, name: "Office Chairs", category: "furniture", quantity: 8, threshold: 15, status: "low-stock" },
    { id: 3, name: "Smartphones", category: "electronics", quantity: 120, threshold: 20, status: "in-stock" },
    { id: 4, name: "Desk Lamps", category: "furniture", quantity: 0, threshold: 5, status: "out-of-stock" },
    { id: 5, name: "Notebooks", category: "office", quantity: 200, threshold: 50, status: "in-stock" },
    { id: 6, name: "Coffee Machines", category: "appliances", quantity: 12, threshold: 8, status: "in-stock" },
    { id: 7, name: "Printers", category: "electronics", quantity: 3, threshold: 10, status: "low-stock" },
    { id: 8, name: "Paper Clips", category: "office", quantity: 500, threshold: 100, status: "in-stock" }
];

const sampleActivityLog = [
    { id: 1, type: "stock_add", message: "Added 50 units of Notebooks", timestamp: new Date(Date.now() - 1000 * 60 * 30), icon: "fas fa-plus" },
    { id: 2, type: "stock_remove", message: "Removed 12 units of Office Chairs", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), icon: "fas fa-minus" },
    { id: 3, type: "order_placed", message: "New order placed for Laptop Computers", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), icon: "fas fa-shopping-cart" },
    { id: 4, type: "low_stock", message: "Office Chairs running low on stock", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), icon: "fas fa-exclamation-triangle" },
    { id: 5, type: "stock_add", message: "Added 25 units of Smartphones", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), icon: "fas fa-plus" }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    stockData = [...sampleStockData];
    activityLog = [...sampleActivityLog];
    loadActivityLog();
});

// Login Functions
function showLogin(role) {
    currentRole = role;
    document.getElementById('loginForm').style.display = 'block';
    document.querySelector('.role-selection').style.display = 'none';
    
    // Update login form based on role
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    
    if (role === 'manager') {
        usernameField.placeholder = 'Manager Username';
        usernameField.value = 'manager';
        passwordField.value = 'manager123';
    } else if (role === 'warehouse') {
        usernameField.placeholder = 'Warehouse Username';
        usernameField.value = 'warehouse';
        passwordField.value = 'warehouse123';
    }
}

function hideLogin() {
    document.getElementById('loginForm').style.display = 'none';
    document.querySelector('.role-selection').style.display = 'flex';
    currentRole = null;
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple authentication (in real app, this would be server-side)
    if (currentRole === 'manager' && username === 'manager' && password === 'manager123') {
        currentUser = { username, role: 'Manager' };
        showDashboard();
    } else if (currentRole === 'warehouse' && username === 'warehouse' && password === 'warehouse123') {
        currentUser = { username, role: 'Warehouse Staff' };
        showDashboard();
    } else {
        alert('Invalid credentials. Try manager/manager123 or warehouse/warehouse123');
    }
}

function logout() {
    currentUser = null;
    currentRole = null;
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    hideLogin();
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('userRole').textContent = currentUser.role;
    
    // Initialize dashboard components
    loadStockStatus();
    loadInventoryTable();
    initializeChart();
    updateStats();
    
    // Add login activity
    addActivity(`Logged in as ${currentUser.role}`, 'fas fa-sign-in-alt');
}

// Stock Management Functions
function loadStockStatus() {
    const stockItemsContainer = document.getElementById('stockItems');
    stockItemsContainer.innerHTML = '';
    
    stockData.forEach(item => {
        const stockItem = document.createElement('div');
        stockItem.className = `stock-item ${item.status}`;
        
        let statusClass = 'high';
        if (item.quantity <= item.threshold) {
            statusClass = 'low';
        } else if (item.quantity <= item.threshold * 1.5) {
            statusClass = 'medium';
        }
        
        stockItem.innerHTML = `
            <div class="stock-info">
                <h4>${item.name}</h4>
                <p>Category: ${item.category}</p>
            </div>
            <div class="stock-quantity ${statusClass}">
                ${item.quantity}
                <small>units</small>
            </div>
        `;
        
        stockItemsContainer.appendChild(stockItem);
    });
}

function loadInventoryTable() {
    const tableBody = document.getElementById('inventoryTableBody');
    tableBody.innerHTML = '';
    
    stockData.forEach(item => {
        const row = document.createElement('tr');
        
        let statusBadge = '';
        let statusText = '';
        
        if (item.quantity === 0) {
            statusBadge = 'status-badge out-of-stock';
            statusText = 'Out of Stock';
        } else if (item.quantity <= item.threshold) {
            statusBadge = 'status-badge low-stock';
            statusText = 'Low Stock';
        } else {
            statusBadge = 'status-badge in-stock';
            statusText = 'In Stock';
        }
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td><span class="${statusBadge}">${statusText}</span></td>
            <td>
                <button class="action-btn-small" onclick="editStock(${item.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn-small" onclick="deleteStock(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Stock Entry Form
document.getElementById('stockEntryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const productName = document.getElementById('productName').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const category = document.getElementById('category').value;
    const supplier = document.getElementById('supplier').value;
    const notes = document.getElementById('notes').value;
    
    // Add new stock item
    const newItem = {
        id: stockData.length + 1,
        name: productName,
        category: category,
        quantity: quantity,
        threshold: Math.ceil(quantity * 0.2), // 20% of quantity as threshold
        status: quantity > 0 ? 'in-stock' : 'out-of-stock'
    };
    
    stockData.push(newItem);
    
    // Reset form
    this.reset();
    
    // Update displays
    loadStockStatus();
    loadInventoryTable();
    updateStats();
    
    // Add activity
    addActivity(`Added ${quantity} units of ${productName}`, 'fas fa-plus');
    
    // Show success message
    showNotification('Stock added successfully!', 'success');
});

// Activity Log Functions
function loadActivityLog() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';
    
    activityLog.sort((a, b) => b.timestamp - a.timestamp);
    
    activityLog.slice(0, 10).forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <h4>${activity.message}</h4>
                <p>${activity.type.replace('_', ' ').toUpperCase()}</p>
            </div>
            <div class="activity-time">
                ${formatTime(activity.timestamp)}
            </div>
        `;
        
        activityList.appendChild(activityItem);
    });
}

function addActivity(message, icon) {
    const activity = {
        id: Date.now(),
        type: 'user_action',
        message: message,
        timestamp: new Date(),
        icon: icon
    };
    
    activityLog.unshift(activity);
    loadActivityLog();
}

function clearActivityLog() {
    activityLog = [];
    loadActivityLog();
    showNotification('Activity log cleared', 'info');
}

// Chart Functions
function initializeChart() {
    const ctx = document.getElementById('orderChart').getContext('2d');
    
    // Generate sample data for the last 30 days
    const labels = [];
    const ordersData = [];
    const supplyData = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Generate random data
        ordersData.push(Math.floor(Math.random() * 20) + 5);
        supplyData.push(Math.floor(Math.random() * 15) + 3);
    }
    
    orderChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Orders',
                    data: ordersData,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Supply',
                    data: supplyData,
                    borderColor: '#48bb78',
                    backgroundColor: 'rgba(72, 187, 120, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            elements: {
                point: {
                    radius: 4,
                    hoverRadius: 6
                }
            }
        }
    });
}

function updateChart() {
    const period = document.getElementById('chartPeriod').value;
    // In a real application, this would fetch new data based on the period
    showNotification(`Chart updated for ${period} days`, 'info');
}

// Stats Functions
function updateStats() {
    const totalStock = stockData.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = stockData.filter(item => item.quantity <= item.threshold).length;
    const totalValue = stockData.reduce((sum, item) => sum + (item.quantity * Math.floor(Math.random() * 100) + 50), 0);
    const ordersToday = Math.floor(Math.random() * 30) + 10;
    
    document.getElementById('totalStock').textContent = totalStock.toLocaleString();
    document.getElementById('lowStock').textContent = lowStockItems;
    document.getElementById('totalValue').textContent = `$${totalValue.toLocaleString()}`;
    document.getElementById('ordersToday').textContent = ordersToday;
}

// Quick Actions
function quickAddStock() {
    showModal('Quick Add Stock', `
        <form id="quickAddForm">
            <div class="form-group">
                <label>Product Name</label>
                <input type="text" id="quickProductName" required>
            </div>
            <div class="form-group">
                <label>Quantity</label>
                <input type="number" id="quickQuantity" required>
            </div>
            <button type="submit" class="submit-btn">Add Quickly</button>
        </form>
    `);
    
    document.getElementById('quickAddForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('quickProductName').value;
        const quantity = parseInt(document.getElementById('quickQuantity').value);
        
        const newItem = {
            id: stockData.length + 1,
            name: name,
            category: 'general',
            quantity: quantity,
            threshold: Math.ceil(quantity * 0.2),
            status: 'in-stock'
        };
        
        stockData.push(newItem);
        loadStockStatus();
        loadInventoryTable();
        updateStats();
        addActivity(`Quick added ${quantity} units of ${name}`, 'fas fa-bolt');
        closeModal();
        showNotification('Stock added quickly!', 'success');
    });
}

function generateReport() {
    showNotification('Generating report...', 'info');
    
    setTimeout(() => {
        const report = `
            Inventory Report - ${new Date().toLocaleDateString()}
            
            Total Items: ${stockData.length}
            Total Stock: ${stockData.reduce((sum, item) => sum + item.quantity, 0)}
            Low Stock Items: ${stockData.filter(item => item.quantity <= item.threshold).length}
            Out of Stock Items: ${stockData.filter(item => item.quantity === 0).length}
            
            Categories:
            ${[...new Set(stockData.map(item => item.category))].map(cat => 
                `- ${cat}: ${stockData.filter(item => item.category === cat).length} items`
            ).join('\n')}
        `;
        
        showModal('Inventory Report', `<pre>${report}</pre>`);
    }, 1000);
}

function exportData() {
    const data = {
        stockData: stockData,
        activityLog: activityLog,
        generatedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}

function viewAlerts() {
    const alerts = stockData.filter(item => item.quantity <= item.threshold);
    
    if (alerts.length === 0) {
        showModal('Alerts', '<p>No alerts at this time. All items are well stocked!</p>');
    } else {
        const alertHtml = alerts.map(item => `
            <div class="alert-item">
                <h4>${item.name}</h4>
                <p>Current: ${item.quantity} | Threshold: ${item.threshold}</p>
                <span class="alert-level ${item.quantity === 0 ? 'critical' : 'warning'}">
                    ${item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                </span>
            </div>
        `).join('');
        
        showModal('Stock Alerts', alertHtml);
    }
}

// Utility Functions
function refreshStockStatus() {
    showNotification('Refreshing stock status...', 'info');
    
    // Simulate refresh delay
    setTimeout(() => {
        loadStockStatus();
        updateStats();
        showNotification('Stock status refreshed!', 'success');
    }, 1000);
}

function editStock(id) {
    const item = stockData.find(item => item.id === id);
    if (!item) return;
    
    showModal('Edit Stock', `
        <form id="editStockForm">
            <div class="form-group">
                <label>Product Name</label>
                <input type="text" id="editProductName" value="${item.name}" required>
            </div>
            <div class="form-group">
                <label>Quantity</label>
                <input type="number" id="editQuantity" value="${item.quantity}" required>
            </div>
            <div class="form-group">
                <label>Category</label>
                <select id="editCategory" required>
                    <option value="electronics" ${item.category === 'electronics' ? 'selected' : ''}>Electronics</option>
                    <option value="furniture" ${item.category === 'furniture' ? 'selected' : ''}>Furniture</option>
                    <option value="office" ${item.category === 'office' ? 'selected' : ''}>Office</option>
                    <option value="appliances" ${item.category === 'appliances' ? 'selected' : ''}>Appliances</option>
                </select>
            </div>
            <button type="submit" class="submit-btn">Update Stock</button>
        </form>
    `);
    
    document.getElementById('editStockForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('editProductName').value;
        const quantity = parseInt(document.getElementById('editQuantity').value);
        const category = document.getElementById('editCategory').value;
        
        item.name = name;
        item.quantity = quantity;
        item.category = category;
        item.status = quantity > item.threshold ? 'in-stock' : (quantity === 0 ? 'out-of-stock' : 'low-stock');
        
        loadStockStatus();
        loadInventoryTable();
        updateStats();
        addActivity(`Updated ${name} to ${quantity} units`, 'fas fa-edit');
        closeModal();
        showNotification('Stock updated successfully!', 'success');
    });
}

function deleteStock(id) {
    if (confirm('Are you sure you want to delete this stock item?')) {
        const item = stockData.find(item => item.id === id);
        stockData = stockData.filter(item => item.id !== id);
        
        loadStockStatus();
        loadInventoryTable();
        updateStats();
        addActivity(`Deleted ${item.name}`, 'fas fa-trash');
        showNotification('Stock item deleted!', 'success');
    }
}

function showModal(title, content) {
    document.getElementById('modalBody').innerHTML = `<h2>${title}</h2>${content}`;
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#667eea'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function formatTime(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .alert-item {
        padding: 15px;
        background: #f7fafc;
        border-radius: 10px;
        margin-bottom: 10px;
        border-left: 4px solid #f56565;
    }
    
    .alert-level {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
        float: right;
    }
    
    .alert-level.critical {
        background: #fed7d7;
        color: #742a2a;
    }
    
    .alert-level.warning {
        background: #fef5e7;
        color: #744210;
    }
    
    .action-btn-small {
        padding: 5px 8px;
        margin: 0 2px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: background 0.3s ease;
    }
    
    .action-btn-small:hover {
        background: #5a67d8;
    }
`;
document.head.appendChild(style);
