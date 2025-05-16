// CSS imports
import "../styles/styles.css";

import App from "./pages/app";

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });
  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });
});

// Inisialisasi halaman login
if (document.getElementById("login-form")) {
  const loginPage = new LoginPage();
  await loginPage.render();
  await loginPage.afterRender();
  new LoginPresenter(loginPage);
}

// Inisialisasi halaman register
if (document.getElementById("register-form")) {
  const registerPage = new RegisterPage();
  await registerPage.render();
  await registerPage.afterRender();
  new RegisterPresenter(registerPage);
}

// scripts/index.js atau main.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.bundle.js")

      .then((registration) => {
        console.log("ServiceWorker registered with scope:", registration.scope);
      })
      .catch((err) => {
        console.log("ServiceWorker registration failed:", err);
      });
  });
}
