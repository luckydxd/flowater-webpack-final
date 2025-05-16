import LoginPresenter from "./login-presenter";

export default class LoginPage {
  async render() {
    const container = document.createElement("div");
    container.innerHTML = `
<main id="mainContent" tabindex="-1">
  <article class="auth-container" aria-labelledby="loginHeading">
    <h1 id="loginHeading" style="text-align:center; margin-bottom:5px;">Masuk</h1>

    <form id="login-form" aria-label="Login form">
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          required
          aria-required="true"
          autocomplete="email"
          placeholder="Masukkan email anda"
          tabindex="0"
        >
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          required
          minlength="8"
          aria-required="true"
          autocomplete="current-password"
          placeholder="Masukkan password anda"
          tabindex="0"
        >
      </div>

      <div id="login-error" class="error-message" role="alert" aria-live="assertive" style="display: none;"></div>

      <button type="submit" class="btn" tabindex="0">Masuk</button>
    </form>

    <p>Belum memiliki akun? <a href="#/register" tabindex="0">Daftar</a></p>
  </article>
</main>

    `;
    return container;
  }

  async afterRender() {
    const skipLink = document.querySelector(".skip-link");
    skipLink.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("email").focus();
    });
    new LoginPresenter(this);
  }
}
