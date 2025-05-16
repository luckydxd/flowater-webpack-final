import AddStoryPresenter from "./add-laporan-presenter";

export default class AddStoryPage {
  constructor() {
    this.presenter = null;
    this.container = null;
    this.isFirstRender = true;
  }

  async render() {
    this.container = document.createElement("div");
    this.container.innerHTML = `
    <main id="mainContent" tabindex="-1">
      <section class="container" aria-labelledby="form-title">
        <h1 id="form-title" style="text-align: center;">Tambah Laporan Baru</h1>
        
        <form id="story-form" class="story-form" enctype="multipart/form-data" aria-describedby="form-instructions">   
          <div role="alert" id="error-message" class="error-message" hidden></div>
          
          <!-- Deskripsi -->
          <div class="form-group">
            <label for="description" class="form-label">
              Deskripsi Laporan <span class="required">*</span>
            </label>
            <textarea 
              id="description" 
              class="form-input" 
              required
              aria-required="true"
              placeholder="Masukkan deskripsi laporan Anda"
              rows="5"
            ></textarea>
            <div id="description-help" class="form-help">Maksimal 500 karakter</div>
          </div>
          
          <!-- Unggah Foto -->
          <div class="form-group">
            <fieldset class="photo-upload">
              <legend>Unggah Foto</legend>
              
              <div class="photo-options">
                <div class="photo-option">
                  <label for="photo" class="file-upload-label">
                    <span id="file-name" class="file-name">Belum ada file dipilih</span>
                    <input type="file" id="photo" accept="image/*" capture="environment">
                  </label>
                </div>
                
                <div class="photo-or">atau</div>
                <div class="photo-option">
                <button type="button" id="open-camera" class="camera-button">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor"/>
                    <path d="M20 4H16.83L15.59 2.65C15.22 2.24 14.68 2 14.12 2H9.88C9.32 2 8.78 2.24 8.4 2.65L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z" fill="currentColor"/>
                  </svg>
                  Ambil Foto
                </button>
              </div>
                  <select id="camera-select" class="camera-select" aria-label="Pilih kamera">
                    <option value="">Pilih Kamera...</option>
                  </select>
                </div>
              </div>
              
              <div id="camera-container" hidden>
                <video id="camera-preview" width="300" height="200" style="display: block; margin: 0 auto; border: 1px solid gray;" playsinline></video>
                <div class="camera-controls">
                  <button type="button" id="capture-photo">Ambil Foto</button>
                  <button type="button" id="close-camera">Tutup Kamera</button>
                </div>
              </div>
              
              <canvas id="photo-canvas" hidden></canvas>
              <img id="photo-preview" class="photo-preview" hidden>
            </fieldset>
          </div>
          
          <!-- Peta dan Lokasi -->
          <div class="form-group">
            <div class="location-fieldset">
              <legend class="form-label">Lokasi (Opsional)</legend>
              
              <div id="map" class="location-map" tabindex="0" aria-label="Peta untuk memilih lokasi laporan"></div>
              
              <div class="location-controls">
                <button 
                  type="button" 
                  id="get-location" 
                  class="location-button"
                  aria-label="Gunakan lokasi saat ini"
                >
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                  </svg>
                  Gunakan Lokasi Saat Ini
                </button>
                
                <button 
                  type="button" 
                  id="clear-location" 
                  class="location-button secondary"
                  aria-label="Hapus lokasi yang dipilih"
                >
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                  Hapus Lokasi
                </button>
              </div>
              
              <div class="location-coordinates">
                <label for="lat" class="coordinate-label">Latitude:</label>
                <input 
                  type="text" 
                  id="lat" 
                  class="coordinate-input"
                  step="any"
                  aria-label="Latitude"
                  placeholder="-6.123456"
                >
                
                <label for="lon" class="coordinate-label">Longitude:</label>
                <input 
                  type="text" 
                  id="lon" 
                  class="coordinate-input"
                  step="any"
                  aria-label="Longitude"
                  placeholder="106.123456"
                >
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" style="border: none;" class="cta-button">
              Kirim Laporan
            </button>
            <a href="#/" class="cta-button secondary">Batal</a>
          </div>
        </form>
      </section>
</main>

    `;

    return this.container;
  }

  async afterRender() {
    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", (e) => {
        e.preventDefault();
        const focusTarget =
          document.getElementById("description") ||
          document.querySelector("main");
        if (focusTarget) {
          focusTarget.setAttribute("tabindex", "-1");
          focusTarget.focus();
        }
      });
    }

    if (this.isFirstRender) {
      this.presenter = new AddStoryPresenter(this);
      await this.presenter.init();
      this.isFirstRender = false;
    } else {
      await this.presenter.onPageRevisited();
    }
  }

  showError(message) {
    const errorElement = this.container.querySelector("#error-message");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.hidden = false;
      errorElement.focus();
    }
  }

  clearError() {
    const errorElement = this.container.querySelector("#error-message");
    if (errorElement) {
      errorElement.hidden = true;
      errorElement.textContent = "";
    }
  }
}
