// File click handlers and context menu functionality

function openFolder() {
    let path = (getCurrentPath() + '/' + this.getAttribute('data-id') + '/').replaceAll('//', '/')

    const auth = getFolderAuthFromPath()
    if (auth) {
        path = path + '&auth=' + auth
    }
    window.location.href = `/?path=${path}`
}

function openFile() {
    const fileName = this.getAttribute('data-name').toLowerCase()
    let path = '/file?path=' + this.getAttribute('data-path') + '/' + this.getAttribute('data-id')

    // Check if it's a PDF file
    if (fileName.endsWith('.pdf')) {
        // Open PDF in the built-in viewer
        const viewerPath = '/pdf-viewer?path=' + this.getAttribute('data-path') + '/' + this.getAttribute('data-id')
        window.open(viewerPath, '_blank')
        return
    }

    // Check if it's a video file
    if (fileName.endsWith('.mp4') || fileName.endsWith('.mkv') || fileName.endsWith('.webm') || fileName.endsWith('.mov') || fileName.endsWith('.avi') || fileName.endsWith('.ts') || fileName.endsWith('.ogv')) {
        path = '/stream?url=' + getRootUrl() + path
    }

    window.open(path, '_blank')
}

// Rename File Folder functionality
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
            'path': itemPath
        };
        
        const response = await postJson('/api/renameFileFolder', data);
        
        if (response.status === 'ok') {
            closeModal('rename-file-folder');
            showNotification('Item renamed successfully', 'success');
            window.location.reload();
        } else {
            showNotification('Failed to rename item: ' + response.status, 'error');
        }
    } catch (error) {
        console.error('Rename error:', error);
        showNotification('Failed to rename item', 'error');
    }
}

// Setup rename modal handlers
document.addEventListener('DOMContentLoaded', function() {
    const renameCancel = document.getElementById('rename-cancel');
    const renameCreate = document.getElementById('rename-create');
    
    if (renameCancel) {
        renameCancel.addEventListener('click', () => closeModal('rename-file-folder'));
    }
    
    if (renameCreate) {
        renameCreate.addEventListener('click', handleRename);
    }
    
    // Handle Enter key in rename input
    const renameInput = document.getElementById('rename-name');
    if (renameInput) {
        renameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleRename();
            }
        });
    }
});

// Export functions for use in other modules
window.openFolder = openFolder;
window.openFile = openFile;
window.handleRename = handleRename;