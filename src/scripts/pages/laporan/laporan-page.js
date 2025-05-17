import LaporanPresenter from "./laporan-presenter";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default class LaporanPage {
  constructor() {
    this.storiesContainer = null;
    this.map = null;
  }

  async render() {
    const container = document.createElement("div");
    container.innerHTML = `
    <main id="mainContent" tabindex="-1">
      <section>
        <div class="reports-list__map__container">
          <div id="map" class="reports-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>
      <br>
      <section class="container">
      <button id="clear-data-btn" class="cta-button danger">Hapus Data Lokal</button>

        <h1 style="text-align: center; margin-top:10px;">Laporan Pengguna</h1>
        <div id="stories-list" class="stories-grid"></div>
      </section>
      </main>
    `;
    return container;
  }

  async afterRender() {
    const clearBtn = document.getElementById("clear-data-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", async () => {
        await import("../../data/story-idb").then((mod) =>
          mod.default.clearAll()
        );
        alert("Data lokal dihapus.");
      });
    }

    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", (e) => {
        e.preventDefault();
        const focusTarget =
          document.getElementById("stories-list") ||
          document.querySelector("main");
        if (focusTarget) {
          focusTarget.setAttribute("tabindex", "-1");
          focusTarget.focus();
        }
      });
    }
    await this.initialMap();
  }

  async initialMap() {
    this.map = L.map("map", {
      center: [-6.914864, 107.608238],
      scrollWheelZoom: false,
      zoom: 13,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.storiesContainer = document.getElementById("stories-list");
    new LaporanPresenter(this).init();
  }

  addMarkers(stories) {
    if (!this.map) return;

    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    stories.forEach((story) => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(this.map)
          .bindPopup(`
            <b>${story.name}</b><br>
            ${story.description}<br>
            <small>${new Date(story.createdAt).toLocaleString()}</small>
          `);
      }
    });

    if (stories.length > 0 && stories[0].lat && stories[0].lon) {
      this.map.setView([stories[0].lat, stories[0].lon], 13);
    }
  }

  showStories(stories) {
    if (!this.storiesContainer) return;

    if (stories.length === 0) {
      this.storiesContainer.innerHTML = `<p>Tidak ada cerita.</p>`;
      return;
    }

    this.storiesContainer.innerHTML = stories
      .map((story) => this._generateStoryCard(story))
      .join("");

    this.addMarkers(stories);
  }

  showError(message) {
    if (this.storiesContainer) {
      this.storiesContainer.innerHTML = `<p class="error">Gagal memuat stories: ${message}</p>`;
    }
  }

  _generateStoryCard(story) {
    return `
      <div class="story-card">
        <img src="${story.photoUrl}" alt="${story.name}" class="story-img"/>
        <div class="story-content">
          <div class="story-text">
            <h3>${story.name}</h3>
            <p>${story.description}</p>
            <small>${new Date(story.createdAt).toLocaleString()}</small>
            ${
              story.lat && story.lon
                ? `<p>Lokasi: ${story.lat}, ${story.lon}</p>`
                : ""
            }
          </div>
          <div class="story-actions">
            <a href="#/detail/${story.id}" class="cta-button">Lihat Detail</a>
            
          </div>
        </div>
      </div>
    `;
  }
}
