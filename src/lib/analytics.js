export function trackLimitReached(stage, context) {
  window.gtag?.("event", "limit_reached", { stage, context });
}
