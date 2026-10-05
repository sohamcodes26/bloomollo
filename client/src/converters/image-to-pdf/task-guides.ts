export const taskGuides = [
  { slug: 'assignment-photos-to-pdf', title: 'Combine Assignment Photos into a PDF', description: 'Prepare photographed assignment pages for submission: arrange pages, check readability and choose a smaller PDF when needed.', steps: [
    ['Photograph each page clearly', 'Use even lighting, keep the camera parallel to the page and include every edge. Retake blurred photos before converting. Bloomollo does not straighten, crop or clean up photographed pages.'],
    ['Arrange and check the pages', 'Choose your photos in the converter, rotate sideways pages and drag previews into reading order. On a phone, briefly hold a preview before dragging; use the arrow buttons if that is easier.'],
    ['Choose the submission layout', 'Use A4 if your instructions ask for A4 pages, or Fit to image to preserve each photo’s page shape. Margins default to None. The converter does not crop or stretch images.'],
    ['Check the size and submit carefully', 'Download the PDF and open it to inspect every page. If the file exceeds your submission limit, try Compact quality or fewer images. Check that small handwriting remains legible. Acceptance depends on your institution or portal; Bloomollo does not guarantee it.'],
  ] },
  { slug: 'images-to-printable-pdf', title: 'Make a Printable PDF from Images: A4 or US Letter', description: 'Combine scans, receipts and screenshots into a printable PDF, choose A4 or US Letter, and check page proportions before printing.', steps: [
    ['Choose the paper you will actually use', 'Select US Letter for Letter paper or A4 for A4 paper in PDF settings. Do not choose a size only because of your location: match the paper loaded in your printer.'],
    ['Arrange receipts and scanned pages', 'Add supported images and put them in reading order. Each image creates one PDF page; this tool does not place multiple receipts on the same page. Rotate pages when necessary.'],
    ['Understand white space', 'Images keep their proportions. A narrow receipt or wide screenshot may leave white space on a fixed-size page even with margins set to None. Fit to image creates a page with the image’s proportions, but it may not match your printer paper.'],
    ['Inspect the PDF before printing', 'Open the downloaded PDF and check page order, orientation and text readability. In the print dialog, review the paper size and scaling preview. The PDF contains image-based pages, not OCR text, and High quality is not lossless.'],
  ] },
] as const
export const getTaskGuide = (pathname: string) => taskGuides.find(guide => pathname.replace(/\/+$/, '') === `/guides/${guide.slug}`)

