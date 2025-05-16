import DetailPresenter from "./detail-presenter.js";

export default class DetailPage {
  constructor() {
    this.presenter = new DetailPresenter(this);
  }

  async render() {
    const container = document.createElement("div");
    container.innerHTML = `
      <main id="mainContent" tabindex="-1">
        <section class="container">
          <h1>Detail Laporan</h1>
          <div id="story-detail" class="story-detail"></div>
        </section>
      </main>
    `;
    return container;
  }

  async afterRender() {
    const hash = window.location.hash;
    const id = hash.split("/")[2];
    this.presenter.handleSkipLink();
    await this.presenter.loadStoryDetail(id);
  }

  showStoryDetail(story) {
    const detailContainer = document.getElementById("story-detail");
    detailContainer.innerHTML = `
      <div class="story-card">
        <img src="${story.photoUrl}" alt="${story.name}" class="story-img"/>
        <div class="story-content">
          <h2>${story.name}</h2>
          <p>${story.description}</p>
          <small>Dibuat pada: ${new Date(
            story.createdAt
          ).toLocaleString()}</small>
          ${
            story.lat && story.lon
              ? `<p>Lokasi: ${story.lat}, ${story.lon}</p>`
              : ""
          }
        </div>
      </div>
    `;
  }

  showError(message) {
    const detailContainer = document.getElementById("story-detail");
    detailContainer.innerHTML = `<p class="error">Gagal memuat detail: ${message}</p>`;
  }
}
