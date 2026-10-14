import { StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: normalize(50),
    paddingBottom: normalize(10),
    paddingHorizontal: normalize(15),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: normalize(5),
    fontSize: normalize(16),
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: normalize(50),
    left: normalize(20),
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: normalize(20),
    backgroundColor: 'white',
  },
  button: {
    marginTop: normalize(20),
    backgroundColor: '#2196F3',
    padding: normalize(10),
    borderRadius: normalize(5),
    width: normalize(200),
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scanningAreaOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scanningAreaBorder: {
    height: normalize(200),
    width: normalize(300),
    borderWidth: normalize(2),
    borderColor: '#00FFFF',
    borderRadius: normalize(10),
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  cornerDecoration: {
    position: 'absolute',
    width: normalize(20),
    height: normalize(20),
    borderColor: '#00FFFF',
    backgroundColor: 'transparent',
  },
  scanLine: {
    width: '100%',
    height: normalize(2),
    backgroundColor: '#00FFFF',
  },
  feedbackOverlay: {
    position: 'absolute',
    width: normalize(300),
    height: normalize(200),
    borderRadius: normalize(10),
  },
  instructions: {
    position: 'absolute',
    bottom: normalize(-60),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: normalize(10),
    borderRadius: normalize(5),
  },
  instructionsText: {
    color: 'white',
    textAlign: 'center',
  },
  productInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  productInfoCard: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: normalize(10),
    padding: normalize(20),
    elevation: normalize(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: normalize(2) },
    shadowOpacity: 0.25,
    shadowRadius: normalize(3.84),
  },
  productTitle: {
    fontSize: normalize(24),
    fontWeight: 'bold',
    marginBottom: normalize(5),
  },
  productBarcode: {
    fontSize: normalize(14),
    color: '#666',
    marginBottom: normalize(10),
  },
  productPrice: {
    fontSize: normalize(20),
    fontWeight: 'bold',
    color: 'green',
    marginBottom: normalize(15),
  },
  productDescription: {
    fontSize: normalize(16),
    color: '#333',
    marginBottom: normalize(20),
  },
  actionButtons: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#2196F3',
    padding: normalize(15),
    borderRadius: normalize(5),
    marginVertical: normalize(5),
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
  },
  secondaryButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: normalize(16),
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingIndicator: {
    backgroundColor: 'white',
    padding: normalize(20),
    borderRadius: normalize(10),
    alignItems: 'center',
  },
  loadingText: {
    marginTop: normalize(10),
    fontSize: normalize(16),
  },
});

export default styles;
