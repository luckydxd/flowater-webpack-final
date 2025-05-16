import { AuthAPI } from "../../../data/api";
import { setAuthToken } from "../../../utils/auth";
import { showLoader, hideLoader } from "../../../utils/loader";

export default class RegisterPresenter {
  constructor(view) {
    this.view = view;
    this.init();
  }

  init() {
    this.form = document.getElementById("register-form");
    this.errorElement = document.getElementById("register-error");
    this.bindEvents();
  }

  bindEvents() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleRegister();
    });
  }

  async handleRegister() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Clear previous errors
    this.clearErrors();

    // Validation
    if (!name || !email || !password) {
      this.showError("Silakan isi semua kolom");
      return;
    }

    if (password.length < 8) {
      this.showError("Password minimal 8 karakter");
      return;
    }

    try {
      showLoader(); // Menampilkan loader saat proses registrasi
      const response = await AuthAPI.register({ name, email, password });

      if (response.error) {
        this.showError(response.message);
      } else {
        this.showSuccess("Register berhasil! Mengarahkan...");
        // Redirect to login after successful registration
        setTimeout(() => {
          window.location.href = "#/login";
        }, 1500); // Delay 1.5 detik sebelum redirect
      }
    } catch (error) {
      this.showError("Registrasi gagal. Silakan coba lagi.");
      console.error("Proses Registrasi Gagal:", error);
    } finally {
      hideLoader(); // Menyembunyikan loader setelah selesai
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
