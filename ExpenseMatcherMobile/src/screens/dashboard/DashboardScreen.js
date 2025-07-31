import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Appbar, Card, Button } from 'react-native-paper';
import { useTheme } from '../../contexts/ThemeContext';
import { useOfflineReceipts } from '../../hooks/useOfflineReceipts';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import SyncStatusIndicator from '../../components/common/SyncStatusIndicator';
import OfflineBanner from '../../components/common/OfflineBanner';
import { trackScreenView, trackButtonClick } from '../../services/analyticsService';

const DashboardScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const { receipts, loadReceipts, loading } = useOfflineReceipts();
  const { 
    isSyncing, 
    lastSyncTime, 
    syncError, 
    isConnected, 
    isInternetReachable, 
    triggerManualSync 
  } = useOfflineSync();
  
  const [refreshing, setRefreshing] = useState(false);

  // Track screen view when component mounts
  React.useEffect(() => {
    trackScreenView('DashboardScreen');
  }, []);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReceipts();
    setRefreshing(false);
  };

  const handleSyncPress = () => {
    trackButtonClick('ManualSync', 'DashboardScreen');
    triggerManualSync();
  };

  const handleNavigateToReceipts = () => {
    trackButtonClick('ViewAllReceipts', 'DashboardScreen');
    navigation.navigate('Receipts');
  };

  const handleNavigateToCamera = () => {
    trackButtonClick('OpenCamera', 'DashboardScreen');
    navigation.navigate('Camera');
  };

  const handleNavigateToProfile = () => {
    trackButtonClick('ViewProfile', 'DashboardScreen');
    navigation.navigate('Profile');
  };

  const totalReceipts = receipts.length;
  const totalAmount = receipts.reduce((sum, receipt) => {
    const amount = parseFloat(receipt.amount?.replace('$', '')) || 0;
    return sum + amount;
  }, 0);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      marginHorizontal: 8,
      elevation: 4,
    },
    statTitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    button: {
      marginVertical: 8,
    },
  });

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <Appbar.Header>
        <Appbar.Content title="Dashboard" />
        <SyncStatusIndicator 
          isSyncing={isSyncing} 
          lastSyncTime={lastSyncTime}
          onSyncPress={handleSyncPress}
        />
      </Appbar.Header>
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statTitle}>Total Receipts</Text>
              <Text style={styles.statValue}>{totalReceipts}</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content>
              <Text style={styles.statTitle}>Total Amount</Text>
              <Text style={styles.statValue}>${totalAmount.toFixed(2)}</Text>
            </Card.Content>
          </Card>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Button 
            mode="contained" 
            onPress={handleNavigateToCamera}
            style={styles.button}
          >
            Capture Receipt
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={handleNavigateToReceipts}
            style={styles.button}
          >
            View All Receipts
          </Button>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Button 
            mode="outlined" 
            onPress={handleNavigateToProfile}
            style={styles.button}
          >
            View Profile
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

export default DashboardScreen;