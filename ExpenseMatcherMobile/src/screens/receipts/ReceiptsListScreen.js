import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SyncStatusIndicator from '../../components/common/SyncStatusIndicator';
import OfflineBanner from '../../components/common/OfflineBanner';
import {useNetwork} from '../../contexts/NetworkContext';
import {useOfflineSync} from '../../hooks/useOfflineSync';
import {getReceiptsOffline, saveReceiptOffline, deleteReceiptOffline} from '../../services/offlineStorageService';

// Initial mock data for receipts - in a real app, this would come from storage
const initialReceipts = [
  {
    id: '1',
    merchant: 'Starbucks',
    date: '2023-06-15',
    amount: 42.50,
    category: 'Food & Dining',
    status: 'processed',
    imageUri: 'https://via.placeholder.com/150/4CAF50/FFFFFF?text=Starbucks',
    isSynced: true,
  },
  {
    id: '2',
    merchant: 'Amazon',
    date: '2023-06-10',
    amount: 89.99,
    category: 'Shopping',
    status: 'pending',
    imageUri: 'https://via.placeholder.com/150/2196F3/FFFFFF?text=Amazon',
    isSynced: false,
  },
  {
    id: '3',
    merchant: 'Whole Foods',
    date: '2023-06-05',
    amount: 124.35,
    category: 'Groceries',
    status: 'processed',
    imageUri: 'https://via.placeholder.com/150/FF9800/FFFFFF?text=Whole+Foods',
    isSynced: true,
  },
  {
    id: '4',
    merchant: 'Shell Gas Station',
    date: '2023-06-01',
    amount: 65.20,
    category: 'Transportation',
    status: 'error',
    imageUri: 'https://via.placeholder.com/150/F44336/FFFFFF?text=Shell',
    isSynced: true,
  },
  {
    id: '5',
    merchant: 'Target',
    date: '2023-05-28',
    amount: 78.45,
    category: 'Shopping',
    status: 'processed',
    imageUri: 'https://via.placeholder.com/150/9C27B0/FFFFFF?text=Target',
    isSynced: true,
  },
  {
    id: '6',
    merchant: 'McDonald\'s',
    date: '2023-05-25',
    amount: 12.75,
    category: 'Food & Dining',
    status: 'processed',
    imageUri: 'https://via.placeholder.com/150/FFEB3B/000000?text=McDonalds',
    isSynced: true,
  },
];

// Categories for filtering
const CATEGORIES = [
  'All',
  'Food & Dining',
  'Shopping',
  'Groceries',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Other',
];

// Status options for filtering
const STATUS_OPTIONS = [
  'All',
  'processed',
  'pending',
  'error',
];

const {width} = Dimensions.get('window');

const ReceiptsListScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {isConnected, isInternetReachable} = useNetwork();
  const {isSyncing, lastSyncTime, triggerManualSync} = useOfflineSync();
  const [receipts, setReceipts] = useState(initialReceipts);
  const [filteredReceipts, setFilteredReceipts] = useState(initialReceipts);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isGridView, setIsGridView] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: 'All',
    status: 'All',
    dateRange: {start: '', end: ''},
    amountRange: {min: '', max: ''},
  });
  
  // Sort state
  const [sortOption, setSortOption] = useState('dateDesc');
  
  // Load receipts from storage on component mount
  useEffect(() => {
    loadReceipts();
    loadSearchHistory();
  }, []);

  const loadReceipts = async () => {
    try {
      const storedReceipts = await getReceiptsOffline();
      if (storedReceipts && storedReceipts.length > 0) {
        setReceipts(storedReceipts);
      }
    } catch (error) {
      console.warn('Failed to load receipts from storage:', error);
      // Use initial mock data if storage load fails
      setReceipts(initialReceipts);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('receiptSearchHistory');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  };

  const saveSearchHistory = async (history) => {
    try {
      await AsyncStorage.setItem('receiptSearchHistory', JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  };

  const addToSearchHistory = (query) => {
    if (!query.trim()) return;
    
    const newHistory = [
      query,
      ...searchHistory.filter(item => item !== query)
    ].slice(0, 10); // Keep only last 10 items
    
    setSearchHistory(newHistory);
    saveSearchHistory(newHistory);
  };

  // Apply search and filters
  useEffect(() => {
    let result = [...receipts];
    
    // Apply search filter
    if (searchQuery) {
      result = result.filter(receipt => 
        receipt.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.amount.toString().includes(searchQuery)
      );
    }
    
    // Apply category filter
    if (filters.category !== 'All') {
      result = result.filter(receipt => receipt.category === filters.category);
    }
    
    // Apply status filter
    if (filters.status !== 'All') {
      result = result.filter(receipt => receipt.status === filters.status);
    }
    
    // Apply date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      result = result.filter(receipt => {
        const receiptDate = new Date(receipt.date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        return receiptDate >= startDate && receiptDate <= endDate;
      });
    }
    
    // Apply amount range filter
    if (filters.amountRange.min || filters.amountRange.max) {
      result = result.filter(receipt => {
        const min = parseFloat(filters.amountRange.min) || 0;
        const max = parseFloat(filters.amountRange.max) || Number.MAX_VALUE;
        return receipt.amount >= min && receipt.amount <= max;
      });
    }
    
    // Apply sorting
    switch (sortOption) {
      case 'dateAsc':
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case 'dateDesc':
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case 'amountAsc':
        result.sort((a, b) => a.amount - b.amount);
        break;
      case 'amountDesc':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'merchantAsc':
        result.sort((a, b) => a.merchant.localeCompare(b.merchant));
        break;
      case 'merchantDesc':
        result.sort((a, b) => b.merchant.localeCompare(a.merchant));
        break;
      case 'categoryAsc':
        result.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'categoryDesc':
        result.sort((a, b) => b.category.localeCompare(a.category));
        break;
      default:
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    setFilteredReceipts(result);
  }, [receipts, searchQuery, filters, sortOption]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Refresh receipts from storage
    loadReceipts().then(() => {
      setRefreshing(false);
      Toast.show({
        type: 'success',
        text1: 'Receipts Refreshed',
        text2: 'Your receipt data is up to date',
      });
    }).catch(() => {
      setRefreshing(false);
      Toast.show({
        type: 'error',
        text1: 'Refresh Failed',
        text2: 'Failed to refresh receipts',
      });
    });
  }, [loadReceipts]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      addToSearchHistory(query);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setIsFilterModalVisible(false);
  };

  const resetFilters = () => {
    setFilters({
      category: 'All',
      status: 'All',
      dateRange: {start: '', end: ''},
      amountRange: {min: '', max: ''},
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'processed':
        return 'Processed';
      case 'pending':
        return 'Pending';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const renderReceiptItem = ({item}) => (
    <TouchableOpacity
      style={[
        styles.receiptItem,
        isGridView && styles.receiptItemGrid,
      ]}
      onPress={() => navigation.navigate('ReceiptDetail', {receipt: item})}>
      <Image 
        source={{uri: item.imageUri}} 
        style={[
          styles.receiptImage,
          isGridView && styles.receiptImageGrid,
        ]} 
      />
      <View style={[
        styles.receiptInfo,
        isGridView && styles.receiptInfoGrid,
      ]}>
        <View style={styles.merchantContainer}>
          <Text style={styles.merchantText}>{item.merchant}</Text>
          <View style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(item.status)},
          ]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
        <Text style={styles.categoryText}>{item.category}</Text>
        <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderReceiptGridItem = ({item}) => (
    <TouchableOpacity
      style={styles.receiptGridItem}
      onPress={() => navigation.navigate('ReceiptDetail', {receipt: item})}>
      <Image source={{uri: item.imageUri}} style={styles.receiptGridImage} />
      <View style={styles.receiptGridInfo}>
        <Text style={styles.merchantGridText} numberOfLines={1}>{item.merchant}</Text>
        <Text style={styles.amountGridText}>${item.amount.toFixed(2)}</Text>
        <View style={[
          styles.statusBadgeGrid,
          {backgroundColor: getStatusColor(item.status)},
        ]}>
          <Text style={styles.statusTextGrid}>{getStatusText(item.status)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSearchHistory = () => {
    if (!searchQuery || searchHistory.length === 0) return null;
    
    const filteredHistory = searchHistory.filter(item => 
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (filteredHistory.length === 0) return null;
    
    return (
      <View style={styles.searchHistoryContainer}>
        {filteredHistory.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.searchHistoryItem}
            onPress={() => {
              setSearchQuery(item);
              addToSearchHistory(item);
            }}>
            <Icon name="history" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.searchHistoryText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const FilterModal = () => (
    <Modal
      visible={isFilterModalVisible}
      animationType="slide"
      onRequestClose={() => setIsFilterModalVisible(false)}>
      <View style={[styles.modalContainer, {backgroundColor: theme.colors.background}]}>
        <View style={[styles.modalHeader, {backgroundColor: theme.colors.primary}]}>
          <Text style={styles.modalTitle}>Filters</Text>
          <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.filterOptions}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterOption,
                    filters.category === category && styles.filterOptionSelected,
                    {backgroundColor: theme.colors.surface},
                  ]}
                  onPress={() => setFilters({...filters, category})}>
                  <Text style={[
                    styles.filterOptionText,
                    filters.category === category && styles.filterOptionTextSelected,
                  ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.filterOptions}>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    filters.status === status && styles.filterOptionSelected,
                    {backgroundColor: theme.colors.surface},
                  ]}
                  onPress={() => setFilters({...filters, status})}>
                  <Text style={[
                    styles.filterOptionText,
                    filters.status === status && styles.filterOptionTextSelected,
                  ]}>
                    {getStatusText(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Date Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.dateRangeContainer}>
              <Input
                value={filters.dateRange.start}
                onChangeText={(text) => setFilters({
                  ...filters,
                  dateRange: {...filters.dateRange, start: text}
                })}
                placeholder="Start Date (YYYY-MM-DD)"
                style={styles.dateInput}
              />
              <Input
                value={filters.dateRange.end}
                onChangeText={(text) => setFilters({
                  ...filters,
                  dateRange: {...filters.dateRange, end: text}
                })}
                placeholder="End Date (YYYY-MM-DD)"
                style={styles.dateInput}
              />
            </View>
          </View>
          
          {/* Amount Range Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Amount Range</Text>
            <View style={styles.amountRangeContainer}>
              <Input
                value={filters.amountRange.min}
                onChangeText={(text) => setFilters({
                  ...filters,
                  amountRange: {...filters.amountRange, min: text}
                })}
                placeholder="Min Amount"
                keyboardType="numeric"
                style={styles.amountInput}
              />
              <Text style={styles.amountSeparator}>to</Text>
              <Input
                value={filters.amountRange.max}
                onChangeText={(text) => setFilters({
                  ...filters,
                  amountRange: {...filters.amountRange, max: text}
                })}
                placeholder="Max Amount"
                keyboardType="numeric"
                style={styles.amountInput}
              />
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.modalFooter}>
          <Button
            title="Reset Filters"
            variant="secondary"
            onPress={resetFilters}
            style={styles.resetButton}
          />
          <Button
            title="Apply Filters"
            onPress={() => applyFilters(filters)}
            style={styles.applyButton}
          />
        </View>
      </View>
    </Modal>
  );

  const renderSortOptions = () => (
    <Modal
      visible={false}
      transparent={true}
      animationType="fade">
      <View style={styles.sortModalOverlay}>
        <View style={[styles.sortModal, {backgroundColor: theme.colors.surface}]}>
          {[
            {value: 'dateDesc', label: 'Date (Newest First)'},
            {value: 'dateAsc', label: 'Date (Oldest First)'},
            {value: 'amountDesc', label: 'Amount (Highest First)'},
            {value: 'amountAsc', label: 'Amount (Lowest First)'},
            {value: 'merchantAsc', label: 'Merchant (A-Z)'},
            {value: 'merchantDesc', label: 'Merchant (Z-A)'},
            {value: 'categoryAsc', label: 'Category (A-Z)'},
            {value: 'categoryDesc', label: 'Category (Z-A)'},
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.sortOption}
              onPress={() => {
                setSortOption(option.value);
              }}>
              <Text style={[
                styles.sortOptionText,
                sortOption === option.value && styles.sortOptionTextSelected,
              ]}>
                {option.label}
              </Text>
              {sortOption === option.value && (
                <Icon name="check" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    searchContainer: {
      padding: 10,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchInput: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 10,
      fontSize: 16,
      color: theme.colors.text,
    },
    searchButton: {
      padding: 10,
    },
    filterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 10,
      backgroundColor: theme.colors.surface,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
    },
    filterButtonText: {
      color: theme.colors.text,
      marginRight: 5,
    },
    viewToggleButton: {
      padding: 8,
    },
    activeFiltersContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 10,
      backgroundColor: theme.colors.surface,
    },
    activeFilterBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 4,
      paddingHorizontal: 10,
      marginRight: 8,
      marginBottom: 8,
    },
    activeFilterText: {
      color: '#FFFFFF',
      fontSize: 12,
      marginRight: 4,
    },
    clearFiltersButton: {
      padding: 4,
    },
    searchHistoryContainer: {
      backgroundColor: theme.colors.surface,
      padding: 10,
    },
    searchHistoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    searchHistoryText: {
      color: theme.colors.text,
      marginLeft: 8,
      fontSize: 14,
    },
    listContent: {
      paddingBottom: 20,
    },
    receiptItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    receiptItemGrid: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      padding: 0,
      borderBottomWidth: 0,
      margin: 5,
      width: (width - 30) / 2,
    },
    receiptImage: {
      width: 50,
      height: 50,
      borderRadius: 8,
      marginRight: 15,
    },
    receiptImageGrid: {
      width: '100%',
      height: 120,
      borderRadius: 8,
      marginRight: 0,
    },
    receiptInfo: {
      flex: 1,
    },
    receiptInfoGrid: {
      padding: 10,
      width: '100%',
    },
    merchantContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 5,
    },
    merchantText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      flex: 1,
    },
    merchantGridText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 5,
    },
    statusBadge: {
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    statusBadgeGrid: {
      borderRadius: 12,
      paddingHorizontal: 6,
      paddingVertical: 2,
      alignSelf: 'flex-start',
    },
    statusText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
    statusTextGrid: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
    dateText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 3,
    },
    categoryText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 5,
    },
    amountText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    amountGridText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 5,
    },
    receiptGridItem: {
      width: (width - 30) / 2,
      margin: 5,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    receiptGridImage: {
      width: '100%',
      height: 120,
    },
    receiptGridInfo: {
      padding: 10,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      marginTop: 20,
      textAlign: 'center',
    },
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      padding: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    modalContent: {
      flex: 1,
      padding: 20,
    },
    filterSection: {
      marginBottom: 20,
    },
    filterLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    filterOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    filterOption: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 16,
      margin: 4,
    },
    filterOptionSelected: {
      backgroundColor: theme.colors.primary + '20',
    },
    filterOptionText: {
      color: theme.colors.text,
    },
    filterOptionTextSelected: {
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    dateRangeContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dateInput: {
      flex: 0.48,
    },
    amountRangeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    amountInput: {
      flex: 0.4,
    },
    amountSeparator: {
      marginHorizontal: 10,
      color: theme.colors.text,
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 20,
    },
    resetButton: {
      flex: 0.45,
    },
    applyButton: {
      flex: 0.45,
    },
    sortModalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sortModal: {
      borderRadius: 8,
      padding: 10,
      minWidth: 200,
    },
    sortOption: {
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sortOptionText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    sortOptionTextSelected: {
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.header}>
        <Text style={styles.headerText}>My Receipts</Text>
        <SyncStatusIndicator
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
          onSyncPress={triggerManualSync}
        />
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search receipts..."
          placeholderTextColor={theme.colors.textSecondary}
        />
        {searchQuery ? (
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={clearSearch}>
            <Icon name="clear" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.searchButton}>
            <Icon name="search" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Search History */}
      {renderSearchHistory()}
      
      {/* Filter and View Controls */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setIsFilterModalVisible(true)}>
          <Text style={styles.filterButtonText}>Filters</Text>
          <Icon name="filter-list" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => {
            // In a real implementation, this would open a sort modal
            Alert.alert(
              'Sort Options',
              'Select sorting option',
              [
                {text: 'Date (Newest)', onPress: () => setSortOption('dateDesc')},
                {text: 'Date (Oldest)', onPress: () => setSortOption('dateAsc')},
                {text: 'Amount (High)', onPress: () => setSortOption('amountDesc')},
                {text: 'Amount (Low)', onPress: () => setSortOption('amountAsc')},
                {text: 'Merchant (A-Z)', onPress: () => setSortOption('merchantAsc')},
                {text: 'Merchant (Z-A)', onPress: () => setSortOption('merchantDesc')},
              ]
            );
          }}>
          <Text style={styles.filterButtonText}>Sort</Text>
          <Icon name="sort" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.viewToggleButton}
          onPress={() => setIsGridView(!isGridView)}>
          <Icon 
            name={isGridView ? "view-list" : "view-module"} 
            size={24} 
            color={theme.colors.text} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Active Filters */}
      {(filters.category !== 'All' || 
        filters.status !== 'All' || 
        filters.dateRange.start || 
        filters.dateRange.end || 
        filters.amountRange.min || 
        filters.amountRange.max) && (
        <View style={styles.activeFiltersContainer}>
          {filters.category !== 'All' && (
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterText}>Category: {filters.category}</Text>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => setFilters({...filters, category: 'All'})}>
                <Icon name="clear" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          {filters.status !== 'All' && (
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterText}>Status: {getStatusText(filters.status)}</Text>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => setFilters({...filters, status: 'All'})}>
                <Icon name="clear" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          {(filters.dateRange.start || filters.dateRange.end) && (
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterText}>
                Date: {filters.dateRange.start || '...'} to {filters.dateRange.end || '...'}
              </Text>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => setFilters({...filters, dateRange: {start: '', end: ''}})}>
                <Icon name="clear" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          {(filters.amountRange.min || filters.amountRange.max) && (
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterText}>
                Amount: ${filters.amountRange.min || '0'} - ${filters.amountRange.max || '∞'}
              </Text>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => setFilters({...filters, amountRange: {min: '', max: ''}})}>
                <Icon name="clear" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity 
            style={[styles.filterButton, {padding: 6, marginLeft: 8}]}
            onPress={resetFilters}>
            <Text style={styles.filterButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Receipts List */}
      {filteredReceipts.length > 0 ? (
        <FlatList
          data={filteredReceipts}
          renderItem={isGridView ? renderReceiptGridItem : renderReceiptItem}
          keyExtractor={item => item.id}
          numColumns={isGridView ? 2 : 1}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={() => {
            // In a real implementation, this would load more receipts
            if (!loading) {
              setLoading(true);
              setTimeout(() => setLoading(false), 1000);
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading more receipts...</Text>
              </View>
            ) : null
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="receipt" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>
            {searchQuery || 
            filters.category !== 'All' || 
            filters.status !== 'All' || 
            filters.dateRange.start || 
            filters.dateRange.end || 
            filters.amountRange.min || 
            filters.amountRange.max
              ? 'No receipts match your search or filters'
              : 'No receipts found. Add some receipts to get started!'}
          </Text>
          <Button
            title="Add Receipts"
            onPress={() => navigation.navigate('Gallery')}
            style={{marginTop: 20, width: '60%'}}
          />
        </View>
      )}
      
      {/* Filter Modal */}
      <FilterModal />
      
      {/* Sort Options Modal */}
      {renderSortOptions()}
      
      <Toast />
    </View>
  );
};

export default ReceiptsListScreen;