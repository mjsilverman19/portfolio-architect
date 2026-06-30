import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Height reporting for iframe embedding (Willow Wealth blog).
// Posts the current document height to the parent whenever it changes,
// so an embedding iframe can resize to fit each screen with no scrollbar.
(function reportHeight() {
  if (window.parent === window) return;
  var last = 0;
  function send() {
    var h = Math.ceil(document.documentElement.getBoundingClientRect().height);
    if (h && h !== last) {
      last = h;
      window.parent.postMessage({ type: "pa-height", height: h }, "*");
    }
  }
  var ro = new ResizeObserver(send);
  ro.observe(document.documentElement);
  window.addEventListener("load", send);
  window.addEventListener("resize", send);
  // Also poll briefly to catch async font/image layout shifts and screen swaps.
  var ticks = 0;
  var iv = setInterval(function () {
    send();
    if (++ticks > 40) clearInterval(iv);
  }, 250);
  // Parent can request height on demand (e.g. after it becomes visible).
  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "pa-request-height") { last = 0; send(); }
  });
  send();
})();
