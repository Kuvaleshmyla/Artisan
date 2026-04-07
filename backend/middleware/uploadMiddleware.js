import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

function checkFileType(file, cb) {
    const ext = path.extname(file.originalname).toLowerCase().replace(/^\./, '');
    const allowedExt = /^(jpe?g|png|webp)$/.test(ext);
    const allowedMime = /^image\/(jpeg|png|webp)$/i.test(file.mimetype);

    if (allowedExt && allowedMime) {
        return cb(null, true);
    }
    cb('Images only (JPEG, PNG, or WebP).');
}

function checkWorkVideo(file, cb) {
    const ext = path.extname(file.originalname).toLowerCase().replace(/^\./, '');
    if (!['mp4', 'webm', 'mov'].includes(ext)) {
        return cb(new Error('Work video must be MP4, WebM, or MOV.'));
    }
    const mime = file.mimetype || '';
    if (mime && !/^video\//i.test(mime) && !/^application\/octet-stream$/i.test(mime)) {
        return cb(new Error('Invalid video file type.'));
    }
    cb(null, true);
}

const upload = multer({
    storage,
    limits: { fileSize: 80 * 1024 * 1024 },
    fileFilter(req, file, cb) {
        if (file.fieldname === 'workVideo') {
            return checkWorkVideo(file, cb);
        }
        checkFileType(file, cb);
    },
});

export default upload;
