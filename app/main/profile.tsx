import { logout } from '@/services/authServices';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const profile = () => {
  return (
    <View>
      <Text>profile</Text>
      <TouchableOpacity onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default profile;

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
