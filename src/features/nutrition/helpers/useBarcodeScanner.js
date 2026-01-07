import { useState, useRef } from 'react';
import { Vibration, Alert } from 'react-native';
import { Animated } from 'react-native';
import { transformBarcodeDBToFoodDetail } from '../utils/customFoodDataUtils';

export const useBarcodeScanner = (barcodedProducts, navigation, meal, selectedDate) => {
  const [scannedProducts, setScannedProducts] = useState([]);
  const [isScanning, setIsScanning] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [batchMode, setBatchMode] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(true);
  
  const successOpacity = useRef(new Animated.Value(0)).current;
  const errorOpacity = useRef(new Animated.Value(0)).current;
  const lastScannedRef = useRef(null);
  const scanTimeoutRef = useRef(null);

  const findProductByBarcode = (barcode) => {
    return barcodedProducts.find(product => product.barcode_id === barcode) || null;
  };

  const handleBarcodeScanned = async ({ type, data }) => {
    if (lastScannedRef.current === data && scanTimeoutRef.current) {
      return;
    }

    lastScannedRef.current = data;
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }

    scanTimeoutRef.current = setTimeout(() => {
      lastScannedRef.current = null;
    }, 3000);

    Vibration.vibrate(100);
    setIsScanning(false);
    setLoadingProduct(true);

    try {
      const product = findProductByBarcode(data);
      if (product) {
        showSuccessAnimation();
        const transformedProduct = transformBarcodeDBToFoodDetail(product);
        setCurrentProduct(transformedProduct);
        
        if (batchMode) {
          addProductToBatch(transformedProduct);
          Vibration.vibrate([0, 50, 50, 50]);
          setTimeout(() => {
            setIsScanning(true);
          }, 500);
        } else {
          navigation.navigate('FoodDetail', { 
            food: transformedProduct, 
            meal, 
            selectedDate,
            returnToBarcodeScanner: true
          });
        }

        if (instructionsVisible) {
          setInstructionsVisible(false);
        }
      } else {
        showErrorAnimation();
        handleProductNotFound(data);
      }
    } catch (error) {
      console.error('Error scanning barcode', error);
      Alert.alert('Scan Error', 'Something went wrong while processing the barcode.');
      setIsScanning(true);
    } finally {
      setLoadingProduct(false);
    }
  };

  const addProductToBatch = (product) => {
    setScannedProducts(prev => {
      const exists = prev.some(p => p.barcode_id === product.barcode_id);
      if (exists) {
        Alert.alert(
          'Product Already Scanned',
          `"${product.name}" is already in your batch.`,
          [{ text: 'OK' }],
          { cancelable: true }
        );
        return prev;
      }
      return [...prev, product];
    });
  };

  const showSuccessAnimation = () => {
    Animated.sequence([
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 500,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showErrorAnimation = () => {
    Animated.sequence([
      Animated.timing(errorOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(errorOpacity, {
        toValue: 0,
        duration: 500,
        delay: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleProductNotFound = (barcode) => {
    Alert.alert(
      'Product Not Found',
      `No product found with barcode: ${barcode}${batchMode ? '\n\nNote: Creating a custom food will exit batch mode.' : ''}`,
      [
        {
          text: 'Create Custom Food',
          onPress: () => {
            if (batchMode && scannedProducts.length > 0) {
              Alert.alert(
                'Exit Batch Mode?',
                'Creating a custom food will exit batch mode. Would you like to complete your batch first?',
                [
                  {
                    text: 'Complete Batch First',
                    onPress: handleBatchScanComplete
                  },
                  {
                    text: 'Create Food Now',
                    onPress: () => {
                      setBatchMode(false);
                      navigation.navigate('CustomFood', {
                        barcode,
                        type: 'foodWithBarcode',
                        meal,
                        selectedDate,
                        returnToBarcodeScanner: true
                      });
                    }
                  }
                ]
              );
            } else {
              if (batchMode) setBatchMode(false);
              navigation.navigate('CustomFood', {
                barcode,
                type: 'foodWithBarcode',
                meal,
                selectedDate,
                returnToBarcodeScanner: true
              });
            }
          }
        },
        {
          text: 'Try Again',
          onPress: () => {
            setIsScanning(true);
          }
        }
      ],
      {
        cancelable: true,
        onDismiss: () => {
          setIsScanning(true);
        }
      }
    );
  };

  const resumeScanning = () => {
    setCurrentProduct(null);
    setIsScanning(true);
  };

  const toggleBatchMode = () => {
    if (batchMode && scannedProducts.length > 0) {
      handleBatchScanComplete();
    } else {
      setBatchMode(prev => !prev);
      setIsScanning(true);
    }
  };

  const handleBatchScanComplete = () => {
    if (scannedProducts.length > 0) {
      setIsScanning(false);
      
      navigation.navigate('BatchScanResults', { 
        products: scannedProducts,
        meal,
        selectedDate
      });
      
      setBatchMode(false);
      setScannedProducts([]);
    } else {
      Alert.alert(
        'No Products Scanned', 
        'Please scan at least one product before completing batch mode.'
      );
      setIsScanning(true);
    }
  };

  const removeFromBatch = (productId) => {
    setScannedProducts(prev => prev.filter(product => product.id !== productId));
  };

  return {
    scannedProducts,
    isScanning,
    loadingProduct,
    currentProduct,
    batchMode,
    instructionsVisible,
    successOpacity,
    errorOpacity,
    handleBarcodeScanned,
    resumeScanning,
    toggleBatchMode,
    setBatchMode,
    handleBatchScanComplete,
    removeFromBatch,
  };
};