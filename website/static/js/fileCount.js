// File count functionality
let fileCountData = {
    videos: 0,
    pdfs: 0,
    images: 0,
    documents: 0,
    audio: 0,
    folders: 0,
    others: 0,
    total: 0
};

// File type definitions
const fileTypes = {
    videos: ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.ts', '.ogv', '.m4v', '.flv', '.wmv', '.3gp', '.mpg', '.mpeg'],
    pdfs: ['.pdf'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff', '.tif'],
    documents: ['.doc', '.docx', '.txt', '.rtf', '.odt', '.pages', '.tex', '.wpd'],
    audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff']
};

// Get file type category
function getFileTypeCategory(fileName) {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    for (const [category, extensions] of Object.entries(fileTypes)) {
        if (extensions.includes(extension)) {
            return category;
        }
    }
    
    return 'others';
}

// Count files by type
function countFilesByType(directoryData) {
    const counts = {
        videos: 0,
        pdfs: 0,
        images: 0,
        documents: 0,
        audio: 0,
        folders: 0,
        others: 0,
        total: 0
    };

    const contents = directoryData.contents || {};
    
    for (const [key, item] of Object.entries(contents)) {
        if (item.type === 'folder') {
            counts.folders++;
        } else if (item.type === 'file') {
            const category = getFileTypeCategory(item.name);
            counts[category]++;
        }
        counts.total++;
    }

    return counts;
}

// Update file count display
function updateFileCountDisplay(counts) {
    fileCountData = counts;
    const statsContainer = document.getElementById('file-count-stats');
    
    if (!statsContainer) return;

    // Clear existing content
    statsContainer.innerHTML = '';

    // Only show stats if there are items
    if (counts.total === 0) {
        statsContainer.style.display = 'none';
        return;
    }

    statsContainer.style.display = 'flex';

    // Create count items for non-zero counts
    const countItems = [
        {
            key: 'folders',
            label: 'Folders',
            icon: `<svg class="stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>`,
            color: '#ff9800'
        },
        {
            key: 'videos',
            label: 'Videos',
            icon: `<svg class="stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>`,
            color: '#f44336'
        },
        {
            key: 'pdfs',
            label: 'PDFs',
            icon: `<svg class="stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
            </svg>`,
            color: '#e53e3e'
        },
        {
            key: 'images',
            label: 'Images',
            icon: `<svg class="stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21,15 16,10 5,21"></polyline>
            </svg>`,
            color: '#4caf50'
        },
        {
            key: 'documents',
            label: 'Documents',
            icon: `<svg class="stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <line x1="16" y1="21" x2="8" y2="21"></line>
            </svg>`,
            color: '#2196f3'
        },
        {
            key: 'audio',
            label: 'Audio',
            icon: `<svg class="stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
            </svg>`,
            color: '#9c27b0'
        },
        {
            key: 'others',
            label: 'Others',
            icon: `<svg class="stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
            </svg>`,
            color: '#607d8b'
        }
    ];

    // Add total count first
    if (counts.total > 0) {
        const totalItem = document.createElement('div');
        totalItem.className = 'stat-item';
        totalItem.innerHTML = `
            <svg class="stat-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <path d="M9 9h6v6H9z"></path>
            </svg>
            <span class="stat-number">${counts.total}</span>
            <span class="stat-label">Total</span>
        `;
        statsContainer.appendChild(totalItem);
    }

    // Add individual type counts
    countItems.forEach(item => {
        const count = counts[item.key];
        if (count > 0) {
            const countItem = document.createElement('div');
            countItem.className = 'stat-item';
            countItem.innerHTML = `
                ${item.icon}
                <span class="stat-number">${count}</span>
                <span class="stat-label">${item.label}</span>
            `;
            statsContainer.appendChild(countItem);
        }
    });
}

// Hide file count stats for special paths
function shouldShowFileCount(currentPath) {
    return !currentPath.startsWith('/trash') && 
           !currentPath.startsWith('/search_') && 
           !currentPath.startsWith('/share_');
}

// Update file count when directory changes
function updateFileCount(directoryData) {
    const currentPath = getCurrentPath();
    
    if (shouldShowFileCount(currentPath)) {
        const counts = countFilesByType(directoryData);
        updateFileCountDisplay(counts);
    } else {
        // Hide file count stats for special paths
        const statsContainer = document.getElementById('file-count-stats');
        if (statsContainer) {
            statsContainer.style.display = 'none';
        }
    }
}

// Export function for use in main.js
window.updateFileCount = updateFileCount;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // File count will be updated when directory is loaded
});