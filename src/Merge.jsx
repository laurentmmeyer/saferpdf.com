import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import MergeDropZone from "./MergeDropZone.jsx";
import "./Commercial.css";
import useAuth from "./useAuth.jsx";
import USPS from "./USPS.jsx";
import useLimitPaywall from "./useLimitPaywall.jsx";

function Merge({ children }) {
  const { t } = useTranslation();
  const { refreshAuth, loading, user } = useAuth();
  const { onLimitReached, paywall } = useLimitPaywall("merge");

  useEffect(() => refreshAuth, []);

  const hasChildren = React.Children.count(children) > 0;

  return (
    <>
      <div className="app-w-full app-flex app-flex-col app-text-black">
        <div className="app-bg-purple-100 app-w-full app-flex-grow app-flex app-flex-col app-items-center app-justify-center app-p-4">
          {!hasChildren && !loading && (
            <>
              <h1 className="app-text-center text-blue app-font-bold app-text-4xl app-mb-4 font-raleway">
                {t("merge.title")}
              </h1>
              <p className="app-max-w-2xl app-text-center app-text-lg app-mb-6 app-font-sans">
                {t("merge.subtitle")}
                <br />
                <br />
                {t("merge.subtitle2")}
              </p>
              <h2 className="app-text-center text-blue app-font-bold app-text-2xl app-mb-4 font-raleway">
                {t("merge.tagline")}
              </h2>
              <div className="app-w-full app-max-w-md">
                <MergeDropZone onLimitReached={onLimitReached} user={user} />
              </div>
              <div className="app-mt-8 app-text-center">
                <a
                  href="/"
                  className="app-text-purple-900 hover:app-underline font-dm"
                >
                  {t("merge.switchToCompress")}
                </a>
              </div>
              <USPS />
            </>
          )}

          {loading && <p>{t("common.loading")}</p>}

          {!loading && <div className="app-w-full">{children}</div>}
        </div>

        {paywall}
      </div>
    </>
  );
}

export default Merge;
