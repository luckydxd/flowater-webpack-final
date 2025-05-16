import { AuthAPI } from "../../../data/api";
import { setAuthToken } from "../../../utils/auth";
import { showLoader, hideLoader } from "../../../utils/loader";

export default class LoginPresenter {
  constructor(view) {
    this.view = view;
    this.init();
  }

  init() {
    this.form = document.getElementById("login-form");
    this.errorElement = document.getElementById("login-error");
    this.bindEvents();
  }

  bindEvents() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleLogin();
    });
  }

  async handleLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    this.clearErrors();

    if (!email || !password) {
      this.showError("Email dan password harus diisi");
      return;
    }

    try {
      showLoader();
      const response = await AuthAPI.login({ email, password });

      if (response.error) {
        this.showError(response.message);
      } else {
        setAuthToken(response.loginResult.token);
        this.showSuccess("Login berhasil! Mengarahkan...");
        setTimeout(() => {
          window.location.href = "#/";
        }, 1500);
      }
    } catch (error) {
      this.showError("Gagal login. Silakan coba lagi.");
      console.error("Login error:", error);
    } finally {
      hideLoader();
    }
  }

  showError(message) {
    this.errorElement.textContent = message;
    this.errorElement.className = "error-message error";
    this.errorElement.style.display = "block";
    this.errorElement.focus();
  }

  showSuccess(message) {
    this.errorElement.textContent = message;
    this.errorElement.className = "error-message success";
    this.errorElement.style.display = "block";
  }

  clearErrors() {
    this.errorElement.style.display = "none";
    this.errorElement.className = "error-message";
  }
}
