const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const { uuidv7 } = require('uuidv7');
require('dotenv').config(); // Load environment variables

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}
const firestore = admin.firestore();

// Load Supabase credentials from .env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase credentials are missing! Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Category mapping
const CATEGORY_MAP = {
    'grasimi': 'fats',
};

// Transforms Firestore data to match Supabase schema
function transformProduct(data) {
    try {
        return {
            id: uuidv7(),  // Generate UUID v7
            product_name_en: data?.productName?.en?.toLowerCase() || null,
            product_name_ro: data?.productName?.ro?.toLowerCase() || null,
            calories: data?.calories || null,
            carbohydrates: data?.carbohydrates || null,
            category: CATEGORY_MAP[data?.category] || data?.category || null, // Apply category mapping
            fats: data?.fats || null,
            fiber: data?.fiber || null,
            protein: data?.protein || null,
            salt: data?.salt || null,
            saturated_fats: data?.saturatedFats || null,
            sugar: data?.sugar || null,
            image: data?.image || null,
            last_updated: data?.lastUpdated ? new Date(data.lastUpdated).toISOString() : new Date().toISOString(),
            serving_size_unit: data?.servingSize?.unit || null,
            serving_size_value: data?.servingSize?.value || null
        };
    } catch (error) {
        console.error('❌ Error transforming product:', error);
        return null;
    }
}

// Migrates a batch of products to Supabase
async function migrateProductsBatch(products) {
    if (!products.length) return true; // Skip empty batches

    try {
        const { error } = await supabase
            .from('non_barcoded_products')
            .upsert(products);

        if (error) {
            console.error('❌ Error migrating batch:', error);
            return false;
        }

        console.log(`✅ Successfully migrated batch of ${products.length} products.`);
        return true;
    } catch (error) {
        console.error('❌ Unexpected error in migrateProductsBatch:', error);
        return false;
    }
}

// Fetches and migrates all products from Firestore
async function performInitialMigration() {
    console.log('🚀 Starting initial migration...');
    try {
        const productsSnap = await firestore.collection('nonBarcodedProducts').get();
        const totalProducts = productsSnap.size;
        console.log(`📊 Total products to migrate: ${totalProducts}`);

        const batchSize = 50;
        const batches = [];

        // Split products into batches
        for (let i = 0; i < productsSnap.docs.length; i += batchSize) {
            batches.push(productsSnap.docs.slice(i, i + batchSize));
        }

        let successCount = 0;
        let failureCount = 0;

        // Process all batches in parallel with error handling
        const results = await Promise.allSettled(
            batches.map(async (batch, batchIndex) => {
                console.log(`🔄 Processing batch ${batchIndex + 1}/${batches.length}...`);
                const transformedProducts = batch
                    .map(doc => transformProduct(doc.data()))
                    .filter(product => product !== null);

                const success = await migrateProductsBatch(transformedProducts);
                return success ? transformedProducts.length : -transformedProducts.length;
            })
        );

        // Process results
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value > 0) {
                successCount += result.value;
            } else if (result.status === 'fulfilled' && result.value < 0) {
                failureCount += Math.abs(result.value);
            } else {
                console.error('❌ Batch processing failed:', result.reason);
            }
        });

        console.log(`✅ Migration complete: ${successCount} success, ${failureCount} failed.`);
    } catch (error) {
        console.error('❌ Initial migration failed:', error);
    }
}

// Polls Firestore for updates every 10 seconds
async function pollFirestoreUpdates() {
    console.log('🔄 Polling Firestore for updates every 10 seconds...');
    setInterval(async () => {
        try {
            const productsSnap = await firestore.collection('nonBarcodedProducts').get();
            let updatedCount = 0;

            const batchSize = 50;
            const batches = [];

            for (let i = 0; i < productsSnap.docs.length; i += batchSize) {
                batches.push(productsSnap.docs.slice(i, i + batchSize));
            }

            // Process all batches in parallel
            const results = await Promise.allSettled(
                batches.map(async batch => {
                    const transformedProducts = batch
                        .map(doc => transformProduct(doc.data()))
                        .filter(product => product !== null);

                    const success = await migrateProductsBatch(transformedProducts);
                    return success ? transformedProducts.length : 0;
                })
            );

            // Count updated products
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    updatedCount += result.value;
                }
            });

            console.log(`🔁 Polling cycle completed. Updated ${updatedCount} products.`);
        } catch (error) {
            console.error('❌ Error polling Firestore:', error);
        }
    }, 10000);
}

// 🏁 Main Execution
async function main() {
    try {
        await performInitialMigration();
        pollFirestoreUpdates();
    } catch (error) {
        console.error('❌ Error in main execution:', error);
    }
}

main().catch(console.error);
