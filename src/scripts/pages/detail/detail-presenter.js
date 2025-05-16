import { StoryAPI } from "../../data/api";

export default class DetailPresenter {
  constructor(view) {
    this.view = view;
    this.storyAPI = StoryAPI;
  }

  handleSkipLink() {
    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", (e) => {
        e.preventDefault();
        const focusTarget = document.getElementById("mainContent");
        if (focusTarget) {
          focusTarget.setAttribute("tabindex", "-1");
          focusTarget.focus();
        }
      });
    }
  }

  async loadStoryDetail(id) {
    try {
      const { story } = await this.storyAPI.getStoryDetail(id);
      this.view.showStoryDetail({
        name: story.name,
        description: story.description,
        photoUrl: story.photoUrl,
        createdAt: story.createdAt,
        lat: story.lat,
        lon: story.lon,
      });
    } catch (error) {
      this.view.showError(error.message);
    }
  }
}
