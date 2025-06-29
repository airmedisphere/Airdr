// Storage Analytics functionality

// Get storage analytics from server
async function getStorageAnalytics() {
    try {
        const data = { 'password': getPassword() };
        const response = await postJson('/api/getStorageAnalytics', data);
        
        if (response.status === 'ok') {
            return response.data;
        } else {
            throw new Error(response.message || 'Failed to get storage analytics');
        }
    } catch (error) {
        console.error('Error getting storage analytics:', error);
        throw error;
    }
}

// Format bytes to human readable format
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get color for file type
function getFileTypeColor(extension) {
    const colors = {
        'mp4': '#ff6b6b',
        'mkv': '#ff6b6b',
        'avi': '#ff6b6b',
        'mov': '#ff6b6b',
        'webm': '#ff6b6b',
        'mp3': '#4ecdc4',
        'wav': '#4ecdc4',
        'flac': '#4ecdc4',
        'aac': '#4ecdc4',
        'jpg': '#45b7d1',
        'jpeg': '#45b7d1',
        'png': '#45b7d1',
        'gif': '#45b7d1',
        'webp': '#45b7d1',
        'pdf': '#f39c12',
        'doc': '#3498db',
        'docx': '#3498db',
        'txt': '#95a5a6',
        'zip': '#9b59b6',
        'rar': '#9b59b6',
        '7z': '#9b59b6',
        'exe': '#e74c3c',
        'apk': '#2ecc71',
        'default': '#6c757d'
    };
    
    return colors[extension.toLowerCase()] || colors['default'];
}

// Render overview cards
function renderOverviewCards(analytics) {
    document.getElementById('total-storage').textContent = formatBytes(analytics.total_storage);
    document.getElementById('total-files').textContent = analytics.total_files.toLocaleString();
    document.getElementById('total-folders').textContent = analytics.total_folders.toLocaleString();
}

// Render folder breakdown
function renderFolderBreakdown(folders) {
    const container = document.getElementById('folder-breakdown');
    
    if (folders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48">
                    <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                </svg>
                <p>No folders found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = folders.map(folder => `
        <div class="folder-item">
            <div class="folder-info">
                <div class="folder-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                    </svg>
                </div>
                <div class="folder-details">
                    <div class="folder-name" title="${folder.name}">${folder.name}</div>
                    <div class="folder-stats">${folder.file_count} files, ${folder.subfolder_count} folders</div>
                </div>
            </div>
            <div class="folder-size">${formatBytes(folder.size)}</div>
        </div>
    `).join('');
}

// Render file type breakdown
function renderFileTypeBreakdown(fileTypes) {
    const container = document.getElementById('file-type-breakdown');
    
    if (Object.keys(fileTypes).length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <p>No files found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = Object.entries(fileTypes).map(([extension, data]) => `
        <div class="file-type-item">
            <div class="file-type-info">
                <div class="file-type-icon" style="background-color: ${getFileTypeColor(extension)}">
                    ${extension.substring(0, 3)}
                </div>
                <div class="file-type-details">
                    <div class="file-type-name">${extension}</div>
                    <div class="file-type-count">${data.count} files</div>
                </div>
            </div>
            <div class="file-type-size">${formatBytes(data.size)}</div>
        </div>
    `).join('');
}

// Render largest files
function renderLargestFiles(files) {
    const container = document.getElementById('largest-files');
    
    if (files.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                </svg>
                <p>No files found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = files.map(file => `
        <div class="file-item">
            <div class="file-info">
                <div class="file-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                </div>
                <div class="file-details">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-path" title="${file.path}">${file.path}</div>
                </div>
            </div>
            <div class="file-size">${formatBytes(file.size)}</div>
        </div>
    `).join('');
}

// Show loading state
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('content').style.display = 'none';
    document.getElementById('error').style.display = 'none';
}

// Show content
function showContent() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
    document.getElementById('error').style.display = 'none';
}

// Show error
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'none';
    document.getElementById('error').style.display = 'flex';
    document.getElementById('error-message').textContent = message;
}

// Load storage analytics
async function loadStorageAnalytics() {
    showLoading();
    
    try {
        const analytics = await getStorageAnalytics();
        
        // Render all sections
        renderOverviewCards(analytics);
        renderFolderBreakdown(analytics.folder_breakdown);
        renderFileTypeBreakdown(analytics.file_type_breakdown);
        renderLargestFiles(analytics.largest_files);
        
        showContent();
    } catch (error) {
        console.error('Error loading storage analytics:', error);
        showError(error.message || 'Failed to load storage analytics. Please try again.');
    }
}

// Check authentication and load analytics
function initializeStorageAnalytics() {
    if (!getPassword()) {
        // Redirect to home page if not authenticated
        window.location.href = '/';
        return;
    }
    
    loadStorageAnalytics();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeStorageAnalytics();
});

// Export functions
window.loadStorageAnalytics = loadStorageAnalytics;