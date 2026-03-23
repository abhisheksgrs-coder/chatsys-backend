const multer = require('multer');
const path   = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const AVATAR_DIR = path.join(UPLOAD_DIR, 'avatars');
const FILES_DIR  = path.join(UPLOAD_DIR, 'files');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });
if (!fs.existsSync(FILES_DIR))  fs.mkdirSync(FILES_DIR,  { recursive: true });

function makeStorage(subDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, subDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });
}

const ALLOWED_IMAGE = /jpeg|jpg|png|gif|webp/;
const ALLOWED_FILE  = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|zip|mp4|mp3|mov|avi|mkv|vcf/;

function fileFilter(allowed) {
  return (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase().slice(1);
    const mime = file.mimetype.split('/')[1];
    if (allowed.test(ext) || allowed.test(mime)) return cb(null, true);
    cb(new Error('File type not allowed'));
  };
}

exports.avatarUpload = multer({
  storage: makeStorage(AVATAR_DIR),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: fileFilter(ALLOWED_IMAGE),
});

exports.chatFileUpload = multer({
  storage: makeStorage(FILES_DIR),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: fileFilter(ALLOWED_FILE),
});
