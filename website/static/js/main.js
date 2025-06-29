// Modern AirDrive Main JavaScript

// Global state
let currentView = 'list';
let currentDirectory = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadCurrentDirectory();
});

function initializeApp() {
    // Initialize view toggle
    const savedView = localStorage.getItem('viewMode') || 'list';
    setViewMode(savedView);
    
    // Initialize input validation
    const inputs = ['new-folder-name', 'rename-name', 'file-search'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', validateInput);
        }
    });
    
    // Check authentication
    if (getCurrentPath().includes('/share_')) {
        loadCurrentDirectory();
    } else {
        if (getPassword() === null) {
            showModal('get-password');
        } else {
            loadCurrentDirectory();
        }
    }
}

function setupEventListeners() {
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            setViewMode(view);
        });
    });
    
    // Search form
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Modal close on background click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('bg-blur')) {
            closeAllModals();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Context menu
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', closeContextMenu);
}

function setViewMode(mode) {
    currentView = mode;
    localStorage.setItem('viewMode', mode);
    
    // Update toggle buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === mode);
    });
    
    // Update file container
    const container = document.getElementById('file-container');
    if (container) {
        container.className = `file-container ${mode}-view`;
    }
    
    // Re-render files if directory is loaded
    if (currentDirectory) {
        renderFiles(currentDirectory);
    }
}

async function loadCurrentDirectory() {
    const path = getCurrentPath();
    if (path === 'redirect') return;
    
    try {
        showLoading(true);
        const auth = getFolderAuthFromPath();
        
        const data = { 
            'path': path, 
            'auth': auth,
            'sort_by': getCurrentSortBy(),
            'sort_order': getCurrentSortOrder()
        };
        
        const response = await postJson('/api/getDirectory', data);
        
        if (response.status === 'ok') {
            currentDirectory = response.data;
            renderFiles(response.data);
            
            // Update navigation for shared folders
            if (getCurrentPath().startsWith('/share')) {
                updateSharedFolderNavigation(response);
            }
            
            // Update breadcrumb and file count
            if (window.updateBreadcrumb) {
                window.updateBreadcrumb();
            }
            
            if (window.updateFileCount) {
                window.updateFileCount(response.data);
            }
        } else {
            showError('Directory not found');
        }
    } catch (error) {
        console.error('Error loading directory:', error);
        showError('Failed to load directory');
    } finally {
        showLoading(false);
    }
}

function renderFiles(data) {
    const container = document.getElementById('directory-data');
    if (!container) return;
    
    container.innerHTML = '';
    
    const files = data.contents || {};
    const isTrash = getCurrentPath().startsWith('/trash');
    
    if (Object.keys(files).length === 0) {
        renderEmptyState(container);
        return;
    }
    
    Object.entries(files).forEach(([key, item]) => {
        const fileElement = createFileElement(item, isTrash);
        container.appendChild(fileElement);
    });
    
    // Add event listeners
    setupFileEventListeners();
}

function createFileElement(item, isTrash) {
    const element = document.createElement('div');
    element.className = 'file-item';
    element.dataset.path = item.path;
    element.dataset.id = item.id;
    element.dataset.name = item.name;
    element.dataset.type = item.type;
    
    const isFolder = item.type === 'folder';
    const iconClass = isFolder ? 'folder' : 'file';
    
    // Create file icon
    const iconSvg = isFolder ? 
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>` :
        `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14,2 14,8 20,8"></polyline>
        </svg>`;
    
    // Create file meta information
    const metaItems = [];
    
    if (!isFolder) {
        metaItems.push(`<span class="file-size">${convertBytes(item.size)}</span>`);
        
        if (item.duration && isVideoFile(item.name)) {
            metaItems.push(`<span class="file-duration">${formatDuration(item.duration)}</span>`);
        }
    }
    
    metaItems.push(`<span class="file-date">${formatDate(item.upload_date)}</span>`);
    
    // Create actions
    const actions = createFileActions(item, isTrash);
    
    element.innerHTML = `
        <div class="file-icon ${iconClass}">
            ${iconSvg}
        </div>
        <div class="file-info">
            <div class="file-name" title="${item.name}">${item.name}</div>
            <div class="file-meta">
                ${metaItems.join('')}
            </div>
        </div>
        <div class="file-actions">
            ${actions}
        </div>
    `;
    
    return element;
}

function createFileActions(item, isTrash) {
    if (isTrash) {
        return `
            <button class="action-btn restore-btn" data-id="${item.id}" title="Restore">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23,4 23,10 17,10"></polyline>
                    <polyline points="1,20 1,14 7,14"></polyline>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
            </button>
            <button class="action-btn delete-btn" data-id="${item.id}" title="Delete permanently">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;
    } else {
        return `
            <button class="action-btn more-btn" data-id="${item.id}" title="More options">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="19" cy="12" r="1"></circle>
                    <circle cx="5" cy="12" r="1"></circle>
                </svg>
            </button>
        `;
    }
}

