import cloudinary from "cloudinary";

// Configure Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload files to Cloudinary
 * @param {Array} files - Array of file objects from multer
 * @param {String} folder - Cloudinary folder name
 * @returns {Promise<Array>} Array of upload results with secure URLs
 */
export const uploadToCloudinary = async (files, folder = "glownify") => {
    if (!files || files.length === 0) {
        return [];
    }

    try {
        const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream(
            {
                folder: folder,
                resource_type: "auto",
                quality: "auto",
                fetch_format: "auto",
            },
            (error, result) => {
                if (error) {
                reject(error);
                } else {
                resolve({
                    public_id: result.public_id,
                    secure_url: result.secure_url,
                    url: result.url,
                });
                }
            }
            );

            // Send file buffer to uploadStream
            uploadStream.end(file.buffer);
        });
        });

        const results = await Promise.all(uploadPromises);
        return results;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new Error(`File upload failed: ${error.message}`);
    }
};

/**
 * Delete file from Cloudinary
 * @param {String} publicId - Public ID of the file to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
    if (!publicId) {
        return null;
    }

    try {
        const result = await cloudinary.v2.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw new Error(`File deletion failed: ${error.message}`);
    }
};

/**
 * Delete multiple files from Cloudinary
 * @param {Array} publicIds - Array of public IDs to delete
 * @returns {Promise<Array>} Array of deletion results
 */
export const deleteMultipleFromCloudinary = async (publicIds) => {
    if (!publicIds || publicIds.length === 0) {
        return [];
    }

    try {
        const deletePromises = publicIds.map((publicId) =>
        cloudinary.v2.uploader.destroy(publicId)
        );
        const results = await Promise.all(deletePromises);
        return results;
    } catch (error) {
        console.error("Cloudinary bulk delete error:", error);
        throw new Error(`Files deletion failed: ${error.message}`);
    }
};

export default cloudinary;
