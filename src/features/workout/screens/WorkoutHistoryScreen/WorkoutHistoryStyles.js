import { StyleSheet } from 'react-native';
import { normalize } from '../../../../shared/hooks/useResponsive';

export const styles = StyleSheet.create({
    container: {
      padding: normalize(10),
      flex: 1,
      backgroundColor: '#02111B',
    },
    heading: {
      fontSize: normalize(28),
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginVertical: normalize(20),
      },
    itemContainer: {
      padding: normalize(5),
      marginVertical:normalize(10),
    },
});

export default styles;
