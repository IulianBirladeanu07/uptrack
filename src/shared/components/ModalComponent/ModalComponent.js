import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const ModalComponent = ({ isVisible, message, closeModal, onFinish }) => {
  return (
    <Modal transparent visible={isVisible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity onPress={closeModal} style={styles.modalButtonClose}>
            <Text style={styles.modalButtonText}>Go back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onFinish} style={styles.modalButtonFinish}>
            <Text style={styles.modalButtonText}>Finish</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMessage: {
    fontSize: 18,
    marginBottom: 20,
  },
  modalButtonClose: {
    backgroundColor: '#e71d27',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  modalButtonFinish: {
    backgroundColor: '#008080',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fdf5ec',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});

export default ModalComponent;
