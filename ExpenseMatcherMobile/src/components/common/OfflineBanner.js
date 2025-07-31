import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetwork } from '../../contexts/NetworkContext';

const OfflineBanner = ({ style = {} }) => {
  const { theme } = useTheme();
  const { isConnected, isInternetReachable } = useNetwork();
  
  // Only show banner when offline
  if (isConnected && isInternetReachable) {
    return null;
  }
  
  return (
    <Animated.View style={[styles.container, style]}>
      <View style={[styles.banner, { backgroundColor: theme.colors.error }]}>
        <Icon name="cloud-off" size={20} color="#FFFFFF" />
        <Text style={styles.bannerText}>You are currently offline</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default OfflineBanner;