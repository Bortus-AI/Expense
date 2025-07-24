import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const DashboardScreen = ({ navigation }) => {
  const { user, currentCompany, getTransactions, getReceipts, getMatches, logout } = useAuth();
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalReceipts: 0,
    pendingMatches: 0,
    matchRate: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [transactionsData, receiptsData, matchesData] = await Promise.all([
        getTransactions(1, 100),
        getReceipts(1, 100),
        getMatches(),
      ]);

      const totalTransactions = transactionsData.transactions?.length || 0;
      const totalReceipts = receiptsData.receipts?.length || 0;
      const totalMatches = matchesData.matches?.length || 0;
      const pendingMatches = matchesData.matches?.filter(m => m.match_status === 'pending')?.length || 0;
      
      const matchRate = totalTransactions > 0 ? Math.round((totalMatches / totalTransactions) * 100) : 0;

      setStats({
        totalTransactions,
        totalReceipts,
        pendingMatches,
        matchRate,
      });
    } catch (error) {
      console.error('Dashboard data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.firstName || 'User'}! 👋
          </Text>
          {currentCompany && (
            <Text style={styles.company}>{currentCompany.name}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Text style={styles.statNumber}>{stats.totalTransactions}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          <View style={[styles.statCard, styles.secondaryCard]}>
            <Text style={styles.statNumber}>{stats.totalReceipts}</Text>
            <Text style={styles.statLabel}>Receipts</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.warningCard]}>
            <Text style={styles.statNumber}>{stats.pendingMatches}</Text>
            <Text style={styles.statLabel}>Pending Matches</Text>
          </View>
          <View style={[styles.statCard, styles.successCard]}>
            <Text style={styles.statNumber}>{stats.matchRate}%</Text>
            <Text style={styles.statLabel}>Match Rate</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.actionIcon}>📷</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Capture Receipt</Text>
            <Text style={styles.actionSubtitle}>Take a photo of your receipt</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Transactions')}
        >
          <Text style={styles.actionIcon}>💳</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View Transactions</Text>
            <Text style={styles.actionSubtitle}>Browse your transaction history</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Matches')}
        >
          <Text style={styles.actionIcon}>🔗</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Review Matches</Text>
            <Text style={styles.actionSubtitle}>Confirm or reject receipt matches</Text>
          </View>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>
            Last updated: {format(new Date(), 'MMM dd, yyyy at h:mm a')}
          </Text>
          <Text style={styles.activitySubtext}>
            Pull down to refresh your data
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  company: {
    fontSize: 16,
    color: '#667eea',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  secondaryCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#48bb78',
  },
  warningCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ed8936',
  },
  successCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#38a169',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionArrow: {
    fontSize: 20,
    color: '#667eea',
    fontWeight: 'bold',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  activitySubtext: {
    fontSize: 12,
    color: '#666',
  },
});

export default DashboardScreen; 