import RegisterPresenter from "./register-presenter";

export default class RegisterPage {
  async render() {
    const container = document.createElement("div");
    container.innerHTML = `
      <main id="mainContent">
        <a href="#mainContent" class="skip-link">Skip to content</a>
        <article class="auth-container" aria-labelledby="registerHeading">
          <h1 id="registerHeading" style="text-align:center; margin-bottom:5px;" >Daftar</h1>
          <form id="register-form" aria-label="Registration form">
            <div class="form-group">
              <label for="name">Nama Lengkap</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required
                aria-required="true"
                autocomplete="name"
                placeholder="Masukkan nama lengkap anda"
              >
            </div>
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
                autocomplete="new-password"
                placeholder="Masukkan password anda"
                aria-describedby="passwordHelp"
              >
              <small id="passwordHelp" class="help-text">Minimum 8 karakter</small>
            </div>
            <div id="register-error" class="error-message" role="alert" aria-live="assertive" style="display: none;"></div>
            <button type="submit" class="btn">Daftar</button>
          </form>
          <p>Sudah memiliki akun? <a href="#/login">Masuk</a></p>
        </article>
      </main>
    `;
    return container;
  }

  async afterRender() {
    const skipLink = document.querySelector(".skip-link");
    skipLink.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("name").focus();
    });
    new RegisterPresenter(this);
  }
}
