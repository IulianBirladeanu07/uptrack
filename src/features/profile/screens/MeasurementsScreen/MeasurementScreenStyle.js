import { StyleSheet, Dimensions, PixelRatio } from 'react-native';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

// Scale function for responsive font sizes and dimensions
const scale = size => PixelRatio.get() * size;

// Colors
const colors = {
  backgroundDark: '#02202B',
  accentBlue: '#00bfff',
  accentTeal: '#008080',
  textPrimary: '#FFFFFF',
  shadowColor: '#000',
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: windowWidth * 0.05, // 5% of screen width
  },
  backButton: {
    position: 'absolute',
    top: windowHeight * 0.05, // Adjusted for 5% of screen height
    left: windowWidth * 0.05, // Adjusted for 5% of screen width
    zIndex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    marginVertical: windowHeight * 0.03, // 3% vertical margin
  },
  circleContainer: {
    width: windowWidth * 0.25, // 25% of screen width
    height: windowWidth * 0.25,
    borderRadius: windowWidth * 0.125, // Half of width to make a circle
    borderWidth: 2,
    borderColor: colors.accentBlue,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSummary: {
    alignItems: 'center',
  },
  header: {
    fontSize: scale(7), // Responsive font size
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: windowHeight * 0.02,
  },
  detailsSection: {
    width: '100%',
    paddingHorizontal: windowWidth * 0.025, // 2.5% horizontal padding
  },
  measurementInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: windowHeight * 0.015, // 1.5% vertical margin
  },
  measurementLabel: {
    fontSize: scale(4), // Responsive font size
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.backgroundDark,
    color: colors.textPrimary,
    padding: scale(4), // Responsive padding
    borderRadius: 5,
    fontSize: scale(3.5),
    flex: 1,
    textAlign: 'center',
    marginHorizontal: windowWidth * 0.01, // 1% horizontal margin
    borderWidth: 1,
    borderColor: colors.accentBlue,
  },
  card: {
    backgroundColor: colors.backgroundDark,
    borderRadius: 10,
    padding: scale(4), // Responsive padding
    marginBottom: windowHeight * 0.02, // 2% vertical margin
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  icon: {
    marginRight: scale(2), // Responsive margin
  },
  measurementLabelCard: {
    fontSize: scale(4), // Responsive font size
    color: colors.textPrimary,
    flex: 1,
  },
  inputCard: {
    backgroundColor: colors.backgroundDark,
    color: colors.textPrimary,
    padding: scale(3.5),
    borderRadius: 5,
    fontSize: scale(3.5),
    flex: 2,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.accentBlue,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: windowHeight * 0.02, // 2% vertical margin
  },
  saveButton: {
    flex: 1,
    marginRight: scale(2),
    shadowColor: colors.shadowColor,
    backgroundColor: colors.accentTeal,
    padding: scale(4.5),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: scale(4.5),
    fontWeight: 'bold',
  },
});

export default styles;