function renderEmptyState(container) {
    const currentPath = getCurrentPath();
    let message = 'This folder is empty';
    let icon = `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>`;
    
    if (currentPath.startsWith('/trash')) {
        message = 'Trash is empty';
        icon = `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>`;
    } else if (currentPath.startsWith('/search_')) {
        message = 'No files found';
        icon = `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
        </svg>`;
    }
    
    container.innerHTML = `
        <div class="empty-state">
            ${icon}
            <h3>${message}</h3>
            <p>Start by uploading files or creating folders</p>
        </div>
    `;
}

function setupFileEventListeners() {
    const isTrash = getCurrentPath().startsWith('/trash');
    
    if (!isTrash) {
        // Double-click to open files/folders
        document.querySelectorAll('.file-item[data-type="folder"]').forEach(item => {
            item.addEventListener('dblclick', openFolder);
        });
        
        document.querySelectorAll('.file-item[data-type="file"]').forEach(item => {
            item.addEventListener('dblclick', openFile);
        });
    }
    
    // Action buttons
    document.querySelectorAll('.more-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            showContextMenu(e, this.dataset.id);
        });
    });
    
    document.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            restoreItem(this.dataset.id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteItem(this.dataset.id);
        });
    });
}

function openFolder() {
    const path = (getCurrentPath() + '/' + this.dataset.id + '/').replace(/\/+/g, '/');
    const auth = getFolderAuthFromPath();
    
    let url = `/?path=${path}`;
    if (auth) {
        url += `&auth=${auth}`;
    }
    
    window.location.href = url;
}

function openFile() {
    const fileName = this.dataset.name.toLowerCase();
    const filePath = '/file?path=' + this.dataset.path + '/' + this.dataset.id;
    
    // Check if it's a PDF file
    if (fileName.endsWith('.pdf')) {
        const viewerPath = '/pdf-viewer?path=' + this.dataset.path + '/' + this.dataset.id;
        window.open(viewerPath, '_blank');
        return;
    }
    
    // Check if it's a video file
    if (isVideoFile(fileName)) {
        const streamPath = '/stream?url=' + getRootUrl() + filePath;
        window.open(streamPath, '_blank');
        return;
    }
    
    window.open(filePath, '_blank');
}

