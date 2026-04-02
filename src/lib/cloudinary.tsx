/**
 * Cloudinary Upload Utility
 * Handles direct uploads to Cloudinary using Unsigned Presets.
 * Automatically applies format and quality optimization (f_auto, q_auto).
 */

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "your_cloud_name";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "your_upload_preset";

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

export const uploadToCloudinary = async (file: File): Promise<string> => {
  if (CLOUDINARY_CLOUD_NAME === "your_cloud_name") {
    throw new Error("Cloudinary Cloud Name is not configured in .env.local");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Cloudinary upload failed");
    }

    const data: CloudinaryUploadResponse = await response.json();
    
    // Apply automatic optimization to the returned URL for images
    // Note: f_auto,q_auto might not apply to PDFs, but Cloudinary safely ignores it
    let optimizedUrl = data.secure_url;
    if (data.resource_type === "image") {
      optimizedUrl = data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
    }
    
    return optimizedUrl;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw error;
  }
};

/**
 * Optimizes an existing Cloudinary URL
 * @param url The original Cloudinary secure_url
 * @returns Optimized URL with f_auto, q_auto
 */
export const optimizeCloudinaryUrl = (url: string): string => {
  if (!url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
};

/**
 * Generates a Cloudinary URL that forced file downloading
 * @param url The original Cloudinary secure_url
 * @returns URL with fl_attachment flag
 */
export const getDownloadUrl = (url: string): string => {
  if (!url.includes("cloudinary.com")) return url;
  
  // Normalize by removing optimization flags if they already exist, 
  // then inject the direct download flags in the requested order.
  const normalizedUrl = url.replace("/f_auto,q_auto/", "/");
  return normalizedUrl.replace("/upload/", "/upload/fl_attachment/f_auto,q_auto/");
};
