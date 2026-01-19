"use server";

import cloudinary from "@/lib/cloudinary";
import countPages from "page-count";

export async function getPageCount(file: File) {
  // Convert File → ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Convert ArrayBuffer → Buffer
  const buffer = Buffer.from(arrayBuffer);

  // Count pages
  const pages = await countPages(buffer, "pdf");
  return pages;
}


export default async function uploadPDF(formData: FormData, pageRestriction: number) {
    try {
      console.log("formData: ", formData);
      const file = formData.get('file') as File | null;
      if(!file) return JSON.stringify({ success: false, error: 'File not provided' });

      const numberOfPages = await getPageCount(file);
      console.log("Number of pages: ", numberOfPages);
      if(numberOfPages > pageRestriction){
        return JSON.stringify({ success: false, error: `PDF exceeds the page limit of ${pageRestriction}. Uploaded PDF has ${numberOfPages} pages.` });
      }

      let pdfUrl = '';

      console.log(file);

      const fileExtension = file.name.toLowerCase().split('.')[file.name.toLowerCase().split('.').length-1];

      if (fileExtension === "pdf") {
            // Convert file to a buffer
            const fileBuffer = await fileToBuffer(file);

            // Upload the file to Cloudinary
            const uploadResult:any = await new Promise((resolve) => {
              cloudinary.uploader.upload_stream(
                {
                  folder: "input_pdfs", // Optional: Organize pdfs in a specific folder
                  resource_type: "raw", // Specify resource type as pdf
                  access_mode: "public",
                  type: "upload",            // ✅ ensures /upload/
                  use_filename: true,
                  unique_filename: true,
                },
                (error, uploadResult) => {
                  return resolve(uploadResult);
              }).end(fileBuffer);
            });

            pdfUrl = uploadResult.secure_url;
      }else{
          return JSON.stringify({ success: false, error: "Only .png, .jpg, .jpeg files are allowed"});
      }

      return JSON.stringify({ success: true, message: 'File uploaded to object store', pdfUrl: pdfUrl });
    } catch (error) {
      console.error("Error uploading pdf:", error);
      return JSON.stringify({ success: false, error: error });
    }
}

// Helper function to convert a File to a Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
  return Buffer.from(await file.arrayBuffer());
}