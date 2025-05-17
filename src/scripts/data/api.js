import CONFIG from "../config";
import { getAuthToken } from "../utils/auth";

const ENDPOINTS = {
  ENDPOINT: `${CONFIG.BASE_URL}`,
};

export const StoryAPI = {
  async getAllStories({ page = 1, size = 12, location = 0 } = {}) {
    const response = await fetch(
      `${ENDPOINTS.ENDPOINT}/stories?page=${page}&size=${size}&location=${location}`,
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );
    return response.json();
  },

  async getStoryDetail(id) {
    const response = await fetch(`${ENDPOINTS.ENDPOINT}/stories/${id}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });
    return response.json();
  },
  async addStory(formData, token) {
    const response = await fetch(`${ENDPOINTS.ENDPOINT}/stories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    return response.json();
  },

  async addStoryGuest(formData) {
    const response = await fetch(`${ENDPOINTS.ENDPOINT}/stories/guest`, {
      method: "POST",
      body: formData,
    });
    return response.json();
  },
  async sendStoryNotification(storyId, notificationData) {
    const response = await fetch(
      `${ENDPOINTS.ENDPOINT}/stories/${storyId}/notify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationData),
      }
    );
    return response.json();
  },
};

export const AuthAPI = {
  async register({ name, email, password }) {
    const response = await fetch(`${ENDPOINTS.ENDPOINT}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });
    return response.json();
  },

  async login({ email, password }) {
    const response = await fetch(`${ENDPOINTS.ENDPOINT}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  },
};

export const NotificationAPI = {
  async subscribePushNotification(subscription) {
    const response = await fetch(
      `${ENDPOINTS.ENDPOINT}/notifications/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        }),
      }
    );
    return response.json();
  },

  async unsubscribePushNotification(endpoint) {
    const response = await fetch(
      `${ENDPOINTS.ENDPOINT}/notifications/subscribe`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ endpoint }),
      }
    );
    return response.json();
  },

  async sendStoryNotification(storyId) {
    const response = await fetch(
      `${ENDPOINTS.ENDPOINT}/stories/${storyId}/notify`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );
    return response.json();
  },
};
