import { StyleSheet, Dimensions } from 'react-native';

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#02111B',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf5ec',
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    width: windowWidth - 40,
    maxWidth: 400,
  },
  input: {
    flex: 1,
    color: '#000000',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#e71d27',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    width: windowWidth - 40,
    maxWidth: 400,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  error: {
    color: '#FF6347',
    marginTop: 10,
    textAlign: 'center',
  },
  passwordStrengthIndicator: {
    marginLeft: 10,
    fontSize: 16,
  },
});

export default styles;
