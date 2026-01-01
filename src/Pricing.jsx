import React, { useEffect, useRef } from "react";
import useAuth from "./useAuth.jsx";

const StripePricingTable = ({
  pricingTableId,
  publishableKey,
  clientReferenceId,
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
      ></stripe-pricing-table>
    </div>
  );
};

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const STRIPE_CONFIG = isLocalhost
  ? {
      pricingTableId: "prctbl_1P31VHCxnjVEpDZGumK9rKs5",
      publishableKey: "pk_test_51OzCTZCxnjVEpDZG3BxYX3vubGYC45uiV57CJXFPiy8u40qUkieV3HqllUt3FooSYkjRW0GjRT2nggyf6DKWDVAg00U8TywKVs",
    }
  : {
      pricingTableId: "prctbl_1PAA26CxnjVEpDZGlbPXFMpV",
      publishableKey: "pk_live_51OzCTZCxnjVEpDZGwQkgt12R1VAhVCAzA108Qi2CzSyK58ZGRtJKuU7VFmshqv5WDn3Md61nqASitEJO5dLmTNEu00m7ZkSGmT",
    };

const ConfiguredStripePricing = () => {
  const { user, loading, refreshAuth } = useAuth();
  useEffect(() => refreshAuth, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <StripePricingTable
      pricingTableId={STRIPE_CONFIG.pricingTableId}
      publishableKey={STRIPE_CONFIG.publishableKey}
      clientReferenceId={user.firebaseUser.uid}
    />
  );
};

export default ConfiguredStripePricing;
