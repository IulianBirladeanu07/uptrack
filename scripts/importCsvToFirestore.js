const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const admin = require('firebase-admin');
const { createReadStream, readdirSync } = require('fs');
const { parse } = require('csv-parse');
const path = require('path');
const crypto = require('crypto');

// Initialize the Secret Manager client
const secretClient = new SecretManagerServiceClient();
const projectId = '208634985017'; // Replace with your project ID
const secretId = 'FIREBASE_SERVICE_ACCOUNT_KEY'; // Replace with your secret ID
const secretVersion = 'latest'; // Use 'latest' to get the latest version of the secret
const secretName = `projects/${projectId}/secrets/${secretId}/versions/${secretVersion}`;

// Helper function to normalize and remove diacritics (for Romanian names)
function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Helper function to handle mixed language cases (remove diacritics but keep casing)
function normalizeProductName(productName) {
  if (!productName) return '';
  return removeDiacritics(productName); // Only remove diacritics, keep original casing
}

// Helper function to get secret for Firebase initialization
async function getSecret() {
  try {
    console.info('Fetching secret for Firebase initialization...');
    const [version] = await secretClient.accessSecretVersion({ name: secretName });
    const secretPayload = version.payload.data.toString('utf8');
    console.info('Firebase secret retrieved successfully.');
    return JSON.parse(secretPayload);
  } catch (error) {
    console.error('Failed to access secret:', error);
    throw error;
  }
}

