// Api Fuctions
async function postJson(url, data) {
    data['password'] = getPassword()
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    return await response.json()
}

document.getElementById('pass-login').addEventListener('click', async () => {
    const password = document.getElementById('auth-pass').value
    const data = { 'pass': password }
    const json = await postJson('/api/checkPassword', data)
    if (json.status === 'ok') {
        localStorage.setItem('password', password)
        alert('Logged In Successfully')
        window.location.reload()
    }
    else {
        alert('Wrong Password')
    }

})

async function getCurrentDirectory() {
    let path = getCurrentPath()
    if (path === 'redirect') {
        return
    }
    try {
        const auth = getFolderAuthFromPath()
        console.log(path)

        const data = { 'path': path, 'auth': auth }
        const json = await postJson('/api/getDirectory', data)

        if (json.status === 'ok') {
            if (getCurrentPath().startsWith('/share')) {
                const sections = document.querySelector('.sidebar-menu').getElementsByTagName('a')
                console.log(path)

                if (removeSlash(json['auth_home_path']) === removeSlash(path.split('_')[1])) {
                    sections[0].setAttribute('class', 'selected-item')

                } else {
                    sections[0].setAttribute('class', 'unselected-item')
                }
                sections[0].href = `/?path=/share_${removeSlash(json['auth_home_path'])}&auth=${auth}`
                console.log(`/?path=/share_${removeSlash(json['auth_home_path'])}&auth=${auth}`)
            }

            console.log(json)
            showDirectory(json['data'])
        } else {
            alert('404 Current Directory Not Found')
        }
    }
    catch (err) {
        console.log(err)
        alert('404 Current Directory Not Found')
    }
}

async function createNewFolder() {
    const folderName = document.getElementById('new-folder-name').value;
    const path = getCurrentPath()
    if (path === 'redirect') {
        return
    }
    if (folderName.length > 0) {
        const data = {
            'name': folderName,
            'path': path
        }
        try {
            const json = await postJson('/api/createNewFolder', data)

            if (json.status === 'ok') {
                window.location.reload();
            } else {
                alert(json.status)
            }
        }
        catch (err) {
            alert('Error Creating Folder')
        }
    } else {
        alert('Folder Name Cannot Be Empty')
    }
}


async function getFolderShareAuth(path) {
    const data = { 'path': path }
    const json = await postJson('/api/getFolderShareAuth', data)
    if (json.status === 'ok') {
        return json.auth
    } else {
        alert('Error Getting Folder Share Auth')
    }
}

// File Uploader Start

const MAX_FILE_SIZE = MAX_FILE_SIZE__SDGJDG // Will be replaced by the python

const fileInput = document.getElementById('fileInput');
const progressBar = document.getElementById('progress-bar');
const cancelButton = document.getElementById('cancel-file-upload');
const uploadPercent = document.getElementById('upload-percent');
let uploadRequest = null;
let uploadStep = 0;
let uploadID = null;

fileInput.addEventListener('change', async (e) => {
    const file = fileInput.files[0];

    if (file.size > MAX_FILE_SIZE) {
        alert(`File size exceeds ${(MAX_FILE_SIZE / (1024 * 1024 * 1024)).toFixed(2)} GB limit`);
        return;
    }

    // Showing file uploader
    document.getElementById('bg-blur').style.zIndex = '2';
    document.getElementById('bg-blur').style.opacity = '0.1';
    document.getElementById('file-uploader').style.zIndex = '3';
    document.getElementById('file-uploader').style.opacity = '1';

    document.getElementById('upload-filename').innerText = 'Filename: ' + file.name;
    document.getElementById('upload-filesize').innerText = 'Filesize: ' + (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    document.getElementById('upload-status').innerText = 'Status: Uploading To Backend Server';


    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', getCurrentPath());
    formData.append('password', getPassword());
    const id = getRandomId();
    formData.append('id', id);
    formData.append('total_size', file.size);

    uploadStep = 1;
    uploadRequest = new XMLHttpRequest();
    uploadRequest.open('POST', '/api/upload', true);

    uploadRequest.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            progressBar.style.width = percentComplete + '%';
            uploadPercent.innerText = 'Progress : ' + percentComplete.toFixed(2) + '%';
        }
    });

    uploadRequest.upload.addEventListener('load', async () => {
        await updateSaveProgress(id)
    });

    uploadRequest.upload.addEventListener('error', () => {
        alert('Upload failed');
        window.location.reload();
    });

    uploadRequest.send(formData);
});

