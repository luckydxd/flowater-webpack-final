import { StoryAPI } from "../../data/api";
import { getAuthToken } from "../../utils/auth";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

export default class AddStoryPresenter {
  constructor(view) {
    this.view = view;
    this.state = {
      map: null,
      marker: null,
      photoFile: null,
      mediaStream: null,
      selectedCamera: null,
    };
  }

  async init() {
    try {
      await this._setupDOMReferences();
      await this._initializeMap();
      this._setupEventListeners();
      await this._loadCameras();
    } catch (error) {
      console.error("Presenter initialization failed:", error);
      this.view.showError("Gagal memuat halaman. Silakan coba lagi.");
    }
  }

  async _setupDOMReferences() {
    this.elements = {
      form: document.getElementById("story-form"),
      errorElement: document.getElementById("error-message"),
      photoInput: document.getElementById("photo"),
      photoPreview: document.getElementById("photo-preview"),
      cameraPreview: document.getElementById("camera-preview"),
      cameraSelect: document.getElementById("camera-select"),
      getLocationBtn: document.getElementById("get-location"),
      latInput: document.getElementById("lat"),
      lonInput: document.getElementById("lon"),
    };

    // Validasi semua elemen penting ada
    const requiredElements = ["form", "errorElement", "photoInput"];
    requiredElements.forEach((key) => {
      if (!this.elements[key]) {
        throw new Error(`Element ${key} not found`);
      }
    });
  }

  async _initializeMap() {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      throw new Error("Map container not found");
    }

    // Cek jika peta sudah ada (untuk kasus navigasi)
    if (mapContainer._leaflet_id) {
      this.state.map = L.map(mapContainer, { reuse: true });
      this.state.map.invalidateSize();
      return;
    }

    // Inisialisasi peta baru
    this.state.map = L.map(mapContainer, {
      center: [-6.914864, 107.608238],
      zoom: 13,
      tap: false, // Fix untuk mobile devices
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(this.state.map);

    // Setup event handlers
    this.state.map.on("click", (e) => {
      this._setLocation(e.latlng.lat, e.latlng.lng);
    });
  }

  _setupEventListeners() {
    // Camera events
    document.getElementById("camera-select").addEventListener("change", (e) => {
      this._switchCamera(e.target.value).catch(console.error);
    });
    document
      .getElementById("open-camera")
      .addEventListener("click", () => this._toggleCamera());
    document
      .getElementById("capture-photo")
      .addEventListener("click", () => this._capturePhoto());
    document.getElementById("close-camera").addEventListener("click", () => {
      this._stopCamera();
      document.getElementById("camera-container").hidden = true;
    });

    // Location events
    this.elements.getLocationBtn.addEventListener("click", () =>
      this._getCurrentLocation()
    );
    document
      .getElementById("clear-location")
      .addEventListener("click", () => this._clearLocation());

    // Form submission
    this.elements.form.addEventListener("submit", (e) => this._handleSubmit(e));
    this.elements.photoInput.addEventListener("change", (e) =>
      this._handleFileSelect(e)
    );
  }

  async _loadCameras() {
    try {
      // Minta izin kamera terlebih dahulu
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      tempStream.getTracks().forEach((track) => track.stop());

      // Dapatkan daftar perangkat
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.state.availableCameras = devices.filter(
        (d) => d.kind === "videoinput"
      );

      // Update dropdown
      this._updateCameraOptions();

      // Set kamera default (kamera belakang jika tersedia)
      const backCamera = this.state.availableCameras.find(
        (cam) =>
          cam.label.toLowerCase().includes("back") ||
          cam.label.toLowerCase().includes("rear")
      );

      if (backCamera) {
        this.state.selectedCamera = backCamera.deviceId;
        const select = document.getElementById("camera-select");
        select.value = backCamera.deviceId;
      }
    } catch (error) {
      console.error("Error loading cameras:", error);
      this.view.showError("Tidak dapat mengakses daftar kamera");
    }
  }

  _updateCameraOptions() {
    const select = this.elements.cameraSelect;
    select.innerHTML = '<option value="">Pilih Kamera...</option>';

    this.state.availableCameras.forEach((device) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `Kamera ${select.options.length}`;
      select.appendChild(option);
    });
  }

