import React, { useState } from "react";
import PricingModal from "./PricingModal.jsx";
import { trackLimitReached } from "./lib/analytics.js";

export default function useLimitPaywall(context) {
  const [open, setOpen] = useState(false);
  const onLimitReached = () => {
    trackLimitReached("pricing_shown", context);
    setOpen(true);
  };
  const paywall = <PricingModal open={open} onClose={() => setOpen(false)} />;
  return { onLimitReached, paywall };
}
