import { StoryAPI } from "../../data/api";

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

      this.view.showStories(listStory);
    } catch (error) {
      this.view.showError(error.message);
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
