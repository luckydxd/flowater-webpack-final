// CSS imports
import "../styles/styles.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import App from "./pages/app";

async function initializeApp() {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });

  // Inisialisasi halaman login jika ada
  if (document.getElementById("login-form")) {
    const { default: LoginPage } = await import(
      "./pages/auth/login/login-page"
    );
    const { default: LoginPresenter } = await import(
      "./pages/auth/login/login-presenter"
    );
    const loginPage = new LoginPage();
    await loginPage.render();
    await loginPage.afterRender();
    new LoginPresenter(loginPage);
  }

  // Inisialisasi halaman register jika ada
  if (document.getElementById("register-form")) {
    const { default: RegisterPage } = await import(
      "./pages/auth/register/register-page"
    );
    const { default: RegisterPresenter } = await import(
      "./pages/auth/register/register-presenter"
    );
    const registerPage = new RegisterPage();
    await registerPage.render();
    await registerPage.afterRender();
    new RegisterPresenter(registerPage);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeApp().catch(console.error);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const isDev =
      location.hostname === "localhost" || location.hostname === "127.0.0.1";

    const swUrl = isDev
      ? "/sw.dev.js"
      : `${
          location.pathname.startsWith("/flowater-webpack-final")
            ? "/flowater-webpack-final"
            : ""
        }/sw.js`;

    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => console.log("✅ Service Worker registered:", reg.scope))
      .catch((err) =>
        console.error("❌ Service Worker registration failed:", err)
      );
  });
}
