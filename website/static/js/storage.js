// Storage functionality
let storageUpdateInterval = null;

// Format bytes to human readable format
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get storage information from server
async function getStorageInfo() {
    try {
        const data = { 'password': getPassword() };
        const response = await postJson('/api/getStorageInfo', data);
        
        if (response.status === 'ok') {
            return response.total_storage;
        } else {
            console.error('Failed to get storage info:', response.status);
            return 0;
        }
    } catch (error) {
        console.error('Error getting storage info:', error);
        return 0;
    }
}

// Update storage display in sidebar
async function updateStorageDisplay() {
    const storageAmount = document.getElementById('storage-amount');
    const storageProgress = document.getElementById('storage-progress');
    
    if (!storageAmount || !storageProgress) return;
    
    try {
        const totalStorage = await getStorageInfo();
        const formattedSize = formatBytes(totalStorage);
        
        storageAmount.textContent = formattedSize;
        
        // Calculate progress percentage (assuming 15GB limit for visual purposes)
        // You can adjust this based on your actual storage limits
        const storageLimit = 15 * 1024 * 1024 * 1024; // 15GB in bytes
        const progressPercentage = Math.min((totalStorage / storageLimit) * 100, 100);
        storageProgress.style.width = progressPercentage + '%';
        
    } catch (error) {
        console.error('Error updating storage display:', error);
        storageAmount.textContent = 'Error loading';
    }
}

// Initialize storage functionality
function initializeStorage() {
    // Update storage display immediately if password is available
    if (getPassword()) {
        updateStorageDisplay();
        
        // Set up periodic updates every 30 seconds
        if (storageUpdateInterval) {
            clearInterval(storageUpdateInterval);
        }
        storageUpdateInterval = setInterval(updateStorageDisplay, 30000);
    }
    
    // Add click handler for storage details button
    const storageDetailsBtn = document.getElementById('storage-details-btn');
    if (storageDetailsBtn) {
        storageDetailsBtn.addEventListener('click', function() {
            if (getPassword()) {
                window.location.href = '/storage';
            } else {
                alert('Please login first to view storage analytics');
            }
        });
    }
}

// Update storage after file operations
function refreshStorageAfterOperation() {
    if (getPassword()) {
        // Small delay to allow server to process the operation
        setTimeout(updateStorageDisplay, 1000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeStorage();
});

// Export functions for use in other scripts
window.updateStorageDisplay = updateStorageDisplay;
window.refreshStorageAfterOperation = refreshStorageAfterOperation;
window.initializeStorage = initializeStorage;