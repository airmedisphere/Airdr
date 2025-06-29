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
    
    // Rename Modal
    const renameCancel = document.getElementById('rename-cancel');
    const renameCreate = document.getElementById('rename-create');
    
    if (renameCancel) {
        renameCancel.addEventListener('click', () => closeModal('rename-file-folder'));
    }
    
    if (renameCreate) {
        renameCreate.addEventListener('click', handleRename);
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
        
        // Get file info first
        const fileInfo = await getFileInfoFromUrl(fileUrl);
        const fileName = fileInfo.file_name;
        const fileSize = fileInfo.file_size;
        
        // Check file size limit
        const maxFileSize = MAX_FILE_SIZE__SDGJDG; // Will be replaced by the server
        if (fileSize > maxFileSize) {
            throw new Error(`File size exceeds ${(maxFileSize / (1024 * 1024 * 1024)).toFixed(2)} GB limit`);
        }
        
        // Start download
        const downloadId = await startFileDownloadFromUrl(fileUrl, fileName, singleThreaded);
        
        // Show progress
        showUploadProgress(downloadId, fileName, fileSize, 'url');
        
    } catch (error) {
        console.error('Error starting URL upload:', error);
        showNotification(error.message || 'Failed to start URL upload', 'error');
    }
}

async function startSmartBulkImport() {
    const channelInput = document.getElementById('smart-bulk-channel');
    const startMsgInput = document.getElementById('smart-bulk-start-msg');
    const endMsgInput = document.getElementById('smart-bulk-end-msg');
    const importModeRadio = document.querySelector('input[name="import-mode"]:checked');
    
    if (!channelInput || !importModeRadio) return;
    
    const channel = channelInput.value.trim();
    const startMsg = startMsgInput ? startMsgInput.value.trim() : '';
    const endMsg = endMsgInput ? endMsgInput.value.trim() : '';
    const importMode = importModeRadio.value;
    
    if (!channel) {
        showNotification('Channel identifier is required', 'warning');
        return;
    }
    
    try {
        closeModal('smart-bulk-import-modal');
        
        // Parse message link if provided
        let channelIdentifier = channel;
        if (channel.includes('t.me/')) {
            const match = channel.match(/t\.me\/([^\/]+)/);
            if (match) {
                channelIdentifier = match[1];
            }
        }
        
        const data = {
            'channel': channelIdentifier,
            'path': getCurrentPath(),
            'import_mode': importMode
        };
        
        // Add message range if provided
        if (startMsg && endMsg) {
            const startMsgId = parseInt(startMsg);
            const endMsgId = parseInt(endMsg);
            
            if (isNaN(startMsgId) || isNaN(endMsgId)) {
                throw new Error('Message IDs must be valid numbers');
            }
            
            if (startMsgId >= endMsgId) {
                throw new Error('Start message ID must be less than end message ID');
            }
            
            data.start_msg_id = startMsgId;
            data.end_msg_id = endMsgId;
        }
        
        // Show progress
        showUploadProgress('smart-import', channelIdentifier, 0, 'smart-import');
        
        const response = await postJson('/api/smartBulkImport', data);
        
        if (response.status === 'ok') {
            const methodText = response.method === 'fast_import' ? 'Fast Import (Direct Reference)' : 'Regular Import (Copied to Storage)';
            
            showNotification(`Smart Bulk Import completed! Method: ${methodText}, Imported: ${response.imported}/${response.total} files`, 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            throw new Error(response.status);
        }
        
    } catch (error) {
        console.error('Error starting smart bulk import:', error);
        showNotification(error.message || 'Failed to start smart bulk import', 'error');
        closeModal('file-uploader');
    }
}

async function checkChannel() {
    const channelInput = document.getElementById('smart-bulk-channel');
    const channelStatus = document.getElementById('channel-status');
    
    if (!channelInput || !channelStatus) return;
    
    const channel = channelInput.value.trim();
    
    if (!channel) {
        showNotification('Please enter a channel identifier', 'warning');
        return;
    }
    
    try {
        // Parse message link if provided
        let channelIdentifier = channel;
        if (channel.includes('t.me/')) {
            const match = channel.match(/t\.me\/([^\/]+)/);
            if (match) {
                channelIdentifier = match[1];
            }
        }
        
        const result = await checkChannelAdmin(channelIdentifier);
        
        if (result.status === 'ok') {
            channelStatus.className = 'channel-status success';
            channelStatus.innerHTML = `
                <strong>✅ Channel Found: ${result.channel_name}</strong><br>
                <span>Bot Admin Status: ${result.is_admin ? '✅ Admin (Fast Import Available)' : '❌ Not Admin (Regular Import Only)'}</span><br>
                <span>Recommended: ${result.is_admin ? '⚡ Fast Import or 🧠 Auto-Detect' : '📦 Regular Import or 🧠 Auto-Detect'}</span>
            `;
        } else {
            channelStatus.className = 'channel-status error';
            channelStatus.innerHTML = `
                <strong>❌ Error: ${result.message}</strong><br>
                <span>Please check the channel identifier and try again.</span>
            `;
        }
        
        channelStatus.style.display = 'block';
        
    } catch (error) {
        console.error('Error checking channel:', error);
        channelStatus.className = 'channel-status error';
        channelStatus.innerHTML = `
            <strong>❌ Error checking channel</strong><br>
            <span>${error.message || error}</span>
        `;
        channelStatus.style.display = 'block';
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

async function handleRename() {
    const nameInput = document.getElementById('rename-name');
    const modal = document.getElementById('rename-file-folder');
    
    if (!nameInput || !modal) return;
    
    const newName = nameInput.value.trim();
    const itemId = modal.dataset.itemId;
    const itemPath = modal.dataset.itemPath;
    
    if (!newName) {
        showNotification('Name cannot be empty', 'warning');
        return;
    }
    
    if (!itemId || !itemPath) {
        showNotification('Invalid item data', 'error');
        return;
    }
    
    try {
        const data = {
            'name': newName,
            'path': itemPath + '/' + itemId
        };
        
        const response = await postJson('/api/renameFileFolder', data);
        
        if (response.status === 'ok') {
            closeModal('rename-file-folder');
            showNotification('Item renamed successfully', 'success');
            window.location.reload();
        } else {
            showNotification('Failed to rename item', 'error');
        }
    } catch (error) {
        console.error('Rename error:', error);
        showNotification('Failed to rename item', 'error');
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

// Upload Progress Functions
function showUploadProgress(uploadId, fileName, fileSize, type = 'file') {
    const modal = document.getElementById('file-uploader');
    if (!modal) return;
    
    // Set modal data
    modal.dataset.uploadId = uploadId;
    modal.dataset.uploadType = type;
    
    // Update UI
    const filenameElement = document.getElementById('upload-filename');
    const filesizeElement = document.getElementById('upload-filesize');
    const statusElement = document.getElementById('upload-status');
    const percentElement = document.getElementById('upload-percent');
    const progressBar = document.getElementById('progress-bar');
    
    if (filenameElement) filenameElement.textContent = fileName;
    if (filesizeElement) filesizeElement.textContent = fileSize ? convertBytes(fileSize) : 'Unknown';
    if (statusElement) statusElement.textContent = 'Starting...';
    if (percentElement) percentElement.textContent = '0%';
    if (progressBar) progressBar.style.width = '0%';
    
    showModal('file-uploader');
    
    // Start progress monitoring
    if (type === 'smart-import') {
        // Smart import doesn't have traditional progress
        if (statusElement) statusElement.textContent = 'Processing smart bulk import...';
        if (progressBar) progressBar.style.width = '50%';
    } else {
        monitorUploadProgress(uploadId, type);
    }
}

async function monitorUploadProgress(uploadId, type) {
    const statusElement = document.getElementById('upload-status');
    const percentElement = document.getElementById('upload-percent');
    const progressBar = document.getElementById('progress-bar');
    const filesizeElement = document.getElementById('upload-filesize');
    
    const updateProgress = async () => {
        try {
            let response;
            
            if (type === 'url') {
                response = await postJson('/api/getFileDownloadProgress', { 'id': uploadId });
            } else {
                response = await postJson('/api/getUploadProgress', { 'id': uploadId });
            }
            
            if (response.status === 'ok') {
                const [status, current, total] = response.data;
                
                if (status === 'error') {
                    if (statusElement) statusElement.textContent = 'Upload failed';
                    showNotification('Upload failed', 'error');
                    setTimeout(() => closeModal('file-uploader'), 2000);
                    return;
                }
                
                if (status === 'completed') {
                    if (statusElement) statusElement.textContent = 'Upload completed';
                    if (percentElement) percentElement.textContent = '100%';
                    if (progressBar) progressBar.style.width = '100%';
                    
                    showNotification('Upload completed successfully', 'success');
                    setTimeout(() => {
                        closeModal('file-uploader');
                        window.location.reload();
                    }, 1500);
                    return;
                }
                
                // Update progress
                const percentage = total > 0 ? (current / total) * 100 : 0;
                
                if (statusElement) statusElement.textContent = status;
                if (percentElement) percentElement.textContent = `${percentage.toFixed(1)}%`;
                if (progressBar) progressBar.style.width = `${percentage}%`;
                if (filesizeElement && total > 0) {
                    filesizeElement.textContent = convertBytes(total);
                }
                
                // Continue monitoring
                setTimeout(updateProgress, 2000);
            } else {
                throw new Error(response.status);
            }
        } catch (error) {
            console.error('Progress monitoring error:', error);
            if (statusElement) statusElement.textContent = 'Upload failed';
            showNotification('Upload monitoring failed', 'error');
        }
    };
    
    // Start monitoring
    setTimeout(updateProgress, 1000);
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

// API Helper Functions (these should be implemented in apiHandler.js)
async function getFileInfoFromUrl(url) {
    const data = { 'url': url };
    const response = await postJson('/api/getFileInfoFromUrl', data);
    if (response.status === 'ok') {
        return response.data;
    } else {
        throw new Error(`Error getting file info: ${response.status}`);
    }
}

async function startFileDownloadFromUrl(url, filename, singleThreaded) {
    const data = { 
        'url': url, 
        'path': getCurrentPath(), 
        'filename': filename, 
        'singleThreaded': singleThreaded 
    };
    const response = await postJson('/api/startFileDownloadFromUrl', data);
    if (response.status === 'ok') {
        return response.id;
    } else {
        throw new Error(`Error starting file download: ${response.status}`);
    }
}

async function checkChannelAdmin(channel) {
    const data = { 'channel': channel };
    return await postJson('/api/checkChannelAdmin', data);
}

// Export functions for other modules
window.showNewFolderModal = showNewFolderModal;
window.showUploadProgress = showUploadProgress;
window.loadStorageInfo = loadStorageInfo;