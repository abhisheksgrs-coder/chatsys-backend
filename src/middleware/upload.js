const multer  = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function makeStorage(folder) {
  return new CloudinaryStorage({
    cloudinary,
    params: (req, file) => ({
      folder,
      resource_type: 'auto',
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`,
    }),
  });
}

const ALLOWED_IMAGE = /jpeg|jpg|png|gif|webp/;
const ALLOWED_FILE  = /jpeg|jpg|png|gif|webp|pdf|doc|docx|txt|zip|mp4|mp3|mov|avi|mkv|vcf/;

function fileFilter(allowed) {
  return (req, file, cb) => {
    const ext  = require('path').extname(file.originalname).toLowerCase().slice(1);
    const mime = file.mimetype.split('/')[1];
    if (allowed.test(ext) || allowed.test(mime)) return cb(null, true);
    cb(new Error('File type not allowed'));
  };
}

exports.avatarUpload = multer({
  storage: makeStorage('chatsys/avatars'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter(ALLOWED_IMAGE),
});

exports.chatFileUpload = multer({
  storage: makeStorage('chatsys/files'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: fileFilter(ALLOWED_FILE),
});
