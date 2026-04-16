import multer from "multer";

// Configure multer for in-memory storage
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
};

// Configure multer
const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Middleware for single file upload
export const uploadSingleFile = uploadMiddleware.single("file");

// Middleware for multiple files upload (up to 10 files)
export const uploadMultipleFiles = uploadMiddleware.array("files", 10);

// Middleware for gallery images (specific field for salon gallery)
export const uploadGalleryImages = uploadMiddleware.array("galleryImages", 10);

// Middleware for salon owner uploads (gallery images + government ID image)
export const uploadSalonOwnerFiles = uploadMiddleware.fields([
  { name: "galleryImages", maxCount: 10 },
  { name: "governmentIdImage", maxCount: 1 },
]);

// Middleware for independent pro uploads (government ID image + work photos)
export const uploadIndependentProFiles = uploadMiddleware.fields([
  { name: "governmentIdImage", maxCount: 1 },
  { name: "workPhotos", maxCount: 10 },
]);

export default uploadMiddleware;