cancelButton.addEventListener('click', () => {
    if (uploadStep === 1) {
        uploadRequest.abort();
    } else if (uploadStep === 2) {
        const data = { 'id': uploadID }
        postJson('/api/cancelUpload', data)
    }
    alert('Upload canceled');
    window.location.reload();
});

async function updateSaveProgress(id) {
    console.log('save progress')
    progressBar.style.width = '0%';
    uploadPercent.innerText = 'Progress : 0%'
    document.getElementById('upload-status').innerText = 'Status: Processing File On Backend Server';

    const interval = setInterval(async () => {
        const response = await postJson('/api/getSaveProgress', { 'id': id })
        const data = response['data']

        if (data[0] === 'running') {
            const current = data[1];
            const total = data[2];
            document.getElementById('upload-filesize').innerText = 'Filesize: ' + (total / (1024 * 1024)).toFixed(2) + ' MB';

            const percentComplete = (current / total) * 100;
            progressBar.style.width = percentComplete + '%';
            uploadPercent.innerText = 'Progress : ' + percentComplete.toFixed(2) + '%';
        }
        else if (data[0] === 'completed') {
            clearInterval(interval);
            uploadPercent.innerText = 'Progress : 100%'
            progressBar.style.width = '100%';

            await handleUpload2(id)
        }
    }, 3000)

}

async function handleUpload2(id) {
    console.log(id)
    document.getElementById('upload-status').innerText = 'Status: Uploading To Telegram Server';
    progressBar.style.width = '0%';
    uploadPercent.innerText = 'Progress : 0%';

    const interval = setInterval(async () => {
        const response = await postJson('/api/getUploadProgress', { 'id': id })
        const data = response['data']

        if (data[0] === 'running') {
            const current = data[1];
            const total = data[2];
            document.getElementById('upload-filesize').innerText = 'Filesize: ' + (total / (1024 * 1024)).toFixed(2) + ' MB';

            let percentComplete
            if (total === 0) {
                percentComplete = 0
            }
            else {
                percentComplete = (current / total) * 100;
            }
            progressBar.style.width = percentComplete + '%';
            uploadPercent.innerText = 'Progress : ' + percentComplete.toFixed(2) + '%';
        }
        else if (data[0] === 'completed') {
            clearInterval(interval);
            alert('Upload Completed')
            window.location.reload();
        }
    }, 3000)
}

// File Uploader End


// URL Uploader Start

async function get_file_info_from_url(url) {
    const data = { 'url': url }
    const json = await postJson('/api/getFileInfoFromUrl', data)
    if (json.status === 'ok') {
        return json.data
    } else {
        throw new Error(`Error Getting File Info : ${json.status}`)
    }

}

async function start_file_download_from_url(url, filename, singleThreaded) {
    const data = { 'url': url, 'path': getCurrentPath(), 'filename': filename, 'singleThreaded': singleThreaded }
    const json = await postJson('/api/startFileDownloadFromUrl', data)
    if (json.status === 'ok') {
        return json.id
    } else {
        throw new Error(`Error Starting File Download : ${json.status}`)
    }
}

