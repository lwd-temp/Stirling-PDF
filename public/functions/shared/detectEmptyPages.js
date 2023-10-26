export async function detectEmptyPages(snapshot, whiteThreashold, PDFJS, OpenCV) {
    const pdfDoc = await PDFJS.getDocument(snapshot).promise;

    const emptyPages = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        console.log("Checking page " + i);

        if(!await hasText(page)) {
            console.log(`Found text on Page ${i}, page is not empty`);
            continue;
        }

        if(!await areImagesBlank(page, whiteThreashold)) {
            console.log(`Found non white image on Page ${i}, page is not empty`);
            continue;
        }

        console.log(`Page ${i} is empty.`);
        emptyPages.push(i - 1);
    }
    return emptyPages;

    async function hasText(page) {
        const textContent = await page.getTextContent();
        return textContent.items.length === 0;
    }

    async function areImagesBlank(page, threshold) {
        const ops = await page.getOperatorList();
    
        for (var j=0; j < ops.fnArray.length; j++) {
            if (ops.fnArray[j] == PDFJS.OPS.paintJpegXObject || ops.fnArray[j] == PDFJS.OPS.paintImageXObject) {
                const image = page.objs.get(ops.argsArray[j][0]);
                if(image.data) {
                    return isImageBlank(image, threshold);
                }
            }
        }
        return true;
    }
    
    async function isImageBlank(image, threshold) {
        const src = new OpenCV.cv.Mat(image.width, image.height, OpenCV.cv.CV_8UC4);
        src.data.set(image.data);
        // Convert the image to grayscale
        const gray = new OpenCV.cv.Mat();
        OpenCV.cv.cvtColor(src, gray, OpenCV.cv.COLOR_RGBA2GRAY);
    
        // Calculate the mean value of the grayscale image
        const meanValue = OpenCV.cv.mean(gray);
    
        // Free memory
        src.delete();
        gray.delete();
    
        // Check if the mean value is below the threshold
        if (meanValue[0] <= threshold) {
            return true;
        } else {
            return false;
        }
    }
}