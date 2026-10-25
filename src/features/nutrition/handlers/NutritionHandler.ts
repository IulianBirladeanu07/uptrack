import { supabase } from '../../../shared/services/supabaseClient';
import type {
  NonBarcodedProduct,
  ProductFilter,
  ProductSearchResult,
  ScoredProduct,
} from '../../../shared/types';
import { queryClient } from '../../../shared/query/queryClient';

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const fetchNonBarcodedProducts = async (
  filters: ProductFilter[] = [],
  order: keyof NonBarcodedProduct | null = null,
  limitCount = 20000,
  lastVisibleDoc: string | null = null,
  searchQuery: string | null = null
): Promise<ProductSearchResult[]> => {
  const normalizedSearch = searchQuery?.trim() || null;
  if (!normalizedSearch && limitCount > 500) {
    return fetchNonBarcodedProductsFromSupabase(
      filters,
      order,
      limitCount,
      lastVisibleDoc,
      normalizedSearch,
    );
  }

  return queryClient.fetchQuery({
    queryKey: ['food-catalog', 'products', {
      filters,
      order,
      limitCount,
      lastVisibleDoc,
      searchQuery: normalizedSearch?.toLowerCase() ?? null,
    }],
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    queryFn: () => fetchNonBarcodedProductsFromSupabase(
      filters,
      order,
      limitCount,
      lastVisibleDoc,
      normalizedSearch,
    ),
  });
};

export const clearFoodCatalogQueryCache = (): void => {
  queryClient.removeQueries({ queryKey: ['food-catalog', 'products'] });
};

const fetchNonBarcodedProductsFromSupabase = async (
  filters: ProductFilter[],
  order: keyof NonBarcodedProduct | null,
  limitCount: number,
  lastVisibleDoc: string | null,
  searchQuery: string | null,
): Promise<ProductSearchResult[]> => {
  try {
    if (searchQuery) {
      return await performEnhancedSearch(searchQuery, limitCount);
    }

    let queryBuilder = supabase.from('non_barcoded_products').select('*');

    filters.forEach(([field, operator, value]) => {
      switch (operator) {
        case '==': queryBuilder = queryBuilder.eq(field, value); break;
        case '!=': queryBuilder = queryBuilder.neq(field, value); break;
        case '>': queryBuilder = queryBuilder.gt(field, value); break;
        case '>=': queryBuilder = queryBuilder.gte(field, value); break;
        case '<': queryBuilder = queryBuilder.lt(field, value); break;
        case '<=': queryBuilder = queryBuilder.lte(field, value); break;
        case 'array-contains': queryBuilder = queryBuilder.contains(field, [value]); break;
        case 'in': queryBuilder = queryBuilder.in(field, value); break;
        default: console.warn(`Unsupported filter operator: ${operator}`);
      }
    });

    if (order) {
      queryBuilder = queryBuilder.order(order, { ascending: true });
    }

    if (limitCount) {
      queryBuilder = queryBuilder.limit(limitCount);
    }

    if (lastVisibleDoc) {
      queryBuilder = queryBuilder.gt('id', lastVisibleDoc);
    }

    const { data: products, error } = await queryBuilder;

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return products ?? [];
  } catch (error) {
    console.error('Error fetching non-barcoded products:', errorMessage(error));
    throw error;
  }
};

const ilikeNames = (term: string): string => {
  const v = `"%${term.replace(/[\\"]/g, '\\$&')}%"`;
  return `product_name_en.ilike.${v},product_name_ro.ilike.${v}`;
};

const performEnhancedSearch = async (
  searchQuery: string,
  limitCount = 50
): Promise<ProductSearchResult[]> => {
  try {

    const { data: similarityResults, error: similarityError } = await supabase
      .rpc('search_products_similarity', {
        search_term: searchQuery,
        similarity_threshold: 0.1,
        limit_count: limitCount
      });

    if (!similarityError && similarityResults && similarityResults.length > 0) {
      return similarityResults;
    }
    const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);

    let queryBuilder = supabase.from('non_barcoded_products').select('*');

    if (searchTerms.length === 1) {
      const term = searchTerms[0]!;
      queryBuilder = queryBuilder.or(ilikeNames(term));
    } else {
      const conditions = searchTerms.map(ilikeNames).join(',');
      queryBuilder = queryBuilder.or(conditions);
    }

    const { data: ilikeResults, error: ilikeError } = await queryBuilder
      .order('product_name_en', { ascending: true })
      .limit(limitCount);

    if (ilikeError) {
      throw new Error(`ILIKE search error: ${ilikeError.message}`);
    }

    if (ilikeResults && ilikeResults.length > 0) {
      const scoredResults: ScoredProduct[] = ilikeResults.map(product => {
        const score = calculateRelevanceScore(product, searchQuery);
        return {
          ...product,
          similarity_score: score / 100,
          match_type: score > 80 ? 'exact' : score > 60 ? 'prefix' : 'contains'
        };
      });

      scoredResults.sort((a, b) => b.similarity_score - a.similarity_score);
      return scoredResults;
    }

    return [];

  } catch (error) {
    console.error('Enhanced search failed:', error);
    throw error;
  }
};

const stripAccents = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const calculateRelevanceScore = (product: NonBarcodedProduct, searchQuery: string): number => {
  const normalizedQuery = stripAccents(searchQuery);
  const nameEn = stripAccents(product.product_name_en || '');
  const nameRo = stripAccents(product.product_name_ro || '');

  let maxScore = 0;

  [nameEn, nameRo].forEach(name => {
    if (!name) return;

    let score = 0;

    if (name === normalizedQuery) {
      score = 100;
    }
    else if (name.startsWith(normalizedQuery)) {
      score = 90;
    }
    else if (name.split(' ').some(word => word.startsWith(normalizedQuery))) {
      score = 80;
    }
    else if (name.includes(normalizedQuery)) {
      score = 70;
    }
    else {
      const queryWords = normalizedQuery.split(/\s+/);
      const containsAll = queryWords.every(word => name.includes(word));
      if (containsAll) {
        score = 60;
      } else {
        const matchCount = queryWords.filter(word => name.includes(word)).length;
        score = (matchCount / queryWords.length) * 50;
      }
    }

    maxScore = Math.max(maxScore, score);
  });

  if (product.image) {
    maxScore += 2;
  }

  return maxScore;
};