// Initialize Firebase
async function initializeFirebase() {
  try {
    console.info('Initializing Firebase...');
    const serviceAccount = await getSecret();
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.info('Firebase initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    throw error;
  }
}

// Helper function to parse numerical values
function parseValue(value) {
  if (!value) {
    return null;
  }

  value = value.trim().toLowerCase();

  const matchGrams = value.match(/(\d+(\.\d+)?)\s*g/);
  const matchMilligrams = value.match(/(\d+(\.\d+)?)\s*mg/);
  const matchKCal = value.match(/(\d+(\.\d+)?)\s*kcal/);

  if (matchGrams) {
    return parseFloat(matchGrams[1]);
  }

  if (matchMilligrams) {
    return parseFloat(matchMilligrams[1]) / 1000;
  }

  if (matchKCal) {
    return parseFloat(matchKCal[1]);
  }

  const matchKJ_KCal = value.match(/(\d+(\.\d+)?)\s*kj\s*\/\s*(\d+(\.\d+)?)\s*kcal/);
  if (matchKJ_KCal) {
    return parseFloat(matchKJ_KCal[3]);
  }

  console.warn(`Warning: Unable to parse value: "${value}"`);
  return null;
}

// Helper function to sanitize JSON-like strings
function sanitizeJsonString(value) {
  if (!value) return value;
  try {
    const fixedValue = value.replace(/'/g, '"');
    return JSON.parse(fixedValue);
  } catch (error) {
    console.error('Invalid JSON format in value:', value);
    return value;
  }
}

// Function to prepare data for Firestore
function prepareDataForFirestore(data) {
  const productNameEn = data['product_name_en'];
  const productNameRo = data['Nume Produs'];

  const searchTokenEn = data['searchTokenEn'] ? sanitizeJsonString(data['searchTokenEn']) : null;
  const searchTokenRo = data['searchTokenRo'] ? sanitizeJsonString(data['searchTokenRo']) : null;

  let servingSizeValue = null;
  let servingSizeUnit = null;

  if (data['servingSize']) {
    const matchServingSize = data['servingSize'].match(/(\d+)\s*(g|ml)/i);
    if (matchServingSize) {
      servingSizeValue = parseInt(matchServingSize[1], 10);
      servingSizeUnit = matchServingSize[2].toLowerCase();
    } else {
      console.warn(`Invalid serving size format: "${data['servingSize']}"`);
    }
  }

  const calories = parseValue(data['Calorii']);
  const fats = parseValue(data['Grăsimi']);
  const saturatedFats = parseValue(data['Grăsimi Saturate']);
  const carbohydrates = parseValue(data['Carbohidrați']);
  const sugar = parseValue(data['Zaharuri']);
  const fiber = parseValue(data['Fibre']);
  const protein = parseValue(data['Proteine']);
  const salt = parseValue(data['Sare']);

  return {
    productName: {
      en: productNameEn,
      ro: normalizeProductName(productNameRo), // Normalize Romanian name by removing diacritics
    },
    calories,
    fats,
    saturatedFats,
    carbohydrates,
    sugar,
    fiber,
    protein,
    salt,
    servingSize: {
      value: servingSizeValue,
      unit: servingSizeUnit,
    },
    category: data['Categorie'],
    searchToken: {
      en: searchTokenEn,
      ro: searchTokenRo,
    },
    image: data['matched_image'] || null,
    lastUpdated: new Date().toISOString(),
    favorites: {
      count: 0,
      userIds: [],
    },
  };
}

// Function to generate document ID (sanitized name + small hash)
function generateDocumentID(productNameRo) {
  // Remove diacritics, convert to lowercase, trim leading and trailing spaces
  const sanitizedName = removeDiacritics(productNameRo)
    .toLowerCase()
    .trim() // Remove leading and trailing spaces
    .replace(/\s+/g, '_') // Replace one or more spaces with a single underscore
    .replace(/[^a-z0-9_]/g, '') // Remove any non-alphanumeric or underscore characters
    .replace(/_+/g, '_'); // Replace multiple underscores with a single underscore

  // Ensure there's no leading or trailing underscore
  const finalSanitizedName = sanitizedName.replace(/^_+|_+$/g, '');

  // Generate 6-character MD5 hash
  const hash = crypto.createHash('md5').update(finalSanitizedName).digest('hex').slice(0, 6);  // Ensure 6 characters only

  // Combine sanitized name with hash, ensuring only one underscore between them
  return finalSanitizedName + '_' + hash;  // Only a single underscore between name and hash
}

// Function to upload data to Firestore
async function uploadToFirestore(collectionName, documentID, data) {
  const firestore = admin.firestore();
  try {
    await firestore.collection(collectionName).doc(documentID).set(data);
    console.info(`Document ${documentID} uploaded successfully.`);
  } catch (error) {
    console.error(`Error uploading document ${documentID}:`, error);
  }
}

// Function to read CSV file, prepare data, and upload to Firestore
async function readAndUploadCSV(filePath) {
  const parser = parse({
    columns: true,
    delimiter: ',',
    trim: true,
    escape: '"',
    quote: '"',
    relax_quotes: true,
  });

  const collectionName = 'nonBarcodedProducts';
  let totalProductsRead = 0;

  return new Promise((resolve, reject) => {
    createReadStream(filePath)
      .pipe(parser)
      .on('data', async (data) => {
        totalProductsRead++;
        if (data['product_name_en'] && data['Nume Produs']) {
          const preparedData = prepareDataForFirestore(data);
          const documentID = generateDocumentID(data['Nume Produs']);
          await uploadToFirestore(collectionName, documentID, preparedData);
        }
      })
      .on('end', () => {
        console.info(`CSV file read successfully. Total products read: ${totalProductsRead}`);
        resolve();
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error);
        reject(error);
      });
  });
}

// Function to process all CSV files in the directory
async function processAllCSVFiles() {
  try {
    const directory = process.cwd();
    const files = readdirSync(directory);

    for (const file of files) {
      if (file.endsWith('.csv')) {
        const filePath = path.join(directory, file);
        console.info(`Processing file: ${filePath}`);
        await readAndUploadCSV(filePath);
      }
    }

    console.info('All files processed and uploaded successfully');
  } catch (error) {
    console.error('Error processing CSV files:', error);
  }
}

// Start processing
initializeFirebase().then(() => { 
  processAllCSVFiles().catch((error) => {
    console.error('Error during CSV processing:', error);
  });
});
