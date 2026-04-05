/**
 * Compresses an image file using HTML5 Canvas.
 * @param {File} file - The original image file.
 * @param {Object} options - Compression options.
 * @param {number} [options.maxSizeMB=1] - Maximum size in MB.
 * @param {number} [options.maxWidth=1200] - Maximum width in pixels.
 * @param {number} [options.quality=0.8] - Image quality (0 to 1).
 * @returns {Promise<File|Blob>} - The compressed image as a Blob (or File if possible).
 */
export const compressImage = (file, options = {}) => {
    const { maxSizeMB = 1, maxWidth = 1200, quality = 0.8 } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if needed
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas to Blob conversion failed'));
                            return;
                        }
                        // Create a new File object from the blob
                        const filename = file.name.replace(/\.[^/.]+$/, "") + ".webp"; // Convert to webp for better compression
                        const compressedFile = new File([blob], filename, {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/webp', // WebP is generally more efficient
                    quality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