  async _toggleCamera() {
    // Jika kamera aktif, stop sepenuhnya
    if (this.state.mediaStream) {
      await this._stopCamera();
      document.getElementById("camera-container").hidden = true;
      return;
    }

    try {
      // Start kamera baru
      const constraints = {
        video: {
          deviceId: this.state.selectedCamera
            ? { exact: this.state.selectedCamera }
            : { facingMode: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      this.state.mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      const cameraPreview = document.getElementById("camera-preview");

      cameraPreview.srcObject = this.state.mediaStream;

      // Tunggu sampai video benar-benar ready
      await new Promise((resolve) => {
        cameraPreview.onloadedmetadata = () => {
          cameraPreview.play().then(resolve);
        };
      });

      document.getElementById("camera-container").hidden = false;
    } catch (error) {
      console.error("Camera error:", error);
      this.view.showError("Gagal memulai kamera");
      await this._stopCamera();
    }
  }

  async _switchCamera(deviceId) {
    // 1. Hentikan kamera yang aktif dengan benar
    await this._stopCamera(); // Tambahkan await

    // 2. Reset video element
    const cameraPreview = document.getElementById("camera-preview");
    cameraPreview.srcObject = null;

    if (!deviceId) {
      this.state.selectedCamera = null;
      return;
    }

    try {
      // 3. Start kamera baru dengan constraints yang tepat
      const constraints = {
        video: {
          deviceId: { exact: deviceId },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: deviceId === "environment" ? "environment" : "user", // Fallback
        },
      };

      // 4. Dapatkan stream baru
      this.state.mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      this.state.selectedCamera = deviceId;

      // 5. Attach stream ke video element
      cameraPreview.srcObject = this.state.mediaStream;

      // 6. Tunggu sampai video benar-benar siap
      await new Promise((resolve) => {
        cameraPreview.onloadedmetadata = () => {
          cameraPreview
            .play()
            .then(resolve)
            .catch((e) => {
              console.error("Video play error:", e);
              this.view.showError("Kamera tidak dapat dimulai");
            });
        };
      });

      // 7. Tampilkan container kamera
      document.getElementById("camera-container").hidden = false;
    } catch (error) {
      console.error("Gagal switch kamera:", error);
      this._stopCamera();
      this.view.showError("Gagal mengaktifkan kamera ini");

      // Reset dropdown ke pilihan sebelumnya
      document.getElementById("camera-select").value =
        this.state.selectedCamera || "";
    }
  }

  // Method stop camera yang diperbarui
  async _stopCamera() {
    if (this.state.mediaStream) {
      // Hentikan semua track secara eksplisit
      this.state.mediaStream.getTracks().forEach((track) => {
        track.stop(); // Penting: stop() setiap track
        track.enabled = false; // Nonaktifkan
      });

      // Lepaskan referensi stream
      this.state.mediaStream = null;
    }

    // Reset video element
    const cameraPreview = document.getElementById("camera-preview");
    if (cameraPreview) {
      cameraPreview.srcObject = null;
      cameraPreview.load(); // Reload video element
      cameraPreview.pause(); // Pastikan video berhenti
    }
  }

  _capturePhoto() {
    const canvas = document.getElementById("photo-canvas");
    const video = document.getElementById("camera-preview");

    // Pastikan video sedang berjalan
    if (video.paused || video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
      this.view.showError("Kamera belum siap");
      return;
    }

    // Set ukuran canvas sesuai video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Gambar frame video ke canvas
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Konversi ke blob dan tampilkan preview
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          this.view.showError("Gagal mengambil foto");
          return;
        }

        this.state.photoFile = new File([blob], `photo-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        const photoPreview = document.getElementById("photo-preview");
        photoPreview.src = URL.createObjectURL(blob);
        photoPreview.hidden = false;
        document.getElementById("file-name").textContent = "Foto dari kamera";

        // Sembunyikan kamera setelah capture
        this._stopCamera();
        document.getElementById("camera-container").hidden = true;
      },
      "image/jpeg",
      0.85
    );
  }

  _handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file.type.match("image.*")) {
      this.view.showError("File harus berupa gambar");
      return;
    }

    this.state.photoFile = file;
    this.elements.photoPreview.src = URL.createObjectURL(file);
    this.elements.photoPreview.hidden = false;
  }

  async _getCurrentLocation() {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      this._setLocation(position.coords.latitude, position.coords.longitude);
    } catch (error) {
      this.view.showError(
        `Gagal mendapatkan lokasi: ${this._getGeoError(error)}`
      );
    }
  }

  _getGeoError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Izin lokasi ditolak";
      case error.POSITION_UNAVAILABLE:
        return "Lokasi tidak tersedia";
      case error.TIMEOUT:
        return "Waktu permintaan habis";
      default:
        return "Error tidak diketahui";
    }
  }

  _setLocation(lat, lon) {
    this.elements.latInput.value = lat;
    this.elements.lonInput.value = lon;

    if (this.state.marker) {
      this.state.marker.setLatLng([lat, lon]);
    } else {
      this.state.marker = L.marker([lat, lon]).addTo(this.state.map);
    }

    this.state.map.setView([lat, lon], 15);
  }

  _clearLocation() {
    this.elements.latInput.value = "";
    this.elements.lonInput.value = "";

    if (this.state.marker) {
      this.state.map.removeLayer(this.state.marker);
      this.state.marker = null;
    }
  }

  async _handleSubmit(event) {
    event.preventDefault();

    const description = document.getElementById("description").value.trim();
    if (!description || !this.state.photoFile) {
      this.view.showError("Deskripsi dan foto harus diisi");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", this.state.photoFile);

      if (this.elements.latInput.value && this.elements.lonInput.value) {
        formData.append("lat", this.elements.latInput.value);
        formData.append("lon", this.elements.lonInput.value);
      }

      const token = getAuthToken();
      const response = token
        ? await StoryAPI.addStory(formData, token)
        : await StoryAPI.addStoryGuest(formData);

      if (response.error) throw new Error(response.message);

      alert("Laporan berhasil ditambahkan!");
      window.location.hash = "#/";
    } catch (error) {
      this.view.showError(`Gagal mengirim: ${error.message}`);
    } finally {
      this._stopCamera();
    }
  }

  // Untuk handle page revisit
  async onPageRevisit() {
    await this._setupDOMReferences();
    if (this.state.map) {
      this.state.map.invalidateSize();
    }
  }
}
