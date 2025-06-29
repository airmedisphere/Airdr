// Modern Sidebar JavaScript

// Initialize sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeSidebar();
    setupNewButton();
    setupUploadOptions();
    loadStorageInfo();
});

function initializeSidebar() {
    const currentPath = getCurrentPath();
    const isTrash = currentPath.startsWith('/trash');
    const isSearch = currentPath.startsWith('/search');
    const isShare = currentPath.startsWith('/share');
    
    // Hide new button for special paths
    if (isTrash || isSearch) {
        const newButton = document.getElementById('new-button');
        if (newButton) {
            newButton.style.display = 'none';
        }
    }
    
    // Update navigation for shared folders
    if (isShare) {
        const newButton = document.getElementById('new-button');
        if (newButton) {
            newButton.style.display = 'none';
        }
        
        // Remove trash link for shared folders
        const trashLink = document.querySelector('a[href="/?path=/trash"]');
        if (trashLink) {
            trashLink.remove();
        }
    }
    
    // Update active navigation item
    updateActiveNavigation(currentPath);
}

function updateActiveNavigation(currentPath) {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.classList.remove('selected');
        
        const href = item.getAttribute('href');
        if (href === '/?path=/' && currentPath === '/') {
            item.classList.add('selected');
        } else if (href === '/?path=/trash' && currentPath.includes('/trash')) {
            item.classList.add('selected');
        }
    });
}

function setupNewButton() {
    const newButton = document.getElementById('new-button');
    const newUpload = document.getElementById('new-upload');
    const newUploadFocus = document.getElementById('new-upload-focus');
    
    if (!newButton || !newUpload) return;
    
    newButton.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleNewUpload();
    });
    
    // Handle focus events
    if (newUploadFocus) {
        newUploadFocus.addEventListener('blur', closeNewUpload);
        newUploadFocus.addEventListener('focusout', closeNewUpload);
    }
    
    // Close on outside click
    document.addEventListener('click', function(e) {
        if (!newButton.contains(e.target) && !newUpload.contains(e.target)) {
            closeNewUpload();
        }
    });
}

function toggleNewUpload() {
    const newUpload = document.getElementById('new-upload');
    const newUploadFocus = document.getElementById('new-upload-focus');
    
    if (!newUpload) return;
    
    const isVisible = newUpload.classList.contains('show');
    
    if (isVisible) {
        closeNewUpload();
    } else {
        newUpload.classList.add('show');
        if (newUploadFocus) {
            newUploadFocus.focus();
        }
    }
}

function closeNewUpload() {
    const newUpload = document.getElementById('new-upload');
    if (newUpload) {
        newUpload.classList.remove('show');
    }
}

function setupUploadOptions() {
    // New Folder
    const newFolderBtn = document.getElementById('new-folder-btn');
    if (newFolderBtn) {
        newFolderBtn.addEventListener('click', function() {
            closeNewUpload();
            showNewFolderModal();
        });
    }
    
    // File Upload
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const fileInput = document.getElementById('fileInput');
    if (fileUploadBtn && fileInput) {
        fileUploadBtn.addEventListener('click', function() {
            closeNewUpload();
            fileInput.click();
        });
    }
    
    // URL Upload
    const urlUploadBtn = document.getElementById('url-upload-btn');
    if (urlUploadBtn) {
        urlUploadBtn.addEventListener('click', function() {
            closeNewUpload();
            showUrlUploadModal();
        });
    }
    
    // Smart Bulk Import
    const smartBulkImportBtn = document.getElementById('smart-bulk-import-btn');
    if (smartBulkImportBtn) {
        smartBulkImportBtn.addEventListener('click', function() {
            closeNewUpload();
            showSmartBulkImportModal();
        });
    }
    
    // Setup modal handlers
    setupModalHandlers();
}

function setupModalHandlers() {
    // New Folder Modal
    const newFolderCancel = document.getElementById('new-folder-cancel');
    const newFolderCreate = document.getElementById('new-folder-create');
    
    if (newFolderCancel) {
        newFolderCancel.addEventListener('click', () => closeModal('create-new-folder'));
    }
    
    if (newFolderCreate) {
        newFolderCreate.addEventListener('click', createNewFolder);
    }
    
    // URL Upload Modal
    const remoteCancel = document.getElementById('remote-cancel');
    const remoteStart = document.getElementById('remote-start');
    
    if (remoteCancel) {
        remoteCancel.addEventListener('click', () => closeModal('new-url-upload'));
    }
    
    if (remoteStart) {
        remoteStart.addEventListener('click', startUrlUpload);
    }
    
    // Smart Bulk Import Modal
    const smartBulkCancel = document.getElementById('smart-bulk-cancel');
    const smartBulkCheck = document.getElementById('smart-bulk-check');
    const smartBulkStart = document.getElementById('smart-bulk-start');
    
    if (smartBulkCancel) {
        smartBulkCancel.addEventListener('click', () => closeModal('smart-bulk-import-modal'));
    }
    
    if (smartBulkCheck) {
        smartBulkCheck.addEventListener('click', checkChannel);
    }
    
    if (smartBulkStart) {
        smartBulkStart.addEventListener('click', startSmartBulkImport);
    }
    
    // Login Modal
    const passLogin = document.getElementById('pass-login');
    if (passLogin) {
        passLogin.addEventListener('click', handleLogin);
    }
    
    // Upload Progress Modal
    const cancelUpload = document.getElementById('cancel-file-upload');
    if (cancelUpload) {
        cancelUpload.addEventListener('click', cancelFileUpload);
    }
}

// Modal Functions
function showNewFolderModal() {
    const input = document.getElementById('new-folder-name');
    if (input) {
        input.value = '';
    }
    showModal('create-new-folder');
}

