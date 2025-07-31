import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/ThemeContext';
import { useNetwork } from '../../contexts/NetworkContext';

const SyncStatusIndicator = ({ 
  isSyncing = false, 
  syncProgress = 0, 
  lastSyncTime = null,
  onSyncPress = null,
  style = {}
}) => {
  const { theme } = useTheme();
  const { isConnected, isInternetReachable } = useNetwork();
  
  const getStatusInfo = () => {
    if (isSyncing) {
      return {
        text: 'Syncing...',
        icon: 'sync',
        color: theme.colors.primary,
        backgroundColor: theme.colors.primary + '20',
      };
    }
    
    if (!isConnected || !isInternetReachable) {
      return {
        text: 'Offline',
        icon: 'cloud-off',
        color: theme.colors.textSecondary,
        backgroundColor: theme.colors.textSecondary + '20',
      };
    }
    
    if (lastSyncTime) {
      const timeDiff = Math.floor((Date.now() - new Date(lastSyncTime).getTime()) / 1000 / 60);
      if (timeDiff < 1) {
        return {
          text: 'Up to date',
          icon: 'check-circle',
          color: theme.colors.success || '#4CAF50',
          backgroundColor: (theme.colors.success || '#4CAF50') + '20',
        };
      } else if (timeDiff < 60) {
        return {
          text: `${timeDiff}m ago`,
          icon: 'check-circle',
          color: theme.colors.success || '#4CAF50',
          backgroundColor: (theme.colors.success || '#4CAF50') + '20',
        };
      } else {
        const hours = Math.floor(timeDiff / 60);
        return {
          text: `${hours}h ago`,
          icon: 'check-circle',
          color: theme.colors.warning || '#FFC107',
          backgroundColor: (theme.colors.warning || '#FFC107') + '20',
        };
      }
    }
    
    return {
      text: 'Ready to sync',
      icon: 'cloud-queue',
      color: theme.colors.primary,
      backgroundColor: theme.colors.primary + '20',
    };
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <TouchableOpacity 
      style={[styles.container, style]}
      onPress={onSyncPress}
      disabled={!onSyncPress}
    >
      <View style={[
        styles.indicator, 
        { backgroundColor: statusInfo.backgroundColor }
      ]}>
        <Icon 
          name={statusInfo.icon} 
          size={16} 
          color={statusInfo.color}
          style={isSyncing ? styles.syncingIcon : null}
        />
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.text}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  syncingIcon: {
    // Animation would be added here in a real implementation
  },
});

export default SyncStatusIndicator;