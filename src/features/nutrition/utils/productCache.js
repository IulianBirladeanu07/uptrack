import { fetchBarcodedProducts } from "../handlers/NutritionHandler";

const CACHE_DURATION = 15 * 60 * 1000;

export const productCache = {
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
  }
};