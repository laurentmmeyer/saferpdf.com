import React, { useEffect, useState } from "react";
import MergeDropZone from "./MergeDropZone.jsx";
import "./Commercial.css";
import useAuth from "./useAuth.jsx";

function Merge({ children }) {
  const [pricing, setPricing] = useState(false);
  const { refreshAuth, loading, user } = useAuth();

  useEffect(() => refreshAuth, []);

  const hasChildren = React.Children.count(children) > 0;
  const onLimitReached = () => setPricing(true);
  const onClose = () => setPricing(false);

  return (
    <>
      <div className="app-w-full app-flex app-flex-col app-text-black">
        <div className="app-bg-purple-100 app-w-full app-flex-grow app-flex app-flex-col app-items-center app-justify-center app-p-4">
          {!hasChildren && !loading && (
            <>
              <h1 className="app-text-center text-blue app-font-bold app-text-4xl app-mb-4 font-raleway">
                Merge multiple PDFs into one
                <br />
                securely in your browser
              </h1>
              <p className="app-max-w-2xl app-text-center app-text-lg app-mb-6 app-font-sans">
                Combine your PDF files in any order you want. Drag and drop to
                reorder, then merge with optional compression.
                <br />
                <br />
                Your files never leave your device - everything happens locally
                using WebAssembly technology.
              </p>
              <h2 className="app-text-center text-blue app-font-bold app-text-2xl app-mb-4 font-raleway">
                Private, secure & completely offline.
              </h2>
              <div className="app-w-full app-max-w-md">
                <MergeDropZone onLimitReached={onLimitReached} user={user} />
              </div>
              <div className="app-mt-8 app-text-center">
                <a
                  href="/"
                  className="app-text-purple-900 hover:app-underline font-dm"
                >
                  Need to compress PDFs instead?
                </a>
              </div>
            </>
          )}

          {loading && <p>Loading...</p>}

          {!loading && <div className="app-w-full">{children}</div>}
        </div>

        <div
          className={`${pricing ? "" : "app-hidden"} app-fixed app-inset-0 app-bg-purple-900 app-bg-opacity-20 app-overflow-y-auto app-h-full app-w-full app-flex app-items-center app-justify-center`}
          onClick={onClose}
        >
          <div className="app-relative app-mx-auto app-p-3 app-border app-w-96 app-shadow-lg app-rounded-md app-bg-white">
            <div className="app-text-right">
              <button
                onClick={onClose}
                className="app-text-gray-400 app-bg-transparent hover:app-bg-gray-200 hover:app-text-gray-900 app-rounded-lg app-text-sm app-p-1.5 app-ml-auto app-inline-flex app-items-center"
              >
                <svg className="app-w-5 app-h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="app-text-center app-p-3 app-flex-auto app-justify-center">
              <p className="font-dm app-text-gray-900 app-text-lg app-leading-relaxed">
                You're loving our product! You cannot convert more than 10
                documents in 24 hours. For more, you need our Pro model.
              </p>
            </div>
            <div className="app-p-3 app-mt-2 app-text-center app-space-x-4 md:app-block">
              <a
                href="/pricing"
                className="app-mb-2 md:app-mb-0 app-bg-purple-900 app-px-5 app-py-2 app-text-sm app-shadow-sm app-font-medium app-tracking-wider app-text-white app-rounded-full hover:app-shadow-lg hover:app-bg-purple-800"
                role="button"
              >
                Go to Pricing
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Merge;
