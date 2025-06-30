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
    
    // Update active navigation
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
    
    // Toggle dropdown on button click
    newButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleNewUpload();
    });
    
    // Handle focus events
    if (newUploadFocus) {
        newUploadFocus.addEventListener('blur', function() {
            setTimeout(closeNewUpload, 150); // Small delay to allow clicks
        });
        newUploadFocus.addEventListener('focusout', function() {
            setTimeout(closeNewUpload, 150);
        });
    }
    
    // Close on outside click
    document.addEventListener('click', function(e) {
        if (!newButton.contains(e.target) && !newUpload.contains(e.target)) {
            closeNewUpload();
        }
    });
    
    // Prevent dropdown from closing when clicking inside
    newUpload.addEventListener('click', function(e) {
        e.stopPropagation();
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
        newFolderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeNewUpload();
            showNewFolderModal();
        });
    }
    
    // File Upload
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const fileInput = document.getElementById('fileInput');
    if (fileUploadBtn && fileInput) {
        fileUploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeNewUpload();
            fileInput.click();
        });
    }
    
    // URL Upload
    const urlUploadBtn = document.getElementById('url-upload-btn');
    if (urlUploadBtn) {
        urlUploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeNewUpload();
            showUrlUploadModal();
        });
    }
    
    // Smart Bulk Import
    const smartBulkImportBtn = document.getElementById('smart-bulk-import-btn');
    if (smartBulkImportBtn) {
        smartBulkImportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
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
    const newFolderInput = document.getElementById('new-folder-name');
    
    if (newFolderCancel) {
        newFolderCancel.addEventListener('click', () => closeModal('create-new-folder'));
    }
    
    if (newFolderCreate) {
        newFolderCreate.addEventListener('click', createNewFolder);
    }
    
    if (newFolderInput) {
        newFolderInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                createNewFolder();
            }
        });
    }
    
    // URL Upload Modal
    const remoteCancel = document.getElementById('remote-cancel');
    const remoteStart = document.getElementById('remote-start');
    const remoteInput = document.getElementById('remote-url');
    
    if (remoteCancel) {
        remoteCancel.addEventListener('click', () => closeModal('new-url-upload'));
    }
    
    if (remoteStart) {
        remoteStart.addEventListener('click', startUrlUpload);
    }
    
    if (remoteInput) {
        remoteInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                startUrlUpload();
            }
        });
    }
    
    // Smart Bulk Import Modal
    const smartBulkCancel = document.getElementById('smart-bulk-cancel');
    const smartBulkCheck = document.getElementById('smart-bulk-check');
    const smartBulkStart = document.getElementById('smart-bulk-start');
    
    if (smartBulkCancel) {
        smartBulkCancel.addEventListener('click', () => closeModal('smart-bulk-import-modal'));
    }
    
    if (smartBulkCheck) {
        smartBulkCheck.addEventListener('click', checkChannelHandler);
    }
    
    if (smartBulkStart) {
        smartBulkStart.addEventListener('click', startSmartBulkImport);
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
    if (window.showModal) {
        window.showModal('create-new-folder');
    }
}

function showUrlUploadModal() {
    const urlInput = document.getElementById('remote-url');
    const singleThreaded = document.getElementById('single-threaded-toggle');
    
    if (urlInput) urlInput.value = '';
    if (singleThreaded) singleThreaded.checked = false;
    
    if (window.showModal) {
        window.showModal('new-url-upload');
    }
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
    
    if (window.showModal) {
        window.showModal('smart-bulk-import-modal');
    }
}

// Action Functions
async function createNewFolder() {
    const nameInput = document.getElementById('new-folder-name');
    if (!nameInput) return;
    
    const folderName = nameInput.value.trim();
    const path = getCurrentPath();
    
    if (path === 'redirect') return;
    
    if (!folderName) {
        if (window.showNotification) {
            window.showNotification('Folder name cannot be empty', 'warning');
        } else {
            alert('Folder name cannot be empty');
        }
        return;
    }
    
    try {
        const data = {
            'name': folderName,
            'path': path
        };
        
        const response = await postJson('/api/createNewFolder', data);
        
        if (response.status === 'ok') {
            if (window.closeModal) {
                window.closeModal('create-new-folder');
            }
            if (window.showNotification) {
                window.showNotification('Folder created successfully', 'success');
            } else {
                alert('Folder created successfully');
            }
            window.location.reload();
        } else {
            if (window.showNotification) {
                window.showNotification(response.status, 'error');
            } else {
                alert(response.status);
            }
        }
    } catch (error) {
        console.error('Error creating folder:', error);
        if (window.showNotification) {
            window.showNotification('Failed to create folder', 'error');
        } else {
            alert('Failed to create folder');
        }
    }
}

