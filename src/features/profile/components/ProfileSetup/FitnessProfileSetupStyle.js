import { StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#02111B',
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(30),
    paddingTop: normalize(20),
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: normalize(15),
  },
  progressBarContainer: {
    height: normalize(6),
    backgroundColor: '#333',
    borderRadius: normalize(50),
    overflow: 'hidden',
    width: '85%',
    alignSelf: 'center',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFA726',
    borderRadius: normalize(50),
  },
});

export default styles;
