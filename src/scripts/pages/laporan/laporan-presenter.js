import { StoryAPI } from "../../data/api";
import StoryIDB from "../../data/story-idb";

export default class LaporanPresenter {
  constructor(view) {
    this.view = view;
  }

  async init() {
    try {
      const { listStory } = await this._getAllStories();

      if (!listStory || listStory.length === 0) {
        this.view.showStories([]);
        return;
      }

      await StoryIDB.saveStories(listStory); // Simpan ke IndexedDB
      this.view.showStories(listStory);
    } catch (error) {
      console.warn("Fetch failed. Try loading from IndexedDB...", error);
      const localStories = await StoryIDB.getAllStories();

      if (localStories.length > 0) {
        this.view.showStories(localStories); // Tampilkan data lokal
      } else {
        this.view.showError("Gagal memuat data, dan tidak ada data lokal.");
      }
    }
  }

  async _getAllStories() {
    try {
      const response = await StoryAPI.getAllStories();
      return response;
    } catch (error) {
      console.error("Error fetching stories:", error);
      throw error;
    }
  }
}