function showContextMenu(event, itemId) {
    const contextMenu = document.getElementById('context-menu');
    const item = document.querySelector(`[data-id="${itemId}"]`);
    
    if (!contextMenu || !item) return;
    
    const isFolder = item.dataset.type === 'folder';
    const itemName = item.dataset.name;
    const itemPath = item.dataset.path + '/' + itemId;
    
    // Create context menu items
    const menuItems = [
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>`,
            label: 'Rename',
            action: () => showRenameModal(itemId, itemName, itemPath)
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 7h10v10H7z"></path>
                <path d="M5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"></path>
                <path d="M5 19v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"></path>
            </svg>`,
            label: 'Move',
            action: () => showMoveModal(itemPath, itemName)
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>`,
            label: 'Copy',
            action: () => showCopyModal(itemPath, itemName)
        }
    ];
    
    // Add share option
    if (isFolder) {
        menuItems.push({
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16,6 12,2 8,6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>`,
            label: 'Share',
            action: () => shareFolder(itemId, itemPath)
        });
    } else {
        menuItems.push({
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16,6 12,2 8,6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>`,
            label: 'Share',
            action: () => shareFile(itemId, itemName, itemPath)
        });
    }
    
    // Add divider and trash option
    menuItems.push('divider');
    menuItems.push({
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>`,
        label: 'Move to trash',
        action: () => trashItem(itemId, itemPath),
        className: 'danger'
    });
    
    // Render menu
    contextMenu.innerHTML = menuItems.map(item => {
        if (item === 'divider') {
            return '<div class="context-menu-divider"></div>';
        }
        
        return `
            <div class="context-menu-item ${item.className || ''}" data-action="${menuItems.indexOf(item)}">
                ${item.icon}
                ${item.label}
            </div>
        `;
    }).join('');
    
    // Position menu
    const rect = event.target.getBoundingClientRect();
    contextMenu.style.left = `${rect.left}px`;
    contextMenu.style.top = `${rect.bottom + 5}px`;
    
    // Show menu
    contextMenu.classList.add('show');
    
    // Add click handlers
    contextMenu.querySelectorAll('.context-menu-item').forEach((item, index) => {
        item.addEventListener('click', () => {
            const menuItem = menuItems[index];
            if (menuItem && menuItem.action) {
                menuItem.action();
            }
            closeContextMenu();
        });
    });
}

function closeContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) {
        contextMenu.classList.remove('show');
    }
}

function handleContextMenu(event) {
    // Prevent default context menu on file items
    const fileItem = event.target.closest('.file-item');
    if (fileItem && !getCurrentPath().startsWith('/trash')) {
        event.preventDefault();
        const moreBtn = fileItem.querySelector('.more-btn');
        if (moreBtn) {
            showContextMenu(event, moreBtn.dataset.id);
        }
    }
}

function handleSearch(event) {
    event.preventDefault();
    const query = document.getElementById('file-search').value.trim();
    
    if (!query) {
        showNotification('Please enter a search term', 'warning');
        return;
    }
    
    const searchPath = '/?path=/search_' + encodeURIComponent(query);
    window.location.href = searchPath;
}

function handleKeyboardShortcuts(event) {
    // Don't interfere with input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    // Ctrl/Cmd + shortcuts
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 'n':
                event.preventDefault();
                if (!getCurrentPath().startsWith('/trash')) {
                    document.getElementById('new-button').click();
                }
                break;
            case 'f':
                event.preventDefault();
                document.getElementById('file-search').focus();
                break;
            case 'u':
                event.preventDefault();
                if (!getCurrentPath().startsWith('/trash')) {
                    document.getElementById('file-upload-btn').click();
                }
                break;
        }
    }
    
    // Escape key
    if (event.key === 'Escape') {
        closeAllModals();
        closeContextMenu();
    }
}

// Modal functions
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const bgBlur = document.getElementById('bg-blur');
    
    if (modal && bgBlur) {
        bgBlur.classList.add('show');
        modal.classList.add('show');
        
        // Focus first input
        const firstInput = modal.querySelector('input[type="text"], input[type="password"]');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const bgBlur = document.getElementById('bg-blur');
    
    if (modal && bgBlur) {
        modal.classList.remove('show');
        bgBlur.classList.remove('show');
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal.show').forEach(modal => {
        modal.classList.remove('show');
    });
    
    const bgBlur = document.getElementById('bg-blur');
    if (bgBlur) {
        bgBlur.classList.remove('show');
    }
}

// Utility functions
function showLoading(show) {
    const container = document.getElementById('file-container');
    if (container) {
        container.classList.toggle('loading', show);
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '1000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '400px',
        wordWrap: 'break-word'
    });
    
    // Set background color based on type
    const colors = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function showError(message) {
    showNotification(message, 'error');
}

function isVideoFile(fileName) {
    const videoExtensions = ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.ts', '.ogv', '.m4v', '.flv', '.wmv', '.3gp', '.mpg', '.mpeg'];
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return videoExtensions.includes(extension);
}

function formatDuration(duration) {
    if (!duration || duration === 0) return '';
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch {
        return dateString;
    }
}

function getCurrentSortBy() {
    return localStorage.getItem('sortBy') || 'date';
}

