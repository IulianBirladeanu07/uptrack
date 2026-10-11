import { fetchBarcodedProducts } from "../handlers/NutritionHandler";
import type { BarcodedProduct } from '../../../shared/types';

const CACHE_DURATION = 15 * 60 * 1000;

type ProductCache = {
  data: BarcodedProduct[] | null;
  lastFetched: number | null;
  getProducts: () => Promise<BarcodedProduct[] | null>;
  invalidate: () => void;
};

export const productCache: ProductCache = {
  data: null,
  lastFetched: null,

  async getProducts() {
    const now = new Date().getTime();
    if (
      this.data &&
      this.lastFetched &&
      (now - this.lastFetched) < CACHE_DURATION
    ) {
      return this.data;
    }

    const products = await fetchBarcodedProducts();
    this.data = products;
    this.lastFetched = now;

    return products;
  },

  invalidate() {
    this.data = null;
    this.lastFetched = null;
  }
};
