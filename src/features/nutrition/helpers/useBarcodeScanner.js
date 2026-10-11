import { useState, useRef, useCallback } from 'react';
import { Vibration, Alert } from 'react-native';
import { Animated } from 'react-native';
import { transformBarcodeDBToFoodDetail } from '../utils/customFoodDataUtils';

export const useBarcodeScanner = (barcodedProducts, navigation, meal, selectedDate) => {
  const [isScanning, setIsScanning] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
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

        navigation.navigate('FoodDetail', { 
          food: transformedProduct, 
          meal, 
          selectedDate,
          returnToBarcodeScanner: true
        });

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
      `No product found with barcode: ${barcode}`,
      [
        {
          text: 'Create Custom Food',
          onPress: () => {
            navigation.navigate('CustomFood', {
              barcode,
              type: 'foodWithBarcode',
              meal,
              selectedDate,
              returnToBarcodeScanner: true
            });
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

  const resumeScanning = useCallback(() => {
    setCurrentProduct(null);
    setIsScanning(true);
  }, []);

  return {
    isScanning,
    loadingProduct,
    currentProduct,
    instructionsVisible,
    successOpacity,
    errorOpacity,
    handleBarcodeScanned,
    resumeScanning,
  };
};