function getCurrentSortOrder() {
    return localStorage.getItem('sortOrder') || 'desc';
}

function updateSharedFolderNavigation(response) {
    const sections = document.querySelector('.sidebar-nav').getElementsByTagName('a');
    const currentPath = getCurrentPath();
    const auth = getFolderAuthFromPath();
    
    if (removeSlash(response.auth_home_path) === removeSlash(currentPath.split('_')[1])) {
        sections[0].classList.add('selected');
    } else {
        sections[0].classList.remove('selected');
    }
    
    sections[0].href = `/?path=/share_${removeSlash(response.auth_home_path)}&auth=${auth}`;
}

// Action functions
function showRenameModal(itemId, itemName, itemPath) {
    const modal = document.getElementById('rename-file-folder');
    const nameInput = document.getElementById('rename-name');
    
    if (modal && nameInput) {
        nameInput.value = itemName;
        modal.dataset.itemId = itemId;
        modal.dataset.itemPath = itemPath;
        showModal('rename-file-folder');
    }
}

async function trashItem(itemId, itemPath) {
    try {
        const data = {
            'path': itemPath,
            'trash': true
        };
        
        const response = await postJson('/api/trashFileFolder', data);
        
        if (response.status === 'ok') {
            showNotification('Item moved to trash successfully', 'success');
            window.location.reload();
        } else {
            showNotification('Failed to move item to trash', 'error');
        }
    } catch (error) {
        console.error('Error trashing item:', error);
        showNotification('Failed to move item to trash', 'error');
    }
}

async function restoreItem(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (!item) return;
    
    const itemPath = item.dataset.path + '/' + itemId;
    
    try {
        const data = {
            'path': itemPath,
            'trash': false
        };
        
        const response = await postJson('/api/trashFileFolder', data);
        
        if (response.status === 'ok') {
            showNotification('Item restored successfully', 'success');
            window.location.reload();
        } else {
            showNotification('Failed to restore item', 'error');
        }
    } catch (error) {
        console.error('Error restoring item:', error);
        showNotification('Failed to restore item', 'error');
    }
}

async function deleteItem(itemId) {
    const item = document.querySelector(`[data-id="${itemId}"]`);
    if (!item) return;
    
    const itemPath = item.dataset.path + '/' + itemId;
    
    if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
        return;
    }
    
    try {
        const data = {
            'path': itemPath
        };
        
        const response = await postJson('/api/deleteFileFolder', data);
        
        if (response.status === 'ok') {
            showNotification('Item deleted permanently', 'success');
            window.location.reload();
        } else {
            showNotification('Failed to delete item', 'error');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showNotification('Failed to delete item', 'error');
    }
}

async function shareFile(itemId, itemName, itemPath) {
    const fileName = itemName.toLowerCase();
    const rootUrl = getRootUrl();
    
    let link;
    if (fileName.endsWith('.pdf')) {
        link = `${rootUrl}/pdf-viewer?path=${itemPath}`;
    } else if (isVideoFile(fileName)) {
        link = `${rootUrl}/stream?url=${rootUrl}/file?path=${itemPath}`;
    } else {
        link = `${rootUrl}/file?path=${itemPath}`;
    }
    
    copyTextToClipboard(link);
}

async function shareFolder(itemId, itemPath) {
    try {
        const rootUrl = getRootUrl();
        const auth = await getFolderShareAuth(itemPath);
        const path = itemPath.slice(1); // Remove leading slash
        
        const link = `${rootUrl}/?path=/share_${path}&auth=${auth}`;
        copyTextToClipboard(link);
    } catch (error) {
        console.error('Error sharing folder:', error);
        showNotification('Failed to generate share link', 'error');
    }
}

// Export functions for other modules
window.showModal = showModal;
window.closeModal = closeModal;
window.closeAllModals = closeAllModals;
window.showNotification = showNotification;
window.showError = showError;
window.loadCurrentDirectory = loadCurrentDirectory;
window.currentDirectory = currentDirectory;
window.showRenameModal = showRenameModal;
window.trashItem = trashItem;
window.restoreItem = restoreItem;
window.deleteItem = deleteItem;
window.shareFile = shareFile;
window.shareFolder = shareFolder;