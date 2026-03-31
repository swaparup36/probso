import os
import fitz
import pytesseract
import numpy as np
import cv2
from PIL import Image

def extract_pdf_text(pdf_path: str) -> dict:
    doc = fitz.open(pdf_path)
    all_text = {}

    for page in doc:
        # for normal text layer
        text = page.get_text().strip()
        if text:
            all_text[page] = text

        # OCR fallback for image-based content
        pix = page.get_pixmap(dpi=300)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        ocr_text = pytesseract.image_to_string(img, lang="eng")
        if ocr_text.strip():
            all_text[page] = ocr_text.strip()

    
    json_output = {f"page_{i+1}": text for i, text in enumerate(all_text.values())}
    print("Extracted text from PDF:", json_output)
    return json_output

def extract_images(pdf_path: str, output_folder: str):
    """
    Extracts diagrams/images from PDF pages.
    Saves them as PNGs inside output_folder.
    Returns list of file paths.
    """
    os.makedirs(output_folder, exist_ok=True)

    doc = fitz.open(pdf_path)
    extracted = []

    for page_index, page in enumerate(doc):
        for img_index, img in enumerate(page.get_images(full=True)):
            xref = img[0]  # image reference
            pix = fitz.Pixmap(doc, xref)

            # Create filename
            output_path = os.path.join(
                output_folder, f"page{page_index+1}_img{img_index}.png"
            )

            # Save RGB or convert CMYK to RGB
            if pix.n < 5:
                pix.save(output_path)
            else:
                pix_converted = fitz.Pixmap(fitz.csRGB, pix)
                pix_converted.save(output_path)
                pix_converted = None
            pix = None

            extracted.append(output_path)

    return extracted
