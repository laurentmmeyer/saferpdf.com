import React from "react";
import { useTranslation } from "react-i18next";

function PricingModal({ open, onClose }) {
  const { t } = useTranslation();
  return (
    <div
      className={`${open ? "" : "app-hidden"} app-fixed app-inset-0 app-bg-purple-900 app-bg-opacity-20 app-overflow-y-auto app-h-full app-w-full app-flex app-items-center app-justify-center`}
      onClick={onClose}
    >
      <div className="app-relative app-mx-auto app-p-3 app-border app-w-96 app-shadow-lg app-rounded-md app-bg-white">
        <div className="app-text-right">
          <button
            onClick={onClose}
            className="app-text-gray-400 app-bg-transparent hover:app-bg-gray-200 hover:app-text-gray-900 app-rounded-lg app-text-sm app-p-1.5 app-ml-auto app-inline-flex app-items-center"
          >
            <svg
              className="app-w-5 app-h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
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
            {t("limit.message")}
          </p>
        </div>
        <div className="app-p-3 app-mt-2 app-text-center app-space-x-4 md:app-block">
          <a
            href="/pricing"
            className="app-mb-2 md:app-mb-0 app-bg-purple-900 app-px-5 app-py-2 app-text-sm app-shadow-sm app-font-medium app-tracking-wider app-text-white app-rounded-full hover:app-shadow-lg hover:app-bg-purple-800"
            role="button"
          >
            {t("limit.goToPricing")}
          </a>
        </div>
      </div>
    </div>
  );
}

export default PricingModal;
