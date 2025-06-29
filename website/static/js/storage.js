// Storage Analytics JavaScript
let analyticsData = null;
let typeChart = null;
let folderChart = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadStorageAnalytics();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Chart toggle buttons
    document.querySelectorAll('[data-chart]').forEach(btn => {
        btn.addEventListener('click', function() {
            const chartType = this.dataset.chart;
            toggleChartView(chartType);
            
            // Update active state
            this.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Table toggle buttons
    document.querySelectorAll('[data-table]').forEach(btn => {
        btn.addEventListener('click', function() {
            const tableType = this.dataset.table;
            toggleExtensionsTable(tableType);
            
            // Update active state
            this.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Load storage analytics data
async function loadStorageAnalytics() {
    try {
        showLoading(true);
        
        const response = await fetch('/api/getStorageAnalytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                password: getPassword()
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'ok') {
            analyticsData = data.data;
            displayAnalytics(analyticsData);
        } else {
            showError('Failed to load storage analytics: ' + data.status);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
        showError('Failed to load storage analytics. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Display analytics data
function displayAnalytics(data) {
    displaySummary(data.summary);
    displayCharts(data);
    displayTables(data);
    
    // Add fade-in animation
    document.getElementById('main-content').classList.add('fade-in');
}

// Display summary cards
function displaySummary(summary) {
    document.getElementById('total-size').textContent = summary.formatted_size;
    document.getElementById('total-files').textContent = summary.total_files.toLocaleString();
    document.getElementById('total-folders').textContent = summary.total_folders.toLocaleString();
}

// Display charts
function displayCharts(data) {
    createTypeChart(data.type_breakdown);
    createFolderChart(data.folder_breakdown);
}

// Create file type chart
function createTypeChart(typeData) {
    const ctx = document.getElementById('typeChart').getContext('2d');
    
    const labels = Object.keys(typeData);
    const sizeData = labels.map(type => typeData[type].size);
    const countData = labels.map(type => typeData[type].count);
    
    const colors = {
        video: '#f44336',
        pdf: '#e53e3e',
        image: '#4caf50',
        document: '#2196f3',
        audio: '#9c27b0',
        archive: '#ff9800',
        code: '#795548',
        others: '#607d8b'
    };
    
    const backgroundColors = labels.map(type => colors[type] || '#607d8b');
    
    if (typeChart) {
        typeChart.destroy();
    }
    
    typeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels.map(type => type.charAt(0).toUpperCase() + type.slice(1)),
            datasets: [{
                data: sizeData,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const type = labels[context.dataIndex];
                            const size = formatBytes(typeData[type].size);
                            const count = typeData[type].count;
                            const percentage = typeData[type].percentage.toFixed(1);
                            return `${context.label}: ${size} (${count} files, ${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
    
    // Store data for toggle
    typeChart.sizeData = sizeData;
    typeChart.countData = countData;
    typeChart.typeData = typeData;
}

// Create folder chart
function createFolderChart(folderData) {
    const ctx = document.getElementById('folderChart').getContext('2d');
    
    // Get top 10 folders by size
    const sortedFolders = Object.entries(folderData)
        .sort(([,a], [,b]) => b.size - a.size)
        .slice(0, 10);
    
    const labels = sortedFolders.map(([path]) => path === '/' ? 'Root' : path.split('/').pop());
    const data = sortedFolders.map(([,folder]) => folder.size);
    
    if (folderChart) {
        folderChart.destroy();
    }
    
    folderChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Storage Used',
                data: data,
                backgroundColor: 'rgba(11, 87, 208, 0.8)',
                borderColor: 'rgba(11, 87, 208, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const [path, folder] = sortedFolders[context.dataIndex];
                            const size = formatBytes(folder.size);
                            const percentage = folder.percentage.toFixed(1);
                            return `${path}: ${size} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatBytes(value);
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            }
        }
    });
}

// Display tables
function displayTables(data) {
    displayFileTypesTable(data.type_breakdown);
    displayFoldersTable(data.folder_breakdown);
    displayLargestFilesTable(data.largest_files);
    displayExtensionsTable(data.extension_stats);
}

// Display file types table
function displayFileTypesTable(typeData) {
    const tbody = document.getElementById('file-types-table');
    tbody.innerHTML = '';
    
    const sortedTypes = Object.entries(typeData)
        .sort(([,a], [,b]) => b.size - a.size);
    
    sortedTypes.forEach(([type, data]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="file-type-icon ${type}">
                    ${type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
            </td>
            <td>${data.count.toLocaleString()}</td>
            <td>${data.formatted_size}</td>
            <td>
                <div class="percentage-bar">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${data.percentage}%"></div>
                    </div>
                    <span class="percentage-text">${data.percentage.toFixed(1)}%</span>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Display folders table
function displayFoldersTable(folderData) {
    const tbody = document.getElementById('folders-table');
    tbody.innerHTML = '';
    
    const sortedFolders = Object.entries(folderData)
        .sort(([,a], [,b]) => b.size - a.size);
    
    sortedFolders.forEach(([path, data]) => {
        const row = document.createElement('tr');
        const displayPath = path === '/' ? 'Root' : path;
        
        row.innerHTML = `
            <td title="${path}">${displayPath}</td>
            <td>${data.files.toLocaleString()}</td>
            <td>${data.folders.toLocaleString()}</td>
            <td>${data.formatted_size}</td>
            <td>
                <div class="percentage-bar">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${data.percentage}%"></div>
                    </div>
                    <span class="percentage-text">${data.percentage.toFixed(1)}%</span>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Display largest files table
function displayLargestFilesTable(filesData) {
    const tbody = document.getElementById('largest-files-table');
    tbody.innerHTML = '';
    
    filesData.forEach(file => {
        const row = document.createElement('tr');
        const fileName = file.name.length > 40 ? file.name.substring(0, 37) + '...' : file.name;
        const filePath = file.path.length > 50 ? '...' + file.path.substring(file.path.length - 47) : file.path;
        
        row.innerHTML = `
            <td title="${file.name}">${fileName}</td>
            <td>
                <div class="file-type-icon ${file.type}">
                    ${file.type.charAt(0).toUpperCase() + file.type.slice(1)}
                </div>
            </td>
            <td>${file.formatted_size}</td>
            <td title="${file.path}">${filePath}</td>
            <td>${file.upload_date}</td>
        `;
        tbody.appendChild(row);
    });
}

// Display extensions table
function displayExtensionsTable(extensionStats) {
    const tbody = document.getElementById('extensions-table');
    tbody.innerHTML = '';
    
    // Default to showing by count
    const data = extensionStats.by_count;
    
    data.forEach(ext => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><code>${ext.extension}</code></td>
            <td>${ext.count.toLocaleString()}</td>
            <td>${ext.formatted_size}</td>
        `;
        tbody.appendChild(row);
    });
}

// Toggle chart view between size and count
function toggleChartView(viewType) {
    if (!typeChart || !typeChart.typeData) return;
    
    const labels = Object.keys(typeChart.typeData);
    let newData;
    
    if (viewType === 'size') {
        newData = labels.map(type => typeChart.typeData[type].size);
    } else {
        newData = labels.map(type => typeChart.typeData[type].count);
    }
    
    typeChart.data.datasets[0].data = newData;
    typeChart.update();
}

// Toggle extensions table between count and size
function toggleExtensionsTable(tableType) {
    if (!analyticsData || !analyticsData.extension_stats) return;
    
    const tbody = document.getElementById('extensions-table');
    tbody.innerHTML = '';
    
    const data = tableType === 'ext-count' ? 
        analyticsData.extension_stats.by_count : 
        analyticsData.extension_stats.by_size;
    
    data.forEach(ext => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><code>${ext.extension}</code></td>
            <td>${ext.count.toLocaleString()}</td>
            <td>${ext.formatted_size}</td>
        `;
        tbody.appendChild(row);
    });
}

// Utility functions
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
    document.getElementById('main-content').style.display = show ? 'none' : 'block';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let unitIndex = 0;
    let size = bytes;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return unitIndex === 0 ? 
        `${Math.round(size)} ${units[unitIndex]}` : 
        `${size.toFixed(2)} ${units[unitIndex]}`;
}

function goBack() {
    window.location.href = '/?path=/';
}

function refreshData() {
    loadStorageAnalytics();
}

function getPassword() {
    return localStorage.getItem('password');
}