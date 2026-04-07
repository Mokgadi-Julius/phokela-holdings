// Get the API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Converts an image path to a full URL
 * @param {string} imagePath - The image path from the API (can be relative or absolute)
 * @returns {string} - Full image URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';

  // If it's already a full URL (Cloudinary or other CDN), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a relative path, prepend the API base URL
  // Remove leading slash if present to avoid double slashes
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${API_BASE_URL}${path}`;
};

/**
 * Converts an array of image paths to full URLs
 * @param {Array<string>} images - Array of image paths
 * @returns {Array<string>} - Array of full image URLs
 */
export const getImageUrls = (images) => {
  if (!Array.isArray(images)) return [];
  return images.map(getImageUrl);
};

/**
 * Gets the main image URL or first image from array
 * @param {string|null} mainImage - Main image path
 * @param {Array<string>} images - Array of image paths
 * @returns {string} - Full image URL or empty string
 */
export const getMainImageUrl = (mainImage, images = []) => {
  if (mainImage) return getImageUrl(mainImage);
  if (images && images.length > 0) return getImageUrl(images[0]);
  return '';
};
