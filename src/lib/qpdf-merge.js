/**
 * @param {Array<{name: string, data: Uint8Array}>} pdfFiles
 * @returns {Promise<Blob>}
 */
const mergePDFs = async (pdfFiles) => {
  const QPDF = await import("./qpdf.mjs");
  const qpdf = await QPDF.default({
    print: (text) => console.log("qpdf stdout:", text),
    printErr: (text) => console.error("qpdf stderr:", text),
  });

  const inputFilenames = pdfFiles.map((file, index) => {
    const filename = `input_${index}.pdf`;
    qpdf.FS.writeFile(filename, file.data);
    return filename;
  });

  const args = ["--empty", "--pages", ...inputFilenames, "--", "merged.pdf"];
  qpdf.callMain(args);

  const mergedData = qpdf.FS.readFile("merged.pdf");

  inputFilenames.forEach((filename) => {
    try { qpdf.FS.unlink(filename); } catch (e) {}
  });
  try { qpdf.FS.unlink("merged.pdf"); } catch (e) {}

  return new Blob([mergedData], { type: "application/pdf" });
};

/** @param {string} fileURL @returns {Promise<Uint8Array>} */
export const loadFileAsArrayBuffer = (fileURL) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", fileURL);
    xhr.responseType = "arraybuffer";
    xhr.onload = () => {
      window.URL.revokeObjectURL(fileURL);
      resolve(new Uint8Array(xhr.response));
    };
    xhr.onerror = reject;
    xhr.send();
  });
};

export default mergePDFs;
