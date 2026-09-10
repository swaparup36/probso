"use server";

import cloudinary from "@/lib/cloudinary";
import countPages from "page-count";

const UPLOAD_FOLDER = "input_pdfs";

// The browser uploads straight to Cloudinary using this signature, so the PDF
// bytes never pass through the Next server. Upload speed is then bound by the
// user's own connection rather than by this server's outbound bandwidth.
export async function getUploadSignature() {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return JSON.stringify({ success: false, error: "Cloudinary is not configured" });
    }

    const timestamp = Math.round(Date.now() / 1000);

    // Every field posted to Cloudinary except file, api_key and resource_type
    // has to be signed, and the signed values must match the posted ones
    // exactly - hence the booleans are strings on both sides.
    const signature = cloudinary.utils.api_sign_request(
      {
        access_mode: "public",
        folder: UPLOAD_FOLDER,
        timestamp,
        unique_filename: "true",
        use_filename: "true",
      },
      apiSecret
    );

    return JSON.stringify({
      success: true,
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder: UPLOAD_FOLDER,
    });
  } catch (error) {
    console.error("Error creating upload signature:", error);
    return JSON.stringify({ success: false, error: `${error}` });
  }
}

// Runs once the browser has finished uploading. Reading the PDF back from
// Cloudinary is an inbound transfer, so the page limit stays enforced on the
// server where the client cannot bypass it.
export async function verifyPageLimit(
  pdfUrl: string,
  publicId: string,
  pageRestriction: number
) {
  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      return JSON.stringify({
        success: false,
        error: `Could not read the uploaded PDF (${response.status})`,
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const numberOfPages = await countPages(buffer, "pdf");
    console.log("Number of pages: ", numberOfPages);

    if (numberOfPages > pageRestriction) {
      await removeUpload(publicId);
      return JSON.stringify({
        success: false,
        error: `PDF exceeds the page limit of ${pageRestriction}. Uploaded PDF has ${numberOfPages} pages.`,
      });
    }

    return JSON.stringify({ success: true, pages: numberOfPages });
  } catch (error) {
    console.error("Error verifying pdf page count:", error);
    return JSON.stringify({ success: false, error: `${error}` });
  }
}

// Best effort cleanup so rejected PDFs do not pile up in the bucket.
async function removeUpload(publicId: string) {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
      type: "upload",
    });
  } catch (error) {
    console.error("Failed to remove rejected upload:", publicId, error);
  }
}
