const multer = require('multer');
const path = require('path');
const { isCloudinaryConfigured, uploadLogo, uploadBanner, uploadService, uploadAvatar, uploadPromo } = require('../config/cloudinary');

// Storage local como fallback si Cloudinary no esta configurado
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const localFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten: JPG, PNG, WebP, SVG'), false);
  }
};

const localUpload = multer({
  storage: localStorage,
  fileFilter: localFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Middleware factory que elige entre Cloudinary y local
const createUploadMiddleware = (type) => {
  return (req, res, next) => {
    let uploader;

    if (isCloudinaryConfigured()) {
      switch (type) {
        case 'logo':
          uploader = uploadLogo;
          break;
        case 'banner':
          uploader = uploadBanner;
          break;
        case 'service':
          uploader = uploadService;
          break;
        case 'avatar':
          uploader = uploadAvatar;
          break;
        case 'promo':
          uploader = uploadPromo;
          break;
        default:
          uploader = uploadService;
      }
    } else {
      uploader = localUpload;
    }

    uploader.single('image')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'El archivo es demasiado grande. Maximo permitido: 10MB'
            });
          }
          return res.status(400).json({
            success: false,
            message: `Error de upload: ${err.message}`
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Error al subir el archivo'
        });
      }

      // Si se subio archivo, agregar URL al request
      if (req.file) {
        if (isCloudinaryConfigured()) {
          req.fileUrl = req.file.path; // Cloudinary devuelve la URL en path
        } else {
          req.fileUrl = `/uploads/${req.file.filename}`; // URL local
        }
      }

      next();
    });
  };
};

// Middlewares exportados
const uploadLogoMiddleware = createUploadMiddleware('logo');
const uploadBannerMiddleware = createUploadMiddleware('banner');
const uploadServiceMiddleware = createUploadMiddleware('service');
const uploadAvatarMiddleware = createUploadMiddleware('avatar');
const uploadPromoMiddleware = createUploadMiddleware('promo');

// Middleware para manejar errores de upload
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Error de upload: ${err.message}`
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Error al procesar el archivo'
    });
  }
  next();
};

module.exports = {
  uploadLogoMiddleware,
  uploadBannerMiddleware,
  uploadServiceMiddleware,
  uploadAvatarMiddleware,
  uploadPromoMiddleware,
  handleUploadError
};
