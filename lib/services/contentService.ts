import { database } from "../firebase";
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
import { Banner } from "../types/Banner";
import { Quote } from "../types/Quote";

const BANNERS_PATH = "banners";
const QUOTES_PATH = "quotes";

export const contentService = {
  // Banner Methods
  async createBanner(banner: Omit<Banner, "id" | "createdAt">) {
    try {
      const bannersRef = ref(database, BANNERS_PATH);
      const newBannerRef = push(bannersRef);

      // If this is set as active, deactivate others
      if (banner.isActive) {
        await this.deactivateAllBanners();
      }

      await set(newBannerRef, {
        ...banner,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("Error creating banner:", error);
      throw error;
    }
  },

  async getAllBanners() {
    try {
      const bannersRef = ref(database, BANNERS_PATH);
      const snapshot = await get(bannersRef);

      if (!snapshot.exists()) return [];

      const banners: Banner[] = [];
      snapshot.forEach((childSnapshot) => {
        banners.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        });
      });

      return banners.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error getting banners:", error);
      throw error;
    }
  },

  async getActiveBanner() {
    try {
      const bannersRef = ref(database, BANNERS_PATH);
      const activeQuery = query(
        bannersRef,
        orderByChild("isActive"),
        equalTo(true)
      );

      const snapshot = await get(activeQuery);

      if (!snapshot.exists()) return null;

      const banners: Banner[] = [];
      snapshot.forEach((childSnapshot) => {
        banners.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        });
      });

      return banners[0]; // Return the first active banner
    } catch (error) {
      console.error("Error getting active banner:", error);
      throw error;
    }
  },

  async updateBanner(id: string, banner: Partial<Banner>) {
    try {
      const bannerRef = ref(database, `${BANNERS_PATH}/${id}`);

      // If updating to active, deactivate others
      if (banner.isActive) {
        await this.deactivateAllBanners();
      }

      const snapshot = await get(bannerRef);
      if (!snapshot.exists()) throw new Error("Banner not found");

      await set(bannerRef, {
        ...snapshot.val(),
        ...banner,
      });
    } catch (error) {
      console.error("Error updating banner:", error);
      throw error;
    }
  },

  async deleteBanner(id: string) {
    try {
      const bannerRef = ref(database, `${BANNERS_PATH}/${id}`);
      await remove(bannerRef);
    } catch (error) {
      console.error("Error deleting banner:", error);
      throw error;
    }
  },

  async deactivateAllBanners() {
    try {
      const bannersRef = ref(database, BANNERS_PATH);
      const snapshot = await get(bannersRef);

      if (!snapshot.exists()) return;

      const updates: Promise<void>[] = [];
      snapshot.forEach((childSnapshot) => {
        const bannerRef = ref(database, `${BANNERS_PATH}/${childSnapshot.key}`);
        updates.push(
          set(bannerRef, { ...childSnapshot.val(), isActive: false })
        );
      });

      await Promise.all(updates);
    } catch (error) {
      console.error("Error deactivating banners:", error);
      throw error;
    }
  },

  // Quote Methods
  async createQuote(quote: Omit<Quote, "id" | "createdAt">) {
    try {
      const quotesRef = ref(database, QUOTES_PATH);
      const newQuoteRef = push(quotesRef);

      // If this is set as active, deactivate others
      if (quote.isActive) {
        await this.deactivateAllQuotes();
      }

      await set(newQuoteRef, {
        ...quote,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("Error creating quote:", error);
      throw error;
    }
  },

  async getAllQuotes() {
    try {
      const quotesRef = ref(database, QUOTES_PATH);
      const snapshot = await get(quotesRef);

      if (!snapshot.exists()) return [];

      const quotes: Quote[] = [];
      snapshot.forEach((childSnapshot) => {
        quotes.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        });
      });

      return quotes.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error("Error getting quotes:", error);
      throw error;
    }
  },

  async getActiveQuote() {
    try {
      const quotesRef = ref(database, QUOTES_PATH);
      const activeQuery = query(
        quotesRef,
        orderByChild("isActive"),
        equalTo(true)
      );

      const snapshot = await get(activeQuery);

      if (!snapshot.exists()) return null;

      const quotes: Quote[] = [];
      snapshot.forEach((childSnapshot) => {
        quotes.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        });
      });

      return quotes[0]; // Return the first active quote
    } catch (error) {
      console.error("Error getting active quote:", error);
      throw error;
    }
  },

  async updateQuote(id: string, quote: Partial<Quote>) {
    try {
      const quoteRef = ref(database, `${QUOTES_PATH}/${id}`);

      // If updating to active, deactivate others
      if (quote.isActive) {
        await this.deactivateAllQuotes();
      }

      const snapshot = await get(quoteRef);
      if (!snapshot.exists()) throw new Error("Quote not found");

      await set(quoteRef, {
        ...snapshot.val(),
        ...quote,
      });
    } catch (error) {
      console.error("Error updating quote:", error);
      throw error;
    }
  },

  async deleteQuote(id: string) {
    try {
      const quoteRef = ref(database, `${QUOTES_PATH}/${id}`);
      await remove(quoteRef);
    } catch (error) {
      console.error("Error deleting quote:", error);
      throw error;
    }
  },

  async deactivateAllQuotes() {
    try {
      const quotesRef = ref(database, QUOTES_PATH);
      const snapshot = await get(quotesRef);

      if (!snapshot.exists()) return;

      const updates: Promise<void>[] = [];
      snapshot.forEach((childSnapshot) => {
        const quoteRef = ref(database, `${QUOTES_PATH}/${childSnapshot.key}`);
        updates.push(
          set(quoteRef, { ...childSnapshot.val(), isActive: false })
        );
      });

      await Promise.all(updates);
    } catch (error) {
      console.error("Error deactivating quotes:", error);
      throw error;
    }
  },
};
