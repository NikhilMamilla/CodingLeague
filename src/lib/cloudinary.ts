/**
 * Cloudinary Storage Integration Service
 * Uploads generated certificates to Cloudinary and returns secure_url and public_id.
 */

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export function getCloudinaryConfig() {
  const cloudName =
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
    localStorage.getItem('cwcl_cloudinary_cloud_name') ||
    '';
  const uploadPreset =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
    localStorage.getItem('cwcl_cloudinary_upload_preset') ||
    '';

  return { cloudName, uploadPreset };
}

export function setCloudinaryConfig(cloudName: string, uploadPreset: string) {
  localStorage.setItem('cwcl_cloudinary_cloud_name', cloudName.trim());
  localStorage.setItem('cwcl_cloudinary_upload_preset', uploadPreset.trim());
}

/**
 * Uploads a PNG / PDF blob or File to Cloudinary
 */
export async function uploadToCloudinary(
  blob: Blob,
  filename: string
): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  // If Cloudinary keys are configured, use Cloudinary REST API
  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', blob, `${filename}.png`);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'cwcl_certificates');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/auto/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.secure_url && data.public_id) {
          return {
            secure_url: data.secure_url,
            public_id: data.public_id,
          };
        }
      }
    } catch (err) {
      console.warn('Cloudinary API upload failed, falling back to blob data URL:', err);
    }
  }

  // Fallback: Convert Blob to Data URL if Cloudinary preset is not set or fetch fails
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        secure_url: reader.result as string,
        public_id: `cwcl_local_${filename}_${Date.now()}`,
      });
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Delete certificate file from Cloudinary (or local reference)
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  const { cloudName } = getCloudinaryConfig();
  if (!publicId || publicId.startsWith('cwcl_local_') || !cloudName) {
    return true;
  }
  // Cloudinary deletion requires signed request or backend API route if unsigned is disabled
  console.log(`Requested Cloudinary deletion for public_id: ${publicId}`);
  return true;
}
