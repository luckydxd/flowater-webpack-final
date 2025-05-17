import { openDB } from "idb";

const DB_NAME = "story-db";
const STORE_NAME = "stories";
const DB_VERSION = 1;

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: "id" });
    }
  },
});

const StoryIDB = {
  async getAllStories() {
    return (await dbPromise).getAll(STORE_NAME);
  },

  async saveStories(stories) {
    const db = await dbPromise;
    const tx = db.transaction(STORE_NAME, "readwrite");
    for (const story of stories) {
      tx.store.put(story);
    }
    return tx.done;
  },

  async deleteStory(id) {
    return (await dbPromise).delete(STORE_NAME, id);
  },

  async clearAll() {
    return (await dbPromise).clear(STORE_NAME);
  },
};

export default StoryIDB;