async function download_progress_updater(id, file_name, file_size) {
    uploadID = id;
    uploadStep = 2
    // Showing file uploader
    document.getElementById('bg-blur').style.zIndex = '2';
    document.getElementById('bg-blur').style.opacity = '0.1';
    document.getElementById('file-uploader').style.zIndex = '3';
    document.getElementById('file-uploader').style.opacity = '1';

    document.getElementById('upload-filename').innerText = 'Filename: ' + file_name;
    document.getElementById('upload-filesize').innerText = 'Filesize: ' + (file_size / (1024 * 1024)).toFixed(2) + ' MB';

    const interval = setInterval(async () => {
        const response = await postJson('/api/getFileDownloadProgress', { 'id': id })
        const data = response['data']

        if (data[0] === 'error') {
            clearInterval(interval);
            alert('Failed To Download File From URL To Backend Server')
            window.location.reload()
        }
        else if (data[0] === 'completed') {
            clearInterval(interval);
            uploadPercent.innerText = 'Progress : 100%'
            progressBar.style.width = '100%';
            await handleUpload2(id)
        }
        else {
            const current = data[1];
            const total = data[2];

            const percentComplete = (current / total) * 100;
            progressBar.style.width = percentComplete + '%';
            uploadPercent.innerText = 'Progress : ' + percentComplete.toFixed(2) + '%';

            if (data[0] === 'Downloading') {
                document.getElementById('upload-status').innerText = 'Status: Downloading File From Url To Backend Server';
            }
            else {
                document.getElementById('upload-status').innerText = `Status: ${data[0]}`;
            }
        }
    }, 3000)
}


async function Start_URL_Upload() {
    try {
        document.getElementById('new-url-upload').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('new-url-upload').style.zIndex = '-1';
        }, 300)

        const file_url = document.getElementById('remote-url').value
        const singleThreaded = document.getElementById('single-threaded-toggle').checked

        const file_info = await get_file_info_from_url(file_url)
        const file_name = file_info.file_name
        const file_size = file_info.file_size

        if (file_size > MAX_FILE_SIZE) {
            throw new Error(`File size exceeds ${(MAX_FILE_SIZE / (1024 * 1024 * 1024)).toFixed(2)} GB limit`)
        }

        const id = await start_file_download_from_url(file_url, file_name, singleThreaded)

        await download_progress_updater(id, file_name, file_size)

    }
    catch (err) {
        alert(err)
        window.location.reload()
    }


}

// URL Uploader End

// Fast Import Start

async function Start_Fast_Import() {
    try {
        document.getElementById('fast-import-modal').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('fast-import-modal').style.zIndex = '-1';
        }, 300)

        const channel = document.getElementById('fast-import-channel').value.trim()
        const startMsg = document.getElementById('fast-import-start-msg').value.trim()
        const endMsg = document.getElementById('fast-import-end-msg').value.trim()

        if (!channel) {
            throw new Error('Channel identifier is required')
        }

        const data = {
            'channel': channel,
            'path': getCurrentPath()
        }

        // Add message range if provided
        if (startMsg && endMsg) {
            const startMsgId = parseInt(startMsg)
            const endMsgId = parseInt(endMsg)
            
            if (isNaN(startMsgId) || isNaN(endMsgId)) {
                throw new Error('Message IDs must be valid numbers')
            }
            
            if (startMsgId >= endMsgId) {
                throw new Error('Start message ID must be less than end message ID')
            }
            
            data.start_msg_id = startMsgId
            data.end_msg_id = endMsgId
        }

        // Show progress
        document.getElementById('bg-blur').style.zIndex = '2';
        document.getElementById('bg-blur').style.opacity = '0.1';
        document.getElementById('file-uploader').style.zIndex = '3';
        document.getElementById('file-uploader').style.opacity = '1';

        document.getElementById('upload-filename').innerText = 'Channel: ' + channel;
        document.getElementById('upload-filesize').innerText = 'Fast Import in progress...';
        document.getElementById('upload-status').innerText = 'Status: Importing files directly from channel';
        document.getElementById('upload-percent').innerText = 'Progress: Starting...';
        progressBar.style.width = '50%';

        const json = await postJson('/api/fastImport', data)

        if (json.status === 'ok') {
            progressBar.style.width = '100%';
            document.getElementById('upload-percent').innerText = 'Progress: 100%';
            document.getElementById('upload-status').innerText = `Status: Completed! Imported ${json.imported}/${json.total} files`;
            
            setTimeout(() => {
                alert(`Fast Import Completed!\n\nImported: ${json.imported} files\nTotal: ${json.total} files\n\nFiles are now available on your drive!`)
                window.location.reload();
            }, 1000)
        } else {
            throw new Error(json.status)
        }

    } catch (err) {
        alert(`Fast Import Error: ${err.message || err}`)
        window.location.reload()
    }
}

// Fast Import End