function showUrlUploadModal() {
    const urlInput = document.getElementById('remote-url');
    const singleThreaded = document.getElementById('single-threaded-toggle');
    
    if (urlInput) urlInput.value = '';
    if (singleThreaded) singleThreaded.checked = false;
    
    showModal('new-url-upload');
}

function showSmartBulkImportModal() {
    // Reset form
    const channelInput = document.getElementById('smart-bulk-channel');
    const startMsgInput = document.getElementById('smart-bulk-start-msg');
    const endMsgInput = document.getElementById('smart-bulk-end-msg');
    const autoRadio = document.querySelector('input[name="import-mode"][value="auto"]');
    const channelStatus = document.getElementById('channel-status');
    
    if (channelInput) channelInput.value = '';
    if (startMsgInput) startMsgInput.value = '';
    if (endMsgInput) endMsgInput.value = '';
    if (autoRadio) autoRadio.checked = true;
    if (channelStatus) channelStatus.style.display = 'none';
    
    showModal('smart-bulk-import-modal');
}

// Action Functions
async function createNewFolder() {
    const nameInput = document.getElementById('new-folder-name');
    if (!nameInput) return;
    
    const folderName = nameInput.value.trim();
    const path = getCurrentPath();
    
    if (path === 'redirect') return;
    
    if (!folderName) {
        showNotification('Folder name cannot be empty', 'warning');
        return;
    }
    
    try {
        const data = {
            'name': folderName,
            'path': path
        };
        
        const response = await postJson('/api/createNewFolder', data);
        
        if (response.status === 'ok') {
            closeModal('create-new-folder');
            showNotification('Folder created successfully', 'success');
            window.location.reload();
        } else {
            showNotification(response.status, 'error');
        }
    } catch (error) {
        console.error('Error creating folder:', error);
        showNotification('Failed to create folder', 'error');
    }
}

async function startUrlUpload() {
    const urlInput = document.getElementById('remote-url');
    const singleThreadedToggle = document.getElementById('single-threaded-toggle');
    
    if (!urlInput) return;
    
    const fileUrl = urlInput.value.trim();
    const singleThreaded = singleThreadedToggle ? singleThreadedToggle.checked : false;
    
    if (!fileUrl) {
        showNotification('Please enter a valid URL', 'warning');
        return;
    }
    
    try {
        closeModal('new-url-upload');
        
        // Use the existing Start_URL_Upload function from apiHandler.js
        await Start_URL_Upload();
        
    } catch (error) {
        console.error('Error starting URL upload:', error);
        showNotification(error.message || 'Failed to start URL upload', 'error');
    }
}

async function startSmartBulkImport() {
    try {
        closeModal('smart-bulk-import-modal');
        
        // Use the existing Start_Smart_Bulk_Import function from apiHandler.js
        await Start_Smart_Bulk_Import();
        
    } catch (error) {
        console.error('Error starting smart bulk import:', error);
        showNotification(error.message || 'Failed to start smart bulk import', 'error');
    }
}

async function checkChannel() {
    try {
        // Use the existing checkChannel function from apiHandler.js
        await checkChannel();
        
    } catch (error) {
        console.error('Error checking channel:', error);
        showNotification(error.message || 'Failed to check channel', 'error');
    }
}

async function handleLogin() {
    const passwordInput = document.getElementById('auth-pass');
    if (!passwordInput) return;
    
    const password = passwordInput.value;
    
    if (!password) {
        showNotification('Please enter a password', 'warning');
        return;
    }
    
    try {
        const data = { 'pass': password };
        const response = await postJson('/api/checkPassword', data);
        
        if (response.status === 'ok') {
            localStorage.setItem('password', password);
            closeModal('get-password');
            showNotification('Logged in successfully', 'success');
            window.location.reload();
        } else {
            showNotification('Invalid password', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed', 'error');
    }
}

function cancelFileUpload() {
    // Implementation depends on upload type
    const modal = document.getElementById('file-uploader');
    if (modal && modal.dataset.uploadId) {
        const uploadId = modal.dataset.uploadId;
        
        // Cancel the upload
        postJson('/api/cancelUpload', { 'id': uploadId }).then(() => {
            showNotification('Upload cancelled', 'info');
            closeModal('file-uploader');
        }).catch(error => {
            console.error('Cancel upload error:', error);
            showNotification('Failed to cancel upload', 'error');
        });
    } else {
        closeModal('file-uploader');
    }
}

// Storage Info Functions
async function loadStorageInfo() {
    const currentPath = getCurrentPath();
    const isSpecialPath = currentPath.startsWith('/trash') || 
                         currentPath.startsWith('/search') || 
                         currentPath.startsWith('/share');
    
    if (isSpecialPath || !getPassword()) return;
    
    try {
        const response = await fetch('/api/getStorageSummary', {
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
            updateStorageDisplay(data.data);
        }
    } catch (error) {
        console.error('Error loading storage info:', error);
    }
}

function updateStorageDisplay(storageData) {
    const storageUsedElement = document.getElementById('storage-used');
    const storageProgressElement = document.getElementById('storage-progress');
    
    if (storageUsedElement) {
        storageUsedElement.textContent = storageData.formatted_size;
    }
    
    if (storageProgressElement) {
        // Show progress based on a reasonable scale (up to 100GB = 100%)
        const maxVisualSize = 100 * 1024 * 1024 * 1024; // 100GB
        const progressPercentage = Math.min((storageData.total_size / maxVisualSize) * 100, 100);
        storageProgressElement.style.width = `${progressPercentage}%`;
    }
}

function openStorageAnalytics() {
    window.open('/storage', '_blank');
}

// Export functions for other modules
window.showNewFolderModal = showNewFolderModal;
window.loadStorageInfo = loadStorageInfo;
window.openStorageAnalytics = openStorageAnalytics;