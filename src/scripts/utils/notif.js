import CONFIG from "../config";
import { getAuthToken } from "./auth";

// Helper untuk konversi VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Cek dukungan browser
export function isPushSupported() {
  return "PushManager" in window && "serviceWorker" in navigator;
}

// Meminta izin notifikasi
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
}

// Dapatkan subscription saat ini
export async function getCurrentSubscription() {
  if (!isPushSupported()) return null;

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

// Subscribe user ke push notification
export async function subscribeUser() {
  try {
    // Validasi environment
    if (!isPushSupported()) {
      throw new Error("Browser tidak mendukung Push Notification");
    }

    // Dapatkan registration
    const registration = await navigator.serviceWorker.ready;

    // Cek subscription yang ada
    let subscription = await registration.pushManager.getSubscription();

    // Jika sudah subscribe, gunakan yang ada
    if (subscription) {
      return subscription;
    }

    // Buat subscription baru
    const convertedVapidKey = urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });

    // Validasi subscription
    if (!subscription || !subscription.endpoint) {
      throw new Error("Gagal membuat subscription");
    }

    // Kirim ke server
    await sendSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error("Error subscribing user:", error);
    throw error;
  }
}

// Helper untuk ekstrak keys dari FCM
async function extractKeysFromFCM(subscription) {
  try {
    // Untuk FCM, kita mungkin perlu mengurai endpoint untuk mendapatkan keys
    const endpointParts = subscription.endpoint.split("/");
    const subscriptionId = endpointParts[endpointParts.length - 1];

    return {
      p256dh: subscriptionId,
      auth: crypto.getRandomValues(new Uint8Array(16)).join(""),
    };
  } catch (error) {
    console.error("Failed to extract keys from FCM:", error);
    return null;
  }
}

// Unsubscribe user dari push notification
export async function unsubscribeUser() {
  try {
    // 1. Dapatkan subscription saat ini
    const subscription = await getCurrentSubscription();

    if (!subscription) {
      console.log("No active subscription found");
      return true;
    }

    // 2. Unsubscribe dari push service
    const successfullyUnsubscribed = await subscription.unsubscribe();

    if (successfullyUnsubscribed) {
      // 3. Hapus dari server
      await deleteSubscriptionFromServer(subscription.endpoint);

      // 4. Hapus dari localStorage
      localStorage.removeItem("pushSubscription");

      return true;
    }

    return false;
  } catch (error) {
    console.error("Error unsubscribing user:", error);
    throw error;
  }
}

// Helper: Kirim subscription ke server
async function sendSubscriptionToServer(subscription) {
  try {
    // Validasi subscription dan keys
    if (!subscription || !subscription.endpoint) {
      throw new Error("Invalid subscription object");
    }

    // Pastikan keys ada, jika tidak coba ekstrak dari options
    const keys = subscription.keys || {};
    const p256dh = keys.p256dh || extractP256dhKey(subscription);
    const auth = keys.auth || extractAuthKey(subscription);

    if (!p256dh || !auth) {
      throw new Error("Missing required subscription keys");
    }

    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: p256dh,
          auth: auth,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to send subscription");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending subscription:", {
      error: error.message,
      subscription: subscription,
    });
    throw error;
  }
}

// Helper functions untuk ekstrak keys jika tidak tersedia langsung
function extractP256dhKey(subscription) {
  // Coba ekstrak dari endpoint FCM
  if (subscription.endpoint.includes("fcm.googleapis.com")) {
    const endpointParts = subscription.endpoint.split("/");
    return endpointParts[endpointParts.length - 1];
  }
  return null;
}

function extractAuthKey(subscription) {
  // Generate random auth token jika tidak tersedia
  return crypto.getRandomValues(new Uint8Array(16)).join("");
}
// Helper: Hapus subscription dari server
async function deleteSubscriptionFromServer(endpoint) {
  try {
    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete subscription");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting subscription:", error);
    throw error;
  }
}

// Di akhir notif.js
export async function initializePushNotifications() {
  try {
    if (!isPushSupported()) {
      console.log("Push notifications not supported");
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Cek dan perbaiki keys jika perlu
      if (!subscription.keys) {
        subscription = await recreateSubscription(registration);
      }
      await sendSubscriptionToServer(subscription);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error initializing push notifications:", error);
    return false;
  }
}

async function recreateSubscription(registration) {
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    await existingSubscription.unsubscribe(); // Perbaikan di sini
  }
  const convertedVapidKey = urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY);
  return await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: convertedVapidKey,
  });
}
