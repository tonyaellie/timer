"use client";

import { useEffect } from "react";

export const SWInstaller = () => {
  useEffect(() => {
    // register service worker
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => console.log("scope is: ", registration.scope));
    }
    // request permission for notifications
    if ("Notification" in window) {
      void Notification.requestPermission().then((result) => {
        if (result === "granted") {
          console.log("Notification permission granted");
        }
      });
    }
  }, []);
  return null;
};
