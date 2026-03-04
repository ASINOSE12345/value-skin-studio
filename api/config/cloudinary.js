const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper para verificar si Cloudinary esta configurado
const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Configuraciones de storage para diferentes tipos de imagenes
const createStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'webp']) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `value-skin-studio/${folder}`,
      allowed_formats: allowedFormats,
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    }
  });
};

// Storage para logos (con transparencia)
const logoStorage = createStorage('logos', ['jpg', 'jpeg', 'png', 'webp', 'svg']);

// Storage para banners (optimizado para hero)
const bannerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'value-skin-studio/banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  }
});

// Storage para servicios
const serviceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'value-skin-studio/services',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  }
});

// Storage para avatares de clientes
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'value-skin-studio/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  }
});

// Storage para promociones
const promoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'value-skin-studio/promotions',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1200, height: 400, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
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

// Crear uploaders
const uploadLogo = multer({
  storage: logoStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadBanner = multer({
  storage: bannerStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadService = multer({
  storage: serviceStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

const uploadPromo = multer({
  storage: promoStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Funcion para eliminar imagen de Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error);
    throw error;
  }
};

// Funcion para obtener public_id desde URL de Cloudinary
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  const folder = parts.slice(-3, -1).join('/');
  const publicId = `${folder}/${filename.split('.')[0]}`;
  return publicId;
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadLogo,
  uploadBanner,
  uploadService,
  uploadAvatar,
  uploadPromo,
  deleteImage,
  getPublicIdFromUrl
};
