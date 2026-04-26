import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
// Assuming MyDropzone is a component you have created or imported
import DropZone from "./FileDropBox.jsx";
import "./Commercial.css";
import useAuth from "./useAuth.jsx";
import USPS from "./USPS.jsx";
import useLimitPaywall from "./useLimitPaywall.jsx";

function Commercial({ children }) {
  const { t } = useTranslation();
  const { refreshAuth, loading, user } = useAuth();
  const { onLimitReached, paywall } = useLimitPaywall("compress");

  useEffect(() => refreshAuth, []);

  const hasChildren = React.Children.count(children) > 0;

  return (
    <>
      <div className="app-w-full app-flex app-flex-col app-text-black">
        {/* Top Navigation Bar */}
        {/*<nav className="app-bg-purple-900 app-shadow">*/}
        {/*  <div className="max-w-9xl app-mx-auto app-px-4 sm:app-px-6 lg:app-px-8">*/}
        {/*    <div className="app-flex app-justify-between app-h-16">*/}
        {/*      /!* Company Title *!/*/}
        {/*      <div className="app-flex-shrink-0 app-flex app-items-center">*/}
        {/*        <a*/}
        {/*          href="/"*/}
        {/*          className="app-text-lg app-text-purple-100 hover:app-text-white app-font-medium font-dm app-flex-row app-flex app-justify-center app-items-center"*/}
        {/*        >*/}
        {/*          <img*/}
        {/*            src="/pdf.png"*/}
        {/*            alt="SaferPDF"*/}
        {/*            className="app-h-5 app-w-5 app-mr-2"*/}
        {/*          />*/}
        {/*          SaferPDF*/}
        {/*        </a>*/}
        {/*      </div>*/}
        {/*      /!* Navigation Items *!/*/}
        {/*      <div className="app-flex">*/}
        {/*        <div className="app-flex-shrink-0 app-flex app-items-center app-space-x-5">*/}
        {/*          /!* Navigation Item: Pricing *!/*/}
        {/*          <a*/}
        {/*            href="/"*/}
        {/*            className="app-text-lg app-text-purple-100 hover:app-text-white app-font-medium font-dm"*/}
        {/*          >*/}
        {/*            Compress*/}
        {/*          </a>*/}
        {/*          <a*/}
        {/*            href="/pricing"*/}
        {/*            className="app-text-lg app-text-purple-100 hover:app-text-white app-font-medium font-dm"*/}
        {/*          >*/}
        {/*            Pricing*/}
        {/*          </a>*/}
        {/*          <a*/}
        {/*            href="/blog"*/}
        {/*            className="app-text-lg app-text-purple-100 hover:app-text-white app-font-medium font-dm"*/}
        {/*          >*/}
        {/*            Blog*/}
        {/*          </a>*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*</nav>*/}

        {/* Main Content */}
        <div className="app-bg-purple-100 app-w-full app-flex-grow app-flex app-flex-col app-items-center app-justify-center app-p-4">
          {!hasChildren && !loading && (
            <>
              <h1 className="app-text-center text-blue app-font-bold app-text-4xl app-mb-4 font-raleway">
                {t("compress.title")}
              </h1>
              <p className="app-max-w-2xl app-text-center app-text-lg app-mb-6 app-font-sans ">
                {t("compress.subtitle")}
                <br />
                <br />
                {t("compress.subtitle2")}
              </p>
              <h2 className="app-text-center text-blue app-font-bold app-text-2xl app-mb-4 font-raleway">
                {t("compress.tagline")}
              </h2>
              <div className="app-w-full app-max-w-md">
                <DropZone onLimitReached={onLimitReached} user={user} />
              </div>
              <div className="app-mt-8 app-text-center">
                <a
                  href="/merge"
                  className="app-text-purple-900 hover:app-underline font-dm"
                >
                  {t("compress.switchToMerge")}
                </a>
              </div>
              <USPS />
            </>
          )}

          {loading && <p>{t("common.loading")}</p>}

          {!loading && <div className={"app-w-full"}>{children}</div>}
        </div>

        {/*<footer className="app-bg-white app-w-full app-flex app-items-center app-justify-center	">*/}
        {/*  <div className=" app-py-4 app-text-center app-flex app-space-x-4">*/}
        {/*    <a*/}
        {/*      href="/legal/general_terms_of_use.html"*/}
        {/*      target={"_blank"}*/}
        {/*      className="hover:app-underline app-text-black font-dm"*/}
        {/*      rel="noopener noreferrer"*/}
        {/*    >*/}
        {/*      Terms of use*/}
        {/*    </a>*/}
        {/*    <a*/}
        {/*      href="/legal/saas_terms_of_use.html"*/}
        {/*      target={"_blank"}*/}
        {/*      className="hover:app-underline app-text-black font-dm"*/}
        {/*      rel="noopener noreferrer"*/}
        {/*    >*/}
        {/*      SAAS Terms of use*/}
        {/*    </a>*/}
        {/*    <a*/}
        {/*      href="/legal/privacy_policy.html"*/}
        {/*      target={"_blank"}*/}
        {/*      className="hover:app-underline app-text-black font-dm"*/}
        {/*      rel="noopener noreferrer"*/}
        {/*    >*/}
        {/*      Privacy Policy*/}
        {/*    </a>*/}
        {/*    <a*/}
        {/*      href="https://github.com/laurentmmeyer/ghostscript-pdf-compress.wasm"*/}
        {/*      target={"_blank"}*/}
        {/*      className="hover:app-underline app-text-black font-dm"*/}
        {/*      rel="noopener noreferrer"*/}
        {/*    >*/}
        {/*      Source Code*/}
        {/*    </a>*/}
        {/*  </div>*/}
        {/*</footer>*/}
        {paywall}
      </div>
    </>
  );
}

export default Commercial;
