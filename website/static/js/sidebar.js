// Handling New Button On Sidebar Click
const isTrash = getCurrentPath().startsWith('/trash')
const isSearch = getCurrentPath().startsWith('/search')
const isShare = getCurrentPath().startsWith('/share')

if (!isTrash && !isSearch) {
    document.getElementById('new-button').addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const newUpload = document.getElementById('new-upload');
        const newUploadFocus = document.getElementById('new-upload-focus');
        
        console.log('New button clicked'); // Debug log
        
        // Toggle the dropdown
        if (newUpload.style.zIndex === '1' && newUpload.style.opacity === '1') {
            // Close if already open
            closeNewUploadFocus();
        } else {
            // Open the dropdown
            newUpload.style.zIndex = '1';
            newUpload.style.opacity = '1';
            newUpload.style.top = '80px';
            newUploadFocus.focus();
            
            console.log('New upload dropdown opened'); // Debug log
        }
    });
}
else {
    document.getElementById('new-button').style.display = 'none'
}

if (isShare) {
    document.getElementById('new-button').style.display = 'none'
    const sections = document.querySelector('.sidebar-menu').getElementsByTagName('a')
    sections[1].remove()
}

// New File Upload Start

function closeNewUploadFocus() {
    const newUpload = document.getElementById('new-upload');
    console.log('Closing new upload dropdown'); // Debug log
    
    newUpload.style.opacity = '0';
    newUpload.style.top = '40px';
    setTimeout(() => {
        newUpload.style.zIndex = '-1';
    }, 300);
}

document.getElementById('new-upload-focus').addEventListener('blur', closeNewUploadFocus);
document.getElementById('new-upload-focus').addEventListener('focusout', closeNewUploadFocus);

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const newButton = document.getElementById('new-button');
    const newUpload = document.getElementById('new-upload');
    
    if (!newButton.contains(e.target) && !newUpload.contains(e.target)) {
        if (newUpload.style.zIndex === '1') {
            closeNewUploadFocus();
        }
    }
});

document.getElementById('file-upload-btn').addEventListener('click', () => {
    console.log('File upload button clicked'); // Debug log
    document.getElementById('fileInput').click();
    closeNewUploadFocus();
});

// New File Upload End

// New Folder Start

document.getElementById('new-folder-btn').addEventListener('click', () => {
    console.log('New folder button clicked'); // Debug log
    document.getElementById('new-folder-name').value = '';
    document.getElementById('bg-blur').style.zIndex = '2';
    document.getElementById('bg-blur').style.opacity = '0.1';

    document.getElementById('create-new-folder').style.zIndex = '3';
    document.getElementById('create-new-folder').style.opacity = '1';
    
    closeNewUploadFocus(); // Close the dropdown
    
    setTimeout(() => {
        document.getElementById('new-folder-name').focus();
    }, 300);
})

document.getElementById('new-folder-cancel').addEventListener('click', () => {
    document.getElementById('new-folder-name').value = '';
    document.getElementById('bg-blur').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('bg-blur').style.zIndex = '-1';
    }, 300)
    document.getElementById('create-new-folder').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('create-new-folder').style.zIndex = '-1';
    }, 300)
});

document.getElementById('new-folder-create').addEventListener('click', createNewFolder);

// New Folder End

// New Url Upload Start

document.getElementById('url-upload-btn').addEventListener('click', () => {
    console.log('URL upload button clicked'); // Debug log
    document.getElementById('remote-url').value = '';
    document.getElementById('bg-blur').style.zIndex = '2';
    document.getElementById('bg-blur').style.opacity = '0.1';

    document.getElementById('new-url-upload').style.zIndex = '3';
    document.getElementById('new-url-upload').style.opacity = '1';
    
    closeNewUploadFocus(); // Close the dropdown
    
    setTimeout(() => {
        document.getElementById('remote-url').focus();
    }, 300);
})

document.getElementById('remote-cancel').addEventListener('click', () => {
    document.getElementById('remote-url').value = '';
    document.getElementById('bg-blur').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('bg-blur').style.zIndex = '-1';
    }, 300)
    document.getElementById('new-url-upload').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('new-url-upload').style.zIndex = '-1';
    }, 300)
});

document.getElementById('remote-start').addEventListener('click', Start_URL_Upload);

// New Url Upload End