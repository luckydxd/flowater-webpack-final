export default class HomePage {
  async render() {
    const container = document.createElement("div");
    container.innerHTML = `
      <section class="hero">
        <div class="hero-content">
          <h1 class="hero-title">Sharing stories pengguna Flowater</h1>
          <p class="hero-subtitle">(Komplen atau Laporan)</p>
          <a href="#/addLaporan" class="hero-button">Buat Laporan Sekarang</a>
        </div>
      </section>
    `;
    return container;
  }

  async afterRender() {
    // You can add any interactive functionality here
  }
}