async function startUrlUpload() {
    const urlInput = document.getElementById('remote-url');
    const singleThreadedToggle = document.getElementById('single-threaded-toggle');
    
    if (!urlInput) return;
    
    const fileUrl = urlInput.value.trim();
    const singleThreaded = singleThreadedToggle ? singleThreadedToggle.checked : false;
    
    if (!fileUrl) {
        if (window.showNotification) {
            window.showNotification('Please enter a valid URL', 'warning');
        } else {
            alert('Please enter a valid URL');
        }
        return;
    }
    
    try {
        if (window.closeModal) {
            window.closeModal('new-url-upload');
        }
        
        // Use the existing Start_URL_Upload function from apiHandler.js
        if (window.Start_URL_Upload) {
            await window.Start_URL_Upload();
        } else {
            throw new Error('URL upload function not available');
        }
        
    } catch (error) {
        console.error('Error starting URL upload:', error);
        if (window.showNotification) {
            window.showNotification(error.message || 'Failed to start URL upload', 'error');
        } else {
            alert(error.message || 'Failed to start URL upload');
        }
    }
}

async function startSmartBulkImport() {
    try {
        if (window.closeModal) {
            window.closeModal('smart-bulk-import-modal');
        }
        
        // Use the existing Start_Smart_Bulk_Import function from apiHandler.js
        if (window.Start_Smart_Bulk_Import) {
            await window.Start_Smart_Bulk_Import();
        } else {
            throw new Error('Smart bulk import function not available');
        }
        
    } catch (error) {
        console.error('Error starting smart bulk import:', error);
        if (window.showNotification) {
            window.showNotification(error.message || 'Failed to start smart bulk import', 'error');
        } else {
            alert(error.message || 'Failed to start smart bulk import');
        }
    }
}

async function checkChannelHandler() {
    try {
        // Use the existing checkChannel function from apiHandler.js
        if (window.checkChannel) {
            await window.checkChannel();
        } else {
            throw new Error('Check channel function not available');
        }
        
    } catch (error) {
        console.error('Error checking channel:', error);
        if (window.showNotification) {
            window.showNotification(error.message || 'Failed to check channel', 'error');
        } else {
            alert(error.message || 'Failed to check channel');
        }
    }
}

function cancelFileUpload() {
    // Implementation depends on upload type
    const modal = document.getElementById('file-uploader');
    if (modal && modal.dataset.uploadId) {
        const uploadId = modal.dataset.uploadId;
        
        // Cancel the upload
        postJson('/api/cancelUpload', { 'id': uploadId }).then(() => {
            if (window.showNotification) {
                window.showNotification('Upload cancelled', 'info');
            } else {
                alert('Upload cancelled');
            }
            if (window.closeModal) {
                window.closeModal('file-uploader');
            }
        }).catch(error => {
            console.error('Cancel upload error:', error);
            if (window.showNotification) {
                window.showNotification('Failed to cancel upload', 'error');
            } else {
                alert('Failed to cancel upload');
            }
        });
    } else {
        if (window.closeModal) {
            window.closeModal('file-uploader');
        }
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
        const response = await postJson('/api/getStorageSummary', {});
        
        if (response.status === 'ok') {
            updateStorageDisplay(response.data);
        } else {
            console.log('Storage info not available:', response.status);
        }
    } catch (error) {
        console.error('Error loading storage info:', error);
    }
}

function updateStorageDisplay(storageData) {
    const storageUsedElement = document.getElementById('storage-used');
    const storageProgressElement = document.getElementById('storage-progress');
    
    if (storageUsedElement) {
        storageUsedElement.textContent = storageData.formatted_size || '0 B';
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