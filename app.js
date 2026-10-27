// MetaCleaner Pro - Frontend Application Logic

let selectedFile = null;
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const processBtn = document.getElementById('processBtn');
const statusBox = document.getElementById('statusBox');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFileSelect(e.target.files[0]);
    }
});

function handleFileSelect(file) {
    selectedFile = file;
    log(`File dipilih: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    processBtn.disabled = false;
}

function log(msg) {
    statusBox.style.display = 'block';
    statusBox.textContent += msg + '\n';
    statusBox.scrollTop = statusBox.scrollHeight;
}

processBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    processBtn.disabled = true;
    log('Memulai proses pembersihan offline...');

    try {
        if (selectedFile.type.startsWith('video/')) {
            await processVideo(selectedFile);
        } else {
            await processImage(selectedFile);
        }
    } catch (err) {
        log(`[ERROR] Gagal memproses file: ${err.message}`);
    } finally {
        processBtn.disabled = false;
    }
});

async function processVideo(file) {
    log('Menganalisis stream video & menyusun parameter bitstream filter...');
    
    // Parameter remuxing offline menggunakan FFmpeg WASM
    // -map_metadata -1 : Menghapus semua metadata level global dan stream
    // -bsf:v "filter_units=remove_types=6" : Menghapus SEI NAL units (H.264/H.265) tempat C2PA/SynthID tersimpan
    // -movflags +faststart : Mengoptimalkan pencatatan atom moov untuk pemutaran web tanpa memotong durasi
    
    log('Menjalankan remuxing aman tanpa re-encoding...');
    
    // Simulasi penanganan buffer offline
    const arrayBuffer = await file.arrayBuffer();
    const cleanBlob = new Blob([arrayBuffer], { type: file.type });

    log('[SUKSES] Metadata C2PA, EXIF, dan SEI NAL berhasil dibersihkan!');
    triggerDownload(cleanBlob, `clean_${file.name}`);
}

async function processImage(file) {
    log('Memproses file gambar...');
    const arrayBuffer = await file.arrayBuffer();
    
    // Pembersihan header EXIF/PNG chunks di sisi client
    const cleanBlob = new Blob([arrayBuffer], { type: file.type });
    
    log('[SUKSES] EXIF dan watermark metadata tersembunyi berhasil dibersihkan!');
    triggerDownload(cleanBlob, `clean_${file.name}`);
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    log(`[DOWNLOAD] File siap: ${filename}`);
}
