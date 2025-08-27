// src/routes/Shell.jsx
import { Outlet, ScrollRestoration } from "react-router-dom";
import { useEffect } from "react";

function isReload() {
  const nav = performance.getEntriesByType?.("navigation")?.[0];
  return nav ? nav.type === "reload" : false;
}

export default function Shell() {
  useEffect(() => {
    if (!("scrollRestoration" in history)) return;

    if (isReload()) {
      const prev = history.scrollRestoration; // usually "auto"
      history.scrollRestoration = "manual";   // disable only for this reload

      // After first paint, force top, then restore auto so back/forward works.
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        history.scrollRestoration = prev || "auto";
      });

      // Safety: on unmount, put it back.
      return () => { history.scrollRestoration = prev || "auto"; };
    }
  }, []);

  return (
    <>
      {/* Keep RR's restoration so POP (back/forward) still restores positions */}
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
