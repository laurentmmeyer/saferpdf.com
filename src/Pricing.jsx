import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import useAuth from "./useAuth.jsx";

const StripePricingTable = ({
  pricingTableId,
  publishableKey,
  clientReferenceId,
  locale,
}) => {
  const pricingTableRef = useRef(null); // Reference to the container where the pricing table will be injected

  useEffect(() => {
    // Function to dynamically load the Stripe Pricing Table script
    const loadStripePricingTable = () => {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/pricing-table.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        // Script has loaded, but we need to wait until the component is mounted
        // to instantiate the pricing table, which is done using the ref in the JSX
      };

      script.onerror = () => {
        console.error("Stripe Pricing Table script failed to load");
      };
    };

    // Load the script when the component mounts
    loadStripePricingTable();
  }, []);

  return (
    <div ref={pricingTableRef}>
      {/* The Stripe Pricing Table will be attached to this div */}
      <stripe-pricing-table
        pricing-table-id={pricingTableId}
        publishable-key={publishableKey}
        client-reference-id={clientReferenceId}
        locale={locale}
      ></stripe-pricing-table>
    </div>
  );
};

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const STRIPE_CONFIG = isLocalhost
  ? {
      pricingTableIds: {
        en: "prctbl_1P31VHCxnjVEpDZGumK9rKs5",
      },
      publishableKey: "pk_test_51OzCTZCxnjVEpDZG3BxYX3vubGYC45uiV57CJXFPiy8u40qUkieV3HqllUt3FooSYkjRW0GjRT2nggyf6DKWDVAg00U8TywKVs",
    }
  : {
      pricingTableIds: {
        en: "prctbl_1PAA26CxnjVEpDZGlbPXFMpV",
        fr: "prctbl_1TO0f9CxnjVEpDZGAlLyW27d",
        de: "prctbl_1TO0ViCxnjVEpDZGHwXpIxIg",
      },
      publishableKey: "pk_live_51OzCTZCxnjVEpDZGwQkgt12R1VAhVCAzA108Qi2CzSyK58ZGRtJKuU7VFmshqv5WDn3Md61nqASitEJO5dLmTNEu00m7ZkSGmT",
    };

const ConfiguredStripePricing = () => {
  const { t, i18n } = useTranslation();
  const { user, loading, refreshAuth } = useAuth();
  useEffect(() => refreshAuth, []);

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  const locale = i18n.resolvedLanguage?.split("-")[0] || "en";
  const pricingTableId =
    STRIPE_CONFIG.pricingTableIds[locale] || STRIPE_CONFIG.pricingTableIds.en;

  return (
    <StripePricingTable
      pricingTableId={pricingTableId}
      publishableKey={STRIPE_CONFIG.publishableKey}
      clientReferenceId={user.firebaseUser.uid}
      locale={locale}
    />
  );
};

export default ConfiguredStripePricing;
