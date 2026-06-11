const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage so we can stream to Cloudinary
const storage = multer.memoryStorage();

// File filter: allow images and common document types
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Unsupported file type. Allowed: images, PDF, DOC, DOCX, TXT'),
      false
    );
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/**
 * Upload a buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {Object} options - Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary result
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder: 'freelance-platform',
      resource_type: 'auto',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(defaultOptions, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete a file from Cloudinary by public_id
 * @param {string} publicId - Cloudinary public ID
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error.message);
  }
};

// Middleware: upload single file with field name "file"
const uploadSingle = upload.single('file');

// Middleware: upload single avatar
const uploadAvatar = upload.single('avatar');

// Middleware: upload up to 5 files with field name "files"
const uploadArray = upload.array('files', 5);

// Middleware: process uploaded single file to Cloudinary
const processUpload = (folder = 'general') => async (req, res, next) => {
  if (!req.file) return next();

  try {
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: `freelance-platform/${folder}`,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    req.cloudinaryResult = result;
    req.fileUrl = result.secure_url;
    req.publicId = result.public_id;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware: process multiple uploaded files to Cloudinary
const processArrayUpload = (folder = 'attachments') => async (req, res, next) => {
  if (!req.files || req.files.length === 0) return next();

  try {
    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, {
        folder: `freelance-platform/${folder}`,
        resource_type: 'auto',
      })
    );

    const results = await Promise.all(uploadPromises);

    req.cloudinaryResults = results;
    req.uploadedFiles = results.map((r, i) => ({
      url: r.secure_url,
      publicId: r.public_id,
      name: req.files[i].originalname,
      type: req.files[i].mimetype,
      size: req.files[i].size,
    }));

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadAvatar,
  uploadArray,
  processUpload,
  processArrayUpload,
  uploadToCloudinary,
  deleteFromCloudinary,
  cloudinary,
};
