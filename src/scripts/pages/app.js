import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import { isAuthenticated, removeAuthToken } from "../utils/auth";
import CONFIG from "../config";

import {
  isPushSupported,
  requestNotificationPermission,
  subscribeUser,
  unsubscribeUser,
  getCurrentSubscription,
} from "../utils/notif";

// Di app.js, setelah import
console.log("CONFIG:", CONFIG); // Harus menampilkan objek CONFIG
console.log("VAPID Key:", CONFIG.VAPID_PUBLIC_KEY); // Harus menampilkan key

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._handlePushNotification = this._handlePushNotification.bind(this);

    this._setupDrawer();
    this.updateAuthMenu();
    this._setupRouter();

    window.addEventListener("authChange", () => this.updateAuthMenu());
  }

  async _handlePushNotification() {
    try {
      console.log("CONFIG in handler:", CONFIG); // Debug

      if (!CONFIG?.VAPID_PUBLIC_KEY) {
        throw new Error("VAPID key tidak ditemukan di konfigurasi");
      }

      // 1. Cek dukungan browser
      if (!isPushSupported()) {
        throw new Error("Browser tidak mendukung Push Notification");
      }

      // 2. Cek izin
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        throw new Error("Izin notifikasi diperlukan");
      }

      // 3. Subscribe
      await subscribeUser();
      alert("Notifikasi berhasil diaktifkan!");
    } catch (error) {
      console.error("Error details:", {
        error: error,
        CONFIG: CONFIG, // Debug
        isPushSupported: isPushSupported(), // Debug
      });
      alert(`Error: ${error.message}`);
    }
  }

  _setupRouter() {
    const handleNavigation = async () => {
      const url = getActiveRoute();

      try {
        if (document.startViewTransition) {
          await document.startViewTransition(() => this._renderPageContent(url))
            .finished;
        } else {
          await this._renderPageContent(url);
        }
      } catch (error) {
        console.error("Navigation error:", error);
        window.location.hash = "#/";
      }
    };

    handleNavigation();
    window.addEventListener("hashchange", handleNavigation);
  }

  async _renderPageContent(url) {
    try {
      const pageResolver = routes[url];
      if (!pageResolver) {
        window.location.hash = "#/";
        return;
      }

      const page =
        typeof pageResolver === "function" ? pageResolver() : pageResolver;
      this.#content.innerHTML = "";

      const renderedContent = await page.render();
      if (renderedContent && renderedContent.style) {
        renderedContent.style.viewTransitionName = "page-content";
      }

      this.#content.appendChild(renderedContent);

      if (page.afterRender) {
        await page.afterRender();
      }

      this.updateAuthMenu();
    } catch (error) {
      window.location.hash = "#/";
    }
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  updateAuthMenu() {
    const navList = document.getElementById("nav-list");
    if (!navList) return;

    const isAuth = isAuthenticated();

    const menuItems = isAuth
      ? [
          '<li><a href="#/">Beranda</a></li>',
          '<li><a href="#/laporan">List Laporan</a></li>',
          '<li><a href="#/addLaporan">Tambah Laporan</a></li>',
          '<li><button id="notif-button" class="cta-button">Dapatkan Notifikasi!</button></li>',
          `<li><a href="#" class="cta-button">Logout</a></li>`,
        ]
      : [
          '<li><a href="#/addLaporan">Tambah Laporan</a></li>',
          '<li><a href="#/login" class="cta-button">Login</a></li>',
        ];

    navList.innerHTML = menuItems.join("");

    // Notification button

    if (isAuth) {
      const notifButton = document.getElementById("notif-button");
      notifButton.addEventListener("click", async () => {
        await this._handlePushNotification();
      });
    }

    // Logout
    if (isAuth) {
      const logoutButton = navList.querySelector(".cta-button");
      logoutButton.addEventListener("click", (e) => {
        e.preventDefault();
        removeAuthToken();
        window.dispatchEvent(new Event("authChange"));
        window.location.hash = "#/login";
      });
    }
  }

  async #setupPushNotification() {
    if (!isPushSupported()) {
      console.log("Browser tidak mendukung Push Notification");
      return;
    }

    const notificationButton = document.getElementById("notification-button");
    if (!notificationButton) return;

    const subscription = await getCurrentSubscription();

    if (subscription) {
      notificationButton.textContent = "Nonaktifkan Notifikasi";
      notificationButton.onclick = this.#handleUnsubscribe.bind(this);
    } else {
      notificationButton.textContent = "Aktifkan Notifikasi";
      notificationButton.onclick = this.#handleSubscribe.bind(this);
    }
  }

  async #handleSubscribe() {
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert("Izin notifikasi diperlukan untuk fitur ini");
        return;
      }

      await subscribeUser();
      alert("Notifikasi berhasil diaktifkan");
      this.#setupPushNotification(); // Update UI
    } catch (error) {
      alert(`Gagal mengaktifkan: ${error.message}`);
    }
  }

  async #handleUnsubscribe() {
    try {
      await unsubscribeUser();
      alert("Notifikasi berhasil dimatikan");
      this.#setupPushNotification(); // Update UI
    } catch (error) {
      alert(`Gagal mematikan: ${error.message}`);
    }
  }

  async renderPage() {
    return this._renderPageContent(getActiveRoute());
  }
}
export default App;
