"use client";

import { getUploadSignature } from "@/utils/uploader";

export type DirectUploadResult = {
  secureUrl: string;
  publicId: string;
};

// Posts the PDF from the browser to Cloudinary directly, using a signature
// minted by the server. Nothing but the signature request touches our backend.
export async function uploadPdfToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<DirectUploadResult> {
  const signatureResponse = JSON.parse(await getUploadSignature());
  if (!signatureResponse.success) {
    throw new Error(signatureResponse.error);
  }

  const { cloudName, apiKey, timestamp, signature, folder } = signatureResponse;

  const formData = new FormData();
  // Deliberately sent as "file" rather than the real filename: Cloudinary
  // refuses to deliver raw objects whose public_id ends in .pdf (the "allow
  // delivery of PDF files" security setting), and the worker fetches this URL
  // unauthenticated. Nameless uploads keep the existing file_xxxxxx shape.
  formData.append("file", file, "file");
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);
  formData.append("access_mode", "public");
  formData.append("use_filename", "true");
  formData.append("unique_filename", "true");

  // XMLHttpRequest rather than fetch, because it reports upload progress.
  return new Promise<DirectUploadResult>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`);

    request.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(`Cloudinary upload failed (${request.status}): ${request.responseText}`));
        return;
      }

      try {
        const result = JSON.parse(request.responseText);
        console.log("File uploaded to clodinary successfully");
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      } catch {
        reject(new Error("Cloudinary returned an unreadable response"));
      }
    };

    request.onerror = () => reject(new Error("Network error while uploading to Cloudinary"));
    request.onabort = () => reject(new Error("Upload was aborted"));

    request.send(formData);
  });
}
