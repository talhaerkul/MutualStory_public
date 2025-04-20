import {
  ref,
  get,
  set,
  push,
  remove,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { database } from "@/lib/firebase";
import { TranslationDraft } from "@/lib/types/TranslationDraft";

// Firebase yolları
const TRANSLATION_DRAFTS_PATH = "translation_drafts";
const TRANSLATIONS_PATH = "translations";

// E-posta adreslerini Firebase yolları için güvenli hale getiren yardımcı fonksiyon
const sanitizeUserId = (userId: string): string => {
  return userId.replace(/[.#$[\]]/g, "_");
};

export const storyViewerService = {
  // Kullanıcı kimliğini al (anonim kullanıcılar için IP adresi kullanılır)
  getUserId: (clientIp: string): string => {
    return `anonymous_${clientIp.replace(/[.]/g, "_")}`;
  },

  deleteDraft: async (
    draftId: string,
    storyId: string,
    userId: string
  ): Promise<void> => {
    try {
      const sanitizedUserId = sanitizeUserId(userId);
      const draftRef = ref(
        database,
        `${TRANSLATION_DRAFTS_PATH}/${sanitizedUserId}/${storyId}/${draftId}`
      );
      console.log(draftRef);
      await remove(draftRef);
    } catch (error) {
      console.error("Error deleting draft:", error);
      throw error;
    }
  },

  // Kullanıcının çeviri taslak listesini getir
  getTranslationDrafts: async (
    storyId: string,
    userId: string
  ): Promise<TranslationDraft[]> => {
    try {
      const sanitizedUserId = sanitizeUserId(userId);
      const draftsRef = ref(
        database,
        `${TRANSLATION_DRAFTS_PATH}/${sanitizedUserId}/${storyId}`
      );

      const snapshot = await get(draftsRef);

      if (snapshot.exists()) {
        // Firebase'den gelen verileri diziye dönüştür
        const drafts: TranslationDraft[] = [];
        snapshot.forEach((childSnapshot) => {
          drafts.push({
            id: childSnapshot.key || "",
            ...childSnapshot.val(),
          });
        });

        // Tarihe göre sırala (en yeniden en eskiye)
        return drafts.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      }

      return [];
    } catch (error) {
      console.error("Error getting translation drafts:", error);
      throw error;
    }
  },

  // Çeviri taslağını kaydet
  saveTranslationDraft: async (draft: {
    storyId: string;
    userId: string;
    content: string;
    language: string;
    date: string;
  }): Promise<string> => {
    try {
      const sanitizedUserId = sanitizeUserId(draft.userId);
      const draftsRef = ref(
        database,
        `${TRANSLATION_DRAFTS_PATH}/${sanitizedUserId}/${draft.storyId}`
      );

      // Yeni bir taslak oluştur
      const newDraftRef = push(draftsRef);

      const draftData = {
        content: draft.content,
        language: draft.language,
        date: draft.date,
      };

      await set(newDraftRef, draftData);

      return newDraftRef.key || "";
    } catch (error) {
      console.error("Error saving translation draft:", error);
      throw error;
    }
  },

  // Belirli bir dildeki çeviriyi getir
  getTranslation: async (
    storyId: string,
    language: string
  ): Promise<{ story: string } | null> => {
    try {
      // Önce hikayenin çevirilerini içeren referansı oluştur
      const translationsRef = ref(database, `${TRANSLATIONS_PATH}`);

      // Hikaye ID'sine göre sorgu oluştur
      const translationsQuery = query(
        translationsRef,
        orderByChild("original_id"),
        equalTo(storyId)
      );

      const snapshot = await get(translationsQuery);

      if (snapshot.exists()) {
        // Snapshot içindeki tüm çevirileri kontrol et
        let result = null;

        snapshot.forEach((childSnapshot) => {
          const translation = childSnapshot.val();
          // İstenen dildeki çeviriyi bul
          if (translation.language === language) {
            result = { story: translation.story };
            // forEach döngüsünden çık
            return true;
          }
          return false;
        });

        return result;
      }

      return null;
    } catch (error) {
      console.error("Error getting translation:", error);
      throw error;
    }
  },

  // Belirli bir taslağı getir
  getDraft: async (
    draftId: string,
    storyId: string,
    userId: string
  ): Promise<TranslationDraft | null> => {
    try {
      const sanitizedUserId = sanitizeUserId(userId);
      const draftRef = ref(
        database,
        `${TRANSLATION_DRAFTS_PATH}/${sanitizedUserId}/${storyId}/${draftId}`
      );

      const snapshot = await get(draftRef);

      if (snapshot.exists()) {
        return {
          id: draftId,
          ...snapshot.val(),
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting draft:", error);
      throw error;
    }
  },

  translateWords: async (
    text: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<{ original: string; translated: string }> => {
    try {
      //! test
      // const translations: Record<string, Record<string, string>> = {
      //   en: {
      //     tr: "Türkçe çeviri",
      //     es: "Traducción al español",
      //     fr: "Traduction française",
      //     de: "Deutsche Übersetzung",
      //   },
      //   tr: {
      //     en: "English translation",
      //     es: "Traducción al español",
      //     fr: "Traduction française",
      //     de: "Deutsche Übersetzung",
      //   },
      //   es: {
      //     en: "English translation",
      //     tr: "Türkçe çeviri",
      //     fr: "Traduction française",
      //     de: "Deutsche Übersetzung",
      //   },
      //   fr: {
      //     en: "English translation",
      //     tr: "Türkçe çeviri",
      //     es: "Traducción al español",
      //     de: "Deutsche Übersetzung",
      //   },
      //   de: {
      //     en: "English translation",
      //     tr: "Türkçe çeviri",
      //     es: "Traducción al español",
      //     fr: "Traduction française",
      //   },
      // };

      // // Simüle edilmiş çeviri
      // const translatedText =
      //   translations[sourceLanguage]?.[targetLanguage] ||
      //   `${text} (translated from ${sourceLanguage} to ${targetLanguage})`;

      // return {
      //   original: text,
      //   translated: translatedText,
      // };
      //! production
      const response = await fetch(`/api/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          sourceLanguage,
          targetLanguage,
        }),
      });
      console.log(response);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Translation failed");
      }

      const data = await response.json();

      return data;
    } catch (error) {
      throw error;
    }
  },

  // AI-powered translation assessment
  assessTranslation: async (
    originalText: string,
    userTranslation: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<{
    score: number;
    feedback: string;
    new_translate: boolean;
    translation: string | null;
  }> => {
    try {
      const response = await fetch(`/api/openai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "assess",
          originalText,
          userTranslation,
          sourceLanguage,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Translation assessment failed");
      }

      const data = await response.json();
      return {
        score: data.score || 0,
        feedback: data.feedback || "No feedback provided",
        new_translate: data.new_translate || false,
        translation: data.translation || null,
      };
    } catch (error) {
      console.error("Error assessing translation:", error);
      return {
        score: 0,
        feedback: "Error assessing translation",
        new_translate: false,
        translation: null,
      };
    }
  },

  // Get alternative translations
  getAlternativeTranslations: async (
    originalText: string,
    userTranslation: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string[]> => {
    try {
      const response = await fetch(`/api/openai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "alternatives",
          originalText,
          userTranslation,
          sourceLanguage,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.details || "Failed to get alternative translations"
        );
      }

      const data = await response.json();
      return data.alternatives || [];
    } catch (error) {
      console.error("Error getting alternative translations:", error);
      return [];
    }
  },

  // Auto-complete translation
  autoCompleteTranslation: async (
    originalText: string,
    partialTranslation: string,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<string> => {
    try {
      const response = await fetch(`/api/openai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "autocomplete",
          originalText,
          userTranslation: partialTranslation,
          sourceLanguage,
          targetLanguage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || "Translation autocomplete failed");
      }

      const data = await response.json();
      return data.translation || partialTranslation;
    } catch (error) {
      console.error("Error auto-completing translation:", error);
      return partialTranslation;
    }
  },
};
