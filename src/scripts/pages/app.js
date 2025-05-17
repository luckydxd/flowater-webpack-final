import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import { isAuthenticated, removeAuthToken, getAuthToken } from "../utils/auth";
import CONFIG from "../config";
import NotFoundPage from "../pages/error/404";

import {
  isPushSupported,
  requestNotificationPermission,
  subscribeUser,
  unsubscribeUser,
  getCurrentSubscription,
  initializePushNotifications,
} from "../utils/notif";

function renderIcon(iconFn, size = 20) {
  return iconFn({ size, strokeWidth: 1.5, color: "currentColor" });
}

console.log("Current permission:", Notification.permission);
console.log("CONFIG:", CONFIG);
console.log("VAPID Key:", CONFIG.VAPID_PUBLIC_KEY);

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this._setupRouter = this._setupRouter.bind(this);
    this._renderPageContent = this._renderPageContent.bind(this);
    this._deferredPrompt = null;

    this._setupDrawer();
    this.updateAuthMenu();

    this._setupRouter();
    this._initializePushNotifications();
    this._setupInstallPrompt();

    window.addEventListener("authChange", () => this.updateAuthMenu());
  }

  _setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e) => {
      // Mencegah banner default ditampilkan
      e.preventDefault();

      // Simpan event supaya bisa dipanggil nanti
      this._deferredPrompt = e;

      // Cegah duplikat tombol
      if (!document.getElementById("install-button")) {
        this._showInstallButton();
      }
    });
  }

  _showInstallButton() {
    const installButton = document.createElement("button");
    installButton.id = "install-button";
    installButton.className = "install-button";
    installButton.innerHTML =
      '<i class="fas fa-download"></i> Install Flowater';

    installButton.addEventListener("click", this._installApp.bind(this));
    document.body.appendChild(installButton);
  }

  async _installApp() {
    if (!this._deferredPrompt) return;

    // Tampilkan prompt
    this._deferredPrompt.prompt();

    const { outcome } = await this._deferredPrompt.userChoice;
    console.log(
      `User ${
        outcome === "accepted" ? "accepted" : "dismissed"
      } the install prompt`
    );

    // Hapus event setelah digunakan
    this._deferredPrompt = null;

    // Hapus tombol
    const button = document.getElementById("install-button");
    if (button) button.remove();
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
      // Dapatkan route yang aktif
      const routePath = getActiveRoute();

      // Resolve halaman
      const pageResolver = routes[routePath] || routes["*"]; // Gunakan 404 sebagai fallback
      const page =
        typeof pageResolver === "function" ? pageResolver() : pageResolver;

      this.#content.innerHTML = "";
      const renderedContent = await page.render();
      this.#content.appendChild(renderedContent);

      if (page.afterRender) {
        await page.afterRender();
      }
    } catch (error) {
      // Fallback ke 404 jika ada error
      const notFoundPage = new NotFoundPage();
      this.#content.innerHTML = await notFoundPage.render();
      await notFoundPage.afterRender();
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
          '<li><button id="notif-button" class="notif">Memuat Status Notifikasi...</button></li>',

          `<li><a href="#" class="cta-button">Logout</a></li>`,
        ]
      : [
          '<li><a href="#/addLaporan">Tambah Laporan</a></li>',
          '<li><a href="#/login" class="cta-button">Login</a></li>',
        ];

    navList.innerHTML = menuItems.join("");

    // Notification button

    if (isAuth) {
      this._updateNotificationButton();
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

  // ----------Notification----------

  async _initializePushNotifications() {
    try {
      const token = getAuthToken();

      if (!token || typeof token !== "string" || !token.startsWith("Bearer ")) {
        console.log(
          "Jika User belum login, maka tidak menjalankan push notification"
        );
        return;
      }

      console.log("Memulai inisialisasi push notification...");
      const success = await initializePushNotifications();

      if (!success) {
        console.log(
          "Push notification tidak diaktifkan (browser tidak support atau tidak ada subscription)"
        );
      }
    } catch (error) {
      console.error("Gagal menginisialisasi push notification:", error.message);
    }
  }

  async _handlePushNotification() {
    try {
      // Cek autentikasi
      if (!isAuthenticated()) {
        throw new Error("Anda harus login terlebih dahulu");
      }

      // Cek dukungan browser
      if (!isPushSupported()) {
        throw new Error("Browser tidak mendukung Push Notification");
      }

      // Cek izin notifikasi
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Izin notifikasi ditolak");
      }

      // Dapatkan service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe user
      const subscription = await subscribeUser();
      console.log("Subscription berhasil:", subscription);

      alert("Notifikasi berhasil diaktifkan!");
    } catch (error) {
      console.error("Error:", error);
      alert(`Gagal mengaktifkan notifikasi: ${error.message}`);
    }
  }

  async _updateNotificationButton() {
    const notifButton = document.getElementById("notif-button");
    if (!notifButton) return;

    try {
      const isSubscribed = await this._checkSubscriptionStatus();

      if (isSubscribed) {
        notifButton.textContent = "Unsubscribe Notifikasi";
        notifButton.onclick = async () => {
          await this._unsubscribeFromNotifications();
          this._updateNotificationButton();
        };
      } else {
        notifButton.textContent = "Subscribe Notifikasi";
        notifButton.onclick = async () => {
          await this._subscribeToNotifications();
          this._updateNotificationButton();
        };
      }
    } catch (error) {
      console.error("Error updating notification button:", error);
      notifButton.textContent = "Error - Coba Lagi";
      notifButton.onclick = async () => {
        await this._handlePushNotification();
        this._updateNotificationButton();
      };
    }
  }

  async _subscribeToNotifications() {
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert("Izin notifikasi diperlukan untuk fitur ini");
        return;
      }

      await subscribeUser();
      alert("Notifikasi berhasil diaktifkan");
      this.setupPushNotification(); // Update UI
    } catch (error) {
      alert(`Gagal mengaktifkan: ${error.message}`);
    }
  }

  async _unsubscribeFromNotifications() {
    try {
      await unsubscribeUser();
      alert("Notifikasi berhasil dimatikan");
      this.setupPushNotification(); // Update UI
    } catch (error) {
      alert(`Gagal mematikan: ${error.message}`);
    }
  }

  async _checkSubscriptionStatus() {
    if (!isPushSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  }

  async setupPushNotification() {
    if (!isPushSupported()) {
      console.log("Browser tidak mendukung Push Notification");
      return;
    }

    const notificationButton = document.getElementById("notification-button");
    if (!notificationButton) return;

    const subscription = await getCurrentSubscription();

    if (subscription) {
      notificationButton.textContent = "Nonaktifkan Notifikasi";
      notificationButton.onclick = this.handleUnsubscribe.bind(this);
    } else {
      notificationButton.textContent = "Aktifkan Notifikasi";
      notificationButton.onclick = this.handleSubscribe.bind(this);
    }
  }

  async handleSubscribe() {
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert("Izin notifikasi diperlukan untuk fitur ini");
        return;
      }

      await subscribeUser();
      alert("Notifikasi berhasil diaktifkan");
      this.setupPushNotification(); // Update UI
    } catch (error) {
      alert(`Gagal mengaktifkan: ${error.message}`);
    }
  }

  async handleUnsubscribe() {
    try {
      await unsubscribeUser();
      alert("Notifikasi berhasil dimatikan");
      this.setupPushNotification(); // Update UI
    } catch (error) {
      alert(`Gagal mematikan: ${error.message}`);
    }
  }

  async renderPage() {
    return this._renderPageContent(getActiveRoute());
  }
}
export default App;
