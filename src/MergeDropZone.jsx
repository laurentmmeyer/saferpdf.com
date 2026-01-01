import React, { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { _GSPS2PDF } from "./lib/worker-init.js";
import mergePDFs, { loadFileAsArrayBuffer } from "./lib/qpdf-merge.js";
import LoadingButton from "./LoadingButton.jsx";

const baseStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "20px",
  borderWidth: 2,
  borderRadius: 2,
  borderColor: "#eeeeee",
  borderStyle: "dashed",
  backgroundColor: "#ffffff",
  color: "#bdbdbd",
  cursor: "pointer",
  outline: "none",
  transition: "border .24s ease-in-out",
};

const focusedStyle = { borderColor: "#2d0896ff" };
const acceptStyle = { borderColor: "#00e676" };
const rejectStyle = { borderColor: "#ff1744" };

function loadPDFData(blobUrl) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", blobUrl);
    xhr.responseType = "arraybuffer";
    xhr.onload = function () {
      window.URL.revokeObjectURL(blobUrl);
      const blob = new Blob([xhr.response], { type: "application/pdf" });
      const pdfURL = window.URL.createObjectURL(blob);
      const size = xhr.response.byteLength;
      resolve({ pdfURL, size });
    };
    xhr.send();
  });
}

function MergeDropZone({ onLimitReached, user }) {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [state, setState] = useState("selection");
  const [compressAfterMerge, setCompressAfterMerge] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles) => {
      const addedFiles = acceptedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        url: window.URL.createObjectURL(file),
      }));
      setFiles((prev) => [...prev, ...addedFiles]);
    },
    [],
  );

  const removeFile = (index) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      window.URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    setFiles((prev) => {
      const newFiles = [...prev];
      const [draggedFile] = newFiles.splice(draggedIndex, 1);
      newFiles.splice(index, 0, draggedFile);
      return newFiles;
    });
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  async function launchMerge() {
    if (files.length < 2) return;

    try {
      if (!user?.firestoreUser?.mode) {
        await fetch("https://ip-limit.laurent-2b0.workers.dev/", {
          method: "PUT",
          body: "1",
        }).then((e) => {
          if (!e.ok) throw new Error("Rate limit exceeded");
        });
      }

      if (window.gtag) {
        window.gtag("event", "merge", { files_count: files.length, compress: compressAfterMerge });
      }

      setState("merging");

      const pdfDataArray = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          data: await loadFileAsArrayBuffer(file.url),
        }))
      );

      const mergedBlob = await mergePDFs(pdfDataArray);
      let finalUrl = window.URL.createObjectURL(mergedBlob);
      let finalSize = mergedBlob.size;
      const originalTotalSize = files.reduce((sum, f) => sum + f.size, 0);

      if (compressAfterMerge) {
        setState("compressing");
        const mergedUrl = window.URL.createObjectURL(mergedBlob);
        const { blob: compressedBlobUrl, cleanup } = await _GSPS2PDF({
          psDataURL: mergedUrl,
          quality: "recommended",
        });
        const { pdfURL, size } = await loadPDFData(compressedBlobUrl);
        
        if (size < finalSize) {
          window.URL.revokeObjectURL(finalUrl);
          finalUrl = pdfURL;
          finalSize = size;
        }
        cleanup();
      }

      const firstName = files[0]?.name?.replace(".pdf", "") || "document";
      setResult({
        pdfURL: finalUrl,
        downloadName: `${firstName}-merged-min.pdf`,
        size: finalSize,
        originalSize: originalTotalSize,
        reduction: (originalTotalSize - finalSize) / originalTotalSize,
      });

      setState("done");
    } catch (e) {
      console.error("Merge failed:", e);
      if (e.message === "Rate limit exceeded") {
        onLimitReached();
      }
      setState("selection");
    }
  }

  const reset = () => {
    files.forEach((f) => window.URL.revokeObjectURL(f.url));
    if (result?.pdfURL) window.URL.revokeObjectURL(result.pdfURL);
    setFiles([]);
    setResult(null);
    setState("selection");
  };

  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      accept: { "application/pdf": [] },
      onDrop,
      disabled: state !== "selection",
    });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject],
  );

  const isProcessing = state === "merging" || state === "compressing";

  return (
    <>
      {state !== "done" && (
        <div className="container app-mb-5">
          <div {...getRootProps({ style })}>
            <input {...getInputProps()} />
            <p className="app-py-5 app-my-5">
              Drop your PDF files here to merge them, or click to select
            </p>
          </div>
        </div>
      )}

      {files.length > 0 && state !== "done" && (
        <div className="app-mt-4">
          <p className="app-text-sm app-text-gray-600 app-mb-2 font-dm">
            Drag files to reorder. Files will be merged in this order:
          </p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              draggable={!isProcessing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`app-flex app-flex-row app-items-center app-justify-between font-dm app-rounded app-border-2 app-border-purple-900 app-px-4 app-py-3 app-my-2 ${
                !isProcessing ? "app-cursor-grab hover:app-bg-purple-50" : ""
              } ${draggedIndex === index ? "app-opacity-50" : ""}`}
            >
              <div className="app-flex app-items-center app-gap-3">
                <span className="app-text-purple-900 app-font-bold app-w-6">{index + 1}</span>
                <span className="font-dm app-truncate app-flex-1">{file.name}</span>
              </div>
              <div className="app-flex app-items-center app-gap-3 app-shrink-0">
                <span className="font-dm app-text-sm app-text-gray-600">
                  {(file.size / 1048576).toFixed(2)} MB
                </span>
                {!isProcessing && (
                  <button
                    onClick={() => removeFile(index)}
                    className="app-text-gray-400 hover:app-text-red-600 app-p-1 app-transition-colors"
                    aria-label="Remove file"
                  >
                    <svg className="app-w-5 app-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length >= 2 && state !== "done" && (
        <div className="app-flex app-flex-col app-gap-3 app-my-5">
          <label className="app-flex app-items-center app-gap-2 app-cursor-pointer">
            <input
              type="checkbox"
              checked={compressAfterMerge}
              onChange={(e) => setCompressAfterMerge(e.target.checked)}
              disabled={isProcessing}
              className="app-w-4 app-h-4 app-accent-purple-900"
            />
            <span className="font-dm app-text-sm">Compress after merging</span>
          </label>
          <button
            className="app-w-full font-dm app-text-purple-100 app-bg-purple-900 app-text-white app-py-3 app-px-4 app-rounded focus:app-outline-none focus:app-shadow-outline app-transform app-transition app-duration-500 app-ease-out"
            type="button"
            disabled={isProcessing}
            onClick={launchMerge}
          >
            {state === "merging" ? (
              <span className="app-flex app-items-center app-justify-center app-gap-2">
                <LoadingButton /> Merging...
              </span>
            ) : state === "compressing" ? (
              <span className="app-flex app-items-center app-justify-center app-gap-2">
                <LoadingButton /> Compressing...
              </span>
            ) : (
              `Merge ${files.length} PDFs`
            )}
          </button>
        </div>
      )}

      {files.length === 1 && state === "selection" && (
        <p className="app-text-sm app-text-gray-500 app-mt-4 font-dm app-text-center">
          Add at least 2 files to merge
        </p>
      )}

      {state === "done" && result && (
        <div className="app-mt-6">
          <div className="app-bg-green-50 app-border-2 app-border-green-500 app-rounded-lg app-p-6 app-text-center">
            <h3 className="app-text-xl app-font-bold app-text-green-700 app-mb-4 font-raleway">
              Merge Complete!
            </h3>
            <div className="app-text-sm app-text-gray-600 app-mb-4 font-dm">
              <p>Original total: {(result.originalSize / 1048576).toFixed(2)} MB</p>
              <p>Final size: {(result.size / 1048576).toFixed(2)} MB</p>
              {result.reduction > 0 && (
                <p className="app-text-green-600 app-font-semibold">
                  {(result.reduction * 100).toFixed(0)}% smaller
                </p>
              )}
            </div>
            <a
              download={result.downloadName}
              href={result.pdfURL}
              className="app-inline-block app-mb-4 app-bg-purple-900 app-px-6 app-py-3 app-text-white app-rounded-full hover:app-bg-purple-800 app-transition-colors font-dm"
            >
              Download {result.downloadName}
            </a>
            <div>
              <button
                onClick={reset}
                className="app-text-purple-900 hover:app-underline font-dm"
              >
                Merge more files
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MergeDropZone;
