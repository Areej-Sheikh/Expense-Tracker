const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images'); // Save uploaded files to this directory
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`); // Unique filename with timestamp
    }
});

// File filter to allow only specific types of images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png|gif/;
    const isMimeType = allowedTypes.test(file.mimetype);
    const isExtName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (isMimeType && isExtName) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed.', false));
    }
};

// Multer middleware with a file size limit (5 MB)
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});

module.exports = upload;