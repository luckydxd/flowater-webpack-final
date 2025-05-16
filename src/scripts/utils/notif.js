import { NotificationAPI } from "../data/api";
import CONFIG from "../config";

export function isPushSupported() {
  return "PushManager" in window;
}

export function urlBase64ToUint8Array(base64String) {
  // Tambahkan validasi input
  if (!base64String || typeof base64String !== "string") {
    throw new Error("Invalid base64 string");
  }

  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export async function subscribeUser() {
  try {
    console.log("VAPID Key:", CONFIG.VAPID_PUBLIC_KEY);
    const registration = await navigator.serviceWorker.ready;
    console.log("SW Registration ready:", registration);

    const convertedKey = urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY);
    console.log("Converted VAPID Key:", convertedKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    console.log("Subscription:", subscription);
    await NotificationAPI.subscribePushNotification(subscription);
  } catch (error) {
    console.error("subscribeUser() error:", error);
    throw error;
  }
}

export async function unsubscribeUser() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // 1. Hapus dari server
      await NotificationAPI.unsubscribePushNotification(subscription.endpoint);

      // 2. Unsubscribe dari browser
      const success = await subscription.unsubscribe();

      if (!success) {
        throw new Error("Gagal unsubscribe dari browser");
      }

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error unsubscribing:", error);
    throw error;
  }
}

export async function getCurrentSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}
