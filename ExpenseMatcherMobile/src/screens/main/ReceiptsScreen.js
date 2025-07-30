import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 30) / 2;

const ReceiptsScreen = ({ navigation }) => {
  const { getReceipts } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);

  const loadReceipts = useCallback(async (page = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      
      const response = await getReceipts(page, 20);
      const newReceipts = response.receipts || [];
      
      if (append) {
        setReceipts(prev => [...prev, ...newReceipts]);
        setFilteredReceipts(prev => [...prev, ...newReceipts]);
      } else {
        setReceipts(newReceipts);
        setFilteredReceipts(newReceipts);
      }
      
      setHasMoreData(newReceipts.length === 20);
      setCurrentPage(page);
    } catch (error) {
      console.error('Load receipts error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load receipts',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getReceipts]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredReceipts(receipts);
    } else {
      const filtered = receipts.filter(receipt =>
        receipt.originalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.amount?.toString().includes(searchQuery)
      );
      setFilteredReceipts(filtered);
    }
  }, [searchQuery, receipts]);

  const onRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    loadReceipts(1, false);
  };

  const loadMoreData = () => {
    if (!loading && hasMoreData) {
      loadReceipts(currentPage + 1, true);
    }
  };

  const openReceiptModal = (receipt) => {
    setSelectedReceipt(receipt);
    setModalVisible(true);
  };

  const closeReceiptModal = () => {
    setSelectedReceipt(null);
    setModalVisible(false);
  };

  const deleteReceipt = (receiptId) => {
    Alert.alert(
      'Delete Receipt',
      'Are you sure you want to delete this receipt?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Implement delete logic here
            Toast.show({
              type: 'info',
              text1: 'Delete Feature',
              text2: 'Delete functionality will be implemented',
            });
          }
        },
      ]
    );
  };

  const formatAmount = (amount) => {
    return amount ? `$${parseFloat(amount).toFixed(2)}` : 'N/A';
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Unknown date';
    }
  };

  const renderReceiptCard = ({ item: receipt }) => (
    <TouchableOpacity 
      style={styles.receiptCard}
      onPress={() => openReceiptModal(receipt)}
    >
      <View style={styles.receiptImageContainer}>
        {receipt.filePath ? (
          <Image 
            source={{ uri: `${receipt.filePath}?${Date.now()}` }}
            style={styles.receiptThumbnail}
            defaultSource={require('../../../assets/receipt-placeholder.png')}
          />
        ) : (
          <View style={styles.receiptPlaceholder}>
            <Text style={styles.placeholderText}>📄</Text>
          </View>
        )}
        
        <View style={styles.receiptOverlay}>
          <Text style={styles.receiptAmount}>{formatAmount(receipt.amount)}</Text>
        </View>
      </View>
      
      <View style={styles.receiptInfo}>
        <Text style={styles.receiptName} numberOfLines={1}>
          {receipt.originalName || 'Unnamed Receipt'}
        </Text>
        <Text style={styles.receiptDate}>
          {formatDate(receipt.uploadDate)}
        </Text>
        
        {receipt.description && (
          <Text style={styles.receiptDescription} numberOfLines={2}>
            {receipt.description}
          </Text>
        )}
        
        <View style={styles.receiptStatus}>
          <View style={[
            styles.statusIndicator,
            receipt.processedAt ? styles.statusProcessed : styles.statusPending
          ]}>
            <Text style={styles.statusText}>
              {receipt.processedAt ? '✓ Processed' : '⏳ Processing'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📱</Text>
      <Text style={styles.emptyTitle}>No Receipts Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start capturing receipts with your camera to see them here
      </Text>
      <TouchableOpacity
        style={styles.cameraButton}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.cameraButtonText}>📷 Take Photo</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReceiptModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      onRequestClose={closeReceiptModal}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeReceiptModal}>
            <Text style={styles.modalCloseButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Receipt Details</Text>
          <TouchableOpacity onPress={() => deleteReceipt(selectedReceipt?.id)}>
            <Text style={styles.modalDeleteButton}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {selectedReceipt && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalImageContainer}>
              {selectedReceipt.filePath ? (
                <Image 
                  source={{ uri: selectedReceipt.filePath }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.modalImagePlaceholder}>
                  <Text style={styles.placeholderText}>📄</Text>
                  <Text style={styles.placeholderSubtext}>No image available</Text>
                </View>
              )}
            </View>

            <View style={styles.modalDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>{formatAmount(selectedReceipt.amount)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>{formatDate(selectedReceipt.uploadDate)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>File Name:</Text>
                <Text style={styles.detailValue}>{selectedReceipt.originalName || 'N/A'}</Text>
              </View>

              {selectedReceipt.description && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{selectedReceipt.description}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[
                  styles.detailValue,
                  selectedReceipt.processedAt ? styles.statusProcessedText : styles.statusPendingText
                ]}>
                  {selectedReceipt.processedAt ? 'Processed' : 'Processing...'}
                </Text>
              </View>

              {selectedReceipt.extractedText && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Extracted Text:</Text>
                  <Text style={styles.detailValue}>{selectedReceipt.extractedText}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search receipts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Camera')}
        >
          <Text style={styles.addButtonText}>📷</Text>
        </TouchableOpacity>
      </View>

      {loading && receipts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading receipts...</Text>
        </View>
      ) : filteredReceipts.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredReceipts}
          renderItem={renderReceiptCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.receiptsList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={['#667eea']}
            />
          }
          onEndReached={loadMoreData}
          onEndReachedThreshold={0.1}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderReceiptModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  searchContainer: {
    flex: 1,
    marginRight: 10,
  },
  searchInput: {
    backgroundColor: '#f0f4f8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#718096',
  },
  receiptsList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  receiptCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  receiptImageContainer: {
    position: 'relative',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  receiptThumbnail: {
    width: '100%',
    height: '100%',
  },
  receiptPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  receiptOverlay: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  receiptAmount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  receiptInfo: {
    padding: 12,
  },
  receiptName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 12,
    color: '#718096',
    marginBottom: 4,
  },
  receiptDescription: {
    fontSize: 12,
    color: '#4a5568',
    marginBottom: 6,
    lineHeight: 16,
  },
  receiptStatus: {
    alignItems: 'flex-start',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusProcessed: {
    backgroundColor: '#c6f6d5',
  },
  statusPending: {
    backgroundColor: '#fef5e7',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  cameraButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  cameraButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    paddingTop: 50, // Account for status bar
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  modalDeleteButton: {
    fontSize: 20,
  },
  modalContent: {
    flex: 1,
  },
  modalImageContainer: {
    height: 300,
    backgroundColor: '#f8f9fa',
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#718096',
    marginTop: 10,
  },
  modalDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f8',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4a5568',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#2d3748',
    flex: 2,
    textAlign: 'right',
  },
  statusProcessedText: {
    color: '#38a169',
    fontWeight: '600',
  },
  statusPendingText: {
    color: '#d69e2e',
    fontWeight: '600',
  },
});

export default ReceiptsScreen; 