import React, { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslation } from "react-i18next";
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

function _GSMergePDFs(dataStruct) {
  const worker = new Worker(
    new URL("./lib/gs-merge-worker.js", import.meta.url),
    { type: "module" }
  );
  worker.postMessage({ data: dataStruct, target: "merge" });
  return new Promise((resolve) => {
    const listener = (e) => {
      resolve({
        blob: e.data,
        cleanup: () => {
          worker.removeEventListener("message", listener);
          setTimeout(() => worker.terminate(), 0);
        },
      });
    };
    worker.addEventListener("message", listener);
  });
}

function MergeDropZone({ onLimitReached, user }) {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [state, setState] = useState("selection");
  const [compressAfterMerge, setCompressAfterMerge] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const addedFiles = acceptedFiles.map((file) => ({
      name: file.name,
      size: file.size,
      url: window.URL.createObjectURL(file),
    }));
    setFiles((prev) => [...prev, ...addedFiles]);
  }, []);

  const removeFile = (index) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      window.URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const moveFile = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= files.length) return;
    setFiles((prev) => {
      const newFiles = [...prev];
      const [movedFile] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedFile);
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
          body: String(files.length),
        }).then((e) => {
          if (!e.ok) throw new Error("Rate limit exceeded");
        });
      }

      if (window.gtag) {
        window.gtag("event", "merge", {
          files_count: files.length,
          compress: compressAfterMerge,
        });
      }

      setState("merging");

      const fileUrls = files.map((f) => f.url);
      const originalTotalSize = files.reduce((sum, f) => sum + f.size, 0);

      const { blob: mergedBlobUrl, cleanup } = await _GSMergePDFs({
        files: fileUrls,
        compress: compressAfterMerge,
      });

      const { pdfURL, size } = await loadPDFData(mergedBlobUrl);
      cleanup();

      const firstName = files[0]?.name?.replace(".pdf", "") || "document";
      setResult({
        pdfURL,
        downloadName: `${firstName}-merged-min.pdf`,
        size,
        originalSize: originalTotalSize,
        reduction: (originalTotalSize - size) / originalTotalSize,
      });

      setState("done");
    } catch (e) {
      console.error("Merge failed:", e);
      if (e.message === "Rate limit exceeded") {
        if (window.gtag) {
          window.gtag("event", "limit_reached", {
            stage: "hit",
            context: "merge",
          });
        }
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
    [isFocused, isDragAccept, isDragReject]
  );

  const isProcessing = state === "merging";

  return (
    <>
      {state !== "done" && (
        <div className="container app-mb-5">
          <div {...getRootProps({ style })}>
            <input {...getInputProps()} />
            <p className="app-py-5 app-my-5">
              {t("merge.dropzone")}
            </p>
          </div>
        </div>
      )}

      {files.length > 0 && state !== "done" && (
        <div className="app-mt-4">
          <p className="app-text-sm app-text-gray-600 app-mb-2 font-dm">
            {t("merge.dragHint")}
          </p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              draggable={!isProcessing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`app-flex app-flex-row app-items-center font-dm app-rounded app-border-2 app-border-purple-900 app-px-3 app-py-2 app-my-2 app-gap-2 ${
                !isProcessing ? "app-cursor-grab hover:app-bg-purple-50" : ""
              } ${draggedIndex === index ? "app-opacity-50" : ""}`}
            >
              <span className="app-text-purple-900 app-font-bold app-w-6 app-shrink-0">
                {index + 1}
              </span>
              <span className="font-dm app-truncate app-min-w-0 app-flex-1">
                {file.name}
              </span>
              <span className="font-dm app-text-sm app-text-gray-600 app-shrink-0">
                {(file.size / 1048576).toFixed(2)} MB
              </span>
              {!isProcessing && (
                <div className="app-flex app-flex-col app-shrink-0">
                  <button
                    onClick={() => moveFile(index, index - 1)}
                    disabled={index === 0}
                    className={`app-p-0.5 app-transition-colors ${index === 0 ? "app-text-gray-300" : "app-text-gray-500 hover:app-text-purple-900"}`}
                    aria-label={t("merge.moveUp")}
                  >
                    <svg className="app-w-4 app-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveFile(index, index + 1)}
                    disabled={index === files.length - 1}
                    className={`app-p-0.5 app-transition-colors ${index === files.length - 1 ? "app-text-gray-300" : "app-text-gray-500 hover:app-text-purple-900"}`}
                    aria-label={t("merge.moveDown")}
                  >
                    <svg className="app-w-4 app-h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
              {!isProcessing && (
                <button
                  onClick={() => removeFile(index)}
                  className="app-text-gray-400 hover:app-text-red-600 app-p-1 app-transition-colors app-shrink-0"
                  aria-label={t("common.removeFile")}
                >
                  <svg className="app-w-5 app-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
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
            <span className="font-dm app-text-sm">
              {t("merge.compressOption")}
            </span>
          </label>
          <button
            className="app-w-full font-dm app-text-purple-100 app-bg-purple-900 app-text-white app-py-3 app-px-4 app-rounded focus:app-outline-none focus:app-shadow-outline app-transform app-transition app-duration-500 app-ease-out"
            type="button"
            disabled={isProcessing}
            onClick={launchMerge}
          >
            {isProcessing ? (
              <span className="app-flex app-items-center app-justify-center app-gap-2">
                <LoadingButton /> {t("merge.processingButton")}
              </span>
            ) : (
              t("merge.button", { count: files.length })
            )}
          </button>
        </div>
      )}

      {files.length === 1 && state === "selection" && (
        <p className="app-text-sm app-text-gray-500 app-mt-4 font-dm app-text-center">
          {t("merge.atLeast2")}
        </p>
      )}

      {state === "done" && result && (
        <div className="app-mt-4">
          <a
            className="shrink-0 app-transform app-transition app-duration-500 app-ease-out app-scale-0"
            style={{ animation: "popIn 0.5s forwards" }}
            download={result.downloadName}
            href={result.pdfURL}
          >
            <div className="app-flex app-flex-row app-items-center app-justify-between app-my-1 app-p-3 app-border-2 app-border-purple-900 hover:app-bg-white app-rounded-lg">
              <div className="app-text-sm app-truncate font-dm app-min-w-0 app-flex-1 app-mr-3">
                {result.downloadName}
              </div>
              <div className="app-flex app-flex-row app-min-w-24 app-justify-end app-items-center app-shrink-0">
                <div className="app-text-xs font-dm app-mr-2 app-text-right">
                  <div>{(result.size / 1048576).toFixed(2)} MB</div>
                  {result.reduction > 0 && (
                    <div>{t("compress.lessLabel", { percent: (result.reduction * 100).toFixed(0) })}</div>
                  )}
                </div>
                <img className="app-max-h-6 !m-0" src="/cloud.svg" />
              </div>
            </div>
          </a>
          <div className="app-mt-4 app-text-center">
            <button
              onClick={reset}
              className="app-text-purple-900 hover:app-underline font-dm"
            >
              {t("merge.mergeMore")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default MergeDropZone;
