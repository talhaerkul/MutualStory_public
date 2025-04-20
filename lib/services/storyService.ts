import {
  ref,
  set,
  push,
  get,
  remove,
  update,
  query,
  orderByChild,
  equalTo,
  limitToLast,
} from "firebase/database";
import { database } from "@/lib/firebase";
import type { Story } from "@/lib/types/Story";
import { Translation } from "../types/Translation";
import { dateHelper } from "../dateHelper";
import { auth } from "../firebase";
import { TranslationUpdate } from "../types/TranslationUpdate";

const STORIES_PATH = "stories";
const TRANSLATIONS_PATH = "translations";
const FAVORITES_PATH = "favorites";

export const storyService = {
  // Hikaye ekleme
  async createStory(storyData: Omit<Story, "id" | "createdAt" | "updatedAt">) {
    try {
      const newStoryRef = push(ref(database, STORIES_PATH));
      const now = dateHelper.toISOString();

      await set(newStoryRef, {
        ...storyData,
        id: newStoryRef.key,
        createdAt: now,
        updatedAt: now,
      });

      return newStoryRef.key;
    } catch (error) {
      console.error("Error creating story:", error);
      throw error;
    }
  },

  // Hikaye ve çevirilerini birlikte oluştur
  async createStoryWithTranslations(
    storyData: Omit<Story, "id" | "createdAt" | "updatedAt">,
    translations: Omit<
      Translation,
      "id" | "original_id" | "createdAt" | "updatedAt"
    >[]
  ) {
    try {
      const storyId = await this.createStory(storyData);
      const now = dateHelper.toISOString();

      const translationPromises = translations.map((translation) => {
        const newTranslationRef = push(ref(database, TRANSLATIONS_PATH));
        return set(newTranslationRef, {
          ...translation,
          id: newTranslationRef.key,
          original_id: storyId,
          createdAt: now,
          updatedAt: now,
        });
      });

      await Promise.all(translationPromises);
      return storyId;
    } catch (error) {
      console.error("Error creating story with translations:", error);
      throw error;
    }
  },

  // Hikaye silme
  async deleteStory(id: string) {
    try {
      // Hikayeyi sil
      await remove(ref(database, `${STORIES_PATH}/${id}`));

      // İlgili çevirileri de sil
      const translationsRef = ref(database, TRANSLATIONS_PATH);
      const translationsQuery = query(
        translationsRef,
        orderByChild("original_id")
      );
      const snapshot = await get(translationsQuery);

      if (snapshot.exists()) {
        const deletePromises: any = [];
        snapshot.forEach((childSnapshot) => {
          const translation = childSnapshot.val();
          if (translation.original_id === id) {
            deletePromises.push(
              remove(ref(database, `${TRANSLATIONS_PATH}/${childSnapshot.key}`))
            );
          }
        });
        await Promise.all(deletePromises);
      }
    } catch (error) {
      console.error("Error deleting story:", error);
      throw error;
    }
  },

  async updateStory(
    id: string,
    storyData: Partial<Story>,
    translations: TranslationUpdate[]
  ): Promise<void> {
    try {
      const storyRef = ref(database, `${STORIES_PATH}/${id}`);
      const translationsRef = ref(database, TRANSLATIONS_PATH);

      // Get current story
      const storySnapshot = await get(storyRef);
      if (!storySnapshot.exists()) {
        throw new Error("Story not found");
      }

      const currentStory = storySnapshot.val();
      const now = dateHelper.toISOString();

      // Update story
      const updatedStory = {
        ...currentStory,
        ...storyData,
        updatedAt: now,
      };

      // Get current translations
      const translationsQuery = query(
        translationsRef,
        orderByChild("original_id"),
        equalTo(id)
      );
      const translationsSnapshot = await get(translationsQuery);

      // Create a map of existing translations by language
      const existingTranslations = new Map<
        string,
        { id: string; data: Translation }
      >();
      if (translationsSnapshot.exists()) {
        translationsSnapshot.forEach((childSnapshot) => {
          const translation = childSnapshot.val();
          existingTranslations.set(translation.language, {
            id: childSnapshot.key!,
            data: translation,
          });
        });
      }

      // Prepare translation updates
      const translationPromises = translations.map(({ language, story }) => {
        const existing = existingTranslations.get(language);

        if (existing) {
          // Update existing translation
          const translationRef = ref(
            database,
            `${TRANSLATIONS_PATH}/${existing.id}`
          );
          return set(translationRef, {
            ...existing.data,
            story,
            updatedAt: now,
          });
        } else {
          // Create new translation
          const newTranslationRef = push(ref(database, TRANSLATIONS_PATH));
          return set(newTranslationRef, {
            id: newTranslationRef.key,
            original_id: id,
            language,
            story,
            createdAt: now,
            updatedAt: now,
          });
        }
      });

      // Execute all updates
      await Promise.all([set(storyRef, updatedStory), ...translationPromises]);
    } catch (error) {
      console.error("Error updating story:", error);
      throw error;
    }
  },

  async getStoryWithTranslations(id: string): Promise<{
    story: Story;
    translations: Translation[];
  }> {
    try {
      // Get story
      const storyRef = ref(database, `${STORIES_PATH}/${id}`);
      const storySnapshot = await get(storyRef);

      if (!storySnapshot.exists()) {
        throw new Error("Story not found");
      }

      const story = {
        id: storySnapshot.key!,
        ...storySnapshot.val(),
      };

      // Get translations
      const translationsQuery = query(
        ref(database, TRANSLATIONS_PATH),
        orderByChild("original_id"),
        equalTo(id)
      );
      const translationsSnapshot = await get(translationsQuery);

      const translations: Translation[] = [];
      if (translationsSnapshot.exists()) {
        translationsSnapshot.forEach((childSnapshot) => {
          translations.push({
            id: childSnapshot.key!,
            ...childSnapshot.val(),
          });
        });
      }

      return { story, translations };
    } catch (error) {
      console.error("Error getting story with translations:", error);
      throw error;
    }
  },

  // Tüm hikayeleri getirme
  async getAllStories(): Promise<Story[]> {
    try {
      const snapshot = await get(ref(database, STORIES_PATH));
      if (!snapshot.exists()) return [];

      const stories: Story[] = [];
      snapshot.forEach((childSnapshot) => {
        stories.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        });
      });

      return stories;
    } catch (error) {
      console.error("Error getting stories:", error);
      throw error;
    }
  },

  async getStoriesPaginated(page: number, limit: number = 6) {
    try {
      const storiesRef = ref(database, STORIES_PATH);
      // Bir sonraki sayfada veri olup olmadığını kontrol etmek için
      // limit + 1 kadar veri çekiyoruz
      const queryRef = query(
        storiesRef,
        orderByChild("createdAt"),
        limitToLast(limit + 1)
      );

      const snapshot = await get(queryRef);

      if (!snapshot.exists()) return { stories: [], hasMore: false };

      const stories: Story[] = [];
      snapshot.forEach((childSnapshot) => {
        stories.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        });
      });

      // Sonuçları ters çevir (en yeniden en eskiye)
      stories.reverse();

      // Bir sonraki sayfa için veri var mı kontrol et
      const hasMore = stories.length > limit;

      // Sadece istenen sayıda veriyi döndür
      return {
        stories: stories.slice(0, limit),
        hasMore,
      };
    } catch (error) {
      console.error("Error getting paginated stories:", error);
      throw error;
    }
  },

  async searchStories(searchTerm: string) {
    try {
      const storiesRef = ref(database, STORIES_PATH);
      const snapshot = await get(storiesRef);

      if (!snapshot.exists()) return [];

      const stories: Story[] = [];
      snapshot.forEach((childSnapshot) => {
        const story = {
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        };

        // Search in title and original story text
        if (
          story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          story.original_story.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          stories.push(story);
        }
      });

      return stories.sort((a, b) => {
        const timeA =
          typeof a.createdAt === "string"
            ? Date.parse(a.createdAt)
            : a.createdAt;
        const timeB =
          typeof b.createdAt === "string"
            ? Date.parse(b.createdAt)
            : b.createdAt;
        return timeB - timeA;
      });
    } catch (error) {
      console.error("Error searching stories:", error);
      throw error;
    }
  },

  // Tek bir hikayeyi getirme
  async getStoryById(id: string): Promise<Story | null> {
    try {
      const snapshot = await get(ref(database, `${STORIES_PATH}/${id}`));
      if (!snapshot.exists()) return null;

      return {
        id: snapshot.key!,
        ...snapshot.val(),
      };
    } catch (error) {
      console.error("Error getting story:", error);
      throw error;
    }
  },

  // Çeviri ekleme
  async addTranslation(
    translationData: Omit<Translation, "id" | "createdAt" | "updatedAt">
  ) {
    try {
      const newTranslationRef = push(ref(database, TRANSLATIONS_PATH));
      const timestamp = new Date().toISOString();

      await set(newTranslationRef, {
        ...translationData,
        id: newTranslationRef.key,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return newTranslationRef.key;
    } catch (error) {
      console.error("Error adding translation:", error);
      throw error;
    }
  },

  // Hikayenin çevirilerini getirme
  async getStoryTranslations(storyId: string): Promise<Translation[]> {
    try {
      const translationsRef = ref(database, TRANSLATIONS_PATH);
      // orderByChild ile indeksi kullan
      const translationsQuery = query(
        translationsRef,
        orderByChild("original_id"),
        // equalTo ile tam eşleşme ara
        equalTo(storyId)
      );

      const snapshot = await get(translationsQuery);

      if (!snapshot.exists()) return [];

      const translations: Translation[] = [];
      snapshot.forEach((childSnapshot) => {
        translations.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        });
      });

      return translations;
    } catch (error) {
      console.error("Error getting translations:", error);
      throw error;
    }
  },

  async getFavorites(userId: string): Promise<string[]> {
    try {
      const favoriteRef = ref(database, `${FAVORITES_PATH}/${userId}`);
      const snapshot = await get(favoriteRef);

      if (!snapshot.exists()) return [];

      return snapshot.val().storyIds || [];
    } catch (error) {
      console.error("Error getting favorites:", error);
      throw error;
    }
  },

  async toggleFavorite(storyId: string): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User must be logged in");

      const favoriteRef = ref(database, `${FAVORITES_PATH}/${user.uid}`);
      const snapshot = await get(favoriteRef);

      let currentFavorites: string[] = [];
      if (snapshot.exists()) {
        currentFavorites = snapshot.val().storyIds || [];
      }

      let newFavorites: string[];
      if (currentFavorites.includes(storyId)) {
        // Remove from favorites
        newFavorites = currentFavorites.filter((id) => id !== storyId);
      } else {
        // Add to favorites
        newFavorites = [...currentFavorites, storyId];
      }

      await set(favoriteRef, {
        userId: user.uid,
        storyIds: newFavorites,
      });

      return newFavorites.includes(storyId);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      throw error;
    }
  },

  async getFavoriteStories(userId: string): Promise<Story[]> {
    try {
      const favoriteIds = await this.getFavorites(userId);
      if (favoriteIds.length === 0) return [];

      const stories: Story[] = [];
      const storiesRef = ref(database, STORIES_PATH);
      const snapshot = await get(storiesRef);

      if (!snapshot.exists()) return [];

      snapshot.forEach((childSnapshot) => {
        const story = {
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        };
        if (favoriteIds.includes(story.id)) {
          stories.push(story);
        }
      });

      return stories.sort((a, b) => {
        const timeA =
          typeof a.createdAt === "string"
            ? Date.parse(a.createdAt)
            : a.createdAt;
        const timeB =
          typeof b.createdAt === "string"
            ? Date.parse(b.createdAt)
            : b.createdAt;
        return timeB - timeA;
      });
    } catch (error) {
      console.error("Error getting favorite stories:", error);
      throw error;
    }
  },
};
