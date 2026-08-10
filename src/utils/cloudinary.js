export const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration missing");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Upload failed");
    }
    return data.secure_url;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Image upload failed"
    );
  }
};