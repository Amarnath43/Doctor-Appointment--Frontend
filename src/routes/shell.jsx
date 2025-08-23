// src/routes/Shell.jsx
import { Outlet, ScrollRestoration } from "react-router-dom";

export default function Shell() {
  return (
    <>
      {/* Restores scroll on back/forward, resets to top on new navigations */}
      <ScrollRestoration
        // Only change scroll when the *path* changes (ignores query/hash by default)
        getKey={(loc) => loc.pathname}
      />
      <Outlet />
    </>
  );
}
