import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { sellerApi } from '../api/apiClient';
import { IEnquiry } from '../types/enquiry.types';

interface InquiriesScreenProps {
  navigation: any;
}

const QUICK_REPLIES = [
  'Yes, the item is available for inspection in person.',
  'Price is slightly negotiable if collected today.',
  'Original invoice, box, and accessories are all included.',
  'Please call me directly to coordinate the pickup time.',
];

export default function InquiriesScreen({ navigation }: InquiriesScreenProps) {
  const [enquiries, setEnquiries] = useState<IEnquiry[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reply Modal State
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<IEnquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const fetchEnquiries = async () => {
    try {
      const res = await sellerApi.getSellerEnquiries();
      setEnquiries(res.enquiries || []);
    } catch (err: any) {
      console.warn('Error loading inquiries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchEnquiries();
    });
    fetchEnquiries();
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEnquiries();
  };

  const handleOpenReplyModal = (enquiry: IEnquiry) => {
    setSelectedEnquiry(enquiry);
    setReplyText(enquiry.reply || QUICK_REPLIES[0]);
    setReplyModalVisible(true);
  };

  const handleSendReply = async () => {
    if (!selectedEnquiry) return;
    if (!replyText.trim()) {
      Alert.alert('Required Message', 'Please enter a reply message for the buyer.');
      return;
    }

    setSendingReply(true);
    try {
      await sellerApi.replyToEnquiry(selectedEnquiry.id, replyText.trim());
      setEnquiries(prev =>
        prev.map(e =>
          e.id === selectedEnquiry.id
            ? { ...e, status: 'replied', reply: replyText.trim() }
            : e
        )
      );
      setReplyModalVisible(false);
      Alert.alert('Reply Sent! 💬', 'Your response has been delivered to the buyer.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to deliver reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleCallBuyer = (phone?: string | null, buyerName?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'This buyer did not share a direct phone number.');
      return;
    }
    Alert.alert(
      `Contact ${buyerName || 'Buyer'}`,
      `Phone Number: ${phone}\n\nCall buyer directly to arrange a viewing?`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Copy Number', onPress: () => Alert.alert('Copied', `${phone} copied to clipboard.`) }
      ]
    );
  };

  const filteredEnquiries = enquiries.filter(e => {
    if (filter === 'all') return true;
    return e.status === filter;
  });

  const renderEnquiryItem = ({ item }: { item: IEnquiry }) => (
    <View style={styles.card}>
      {/* Product Reference Header */}
      <View style={styles.adHeader}>
        <Image
          source={{ uri: item.ad_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=120' }}
          style={styles.adThumb}
        />
        <View style={styles.adInfo}>
          <Text style={styles.adTitle} numberOfLines={1}>{item.ad_title || 'Advertisement'}</Text>
          <Text style={styles.adPrice}>₹{Number(item.ad_price || 0).toLocaleString('en-IN')}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'replied' ? styles.statusReplied : styles.statusPending]}>
          <Text style={[styles.statusText, item.status === 'replied' ? styles.statusTextReplied : styles.statusTextPending]}>
            {item.status === 'replied' ? '✓ REPLIED' : '⏳ PENDING'}
          </Text>
        </View>
      </View>

      {/* Buyer Message Body */}
      <View style={styles.messageBox}>
        <View style={styles.buyerRow}>
          <Text style={styles.buyerName}>👤 {item.buyer_name || 'Prospective Buyer'}</Text>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.messageText}>"{item.message}"</Text>
        {item.phone && (
          <Text style={styles.phoneText}>📞 Buyer Phone: {item.phone}</Text>
        )}
      </View>

      {/* Seller Reply Card if already replied */}
      {item.reply ? (
        <View style={styles.replyBox}>
          <Text style={styles.replyHeader}>🏪 Your Sent Response:</Text>
          <Text style={styles.replyBody}>"{item.reply}"</Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => handleCallBuyer(item.phone, item.buyer_name)}
        >
          <Text style={styles.callBtnText}>📞 Call Buyer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.replyBtn, item.status === 'replied' && styles.replyBtnSecondary]}
          onPress={() => handleOpenReplyModal(item)}
        >
          <Text style={[styles.replyBtnText, item.status === 'replied' && styles.replyBtnTextSecondary]}>
            {item.status === 'replied' ? '💬 Update Reply' : '💬 Send Reply'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buyer Inquiries & Leads</Text>
        <Text style={styles.headerSub}>Manage leads and respond to prospective buyers directly</Text>
      </View>

      {/* Filters */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'all', label: `All (${enquiries.length})` },
          { key: 'pending', label: `Pending (${enquiries.filter(e => e.status === 'pending').length})` },
          { key: 'replied', label: `Replied (${enquiries.filter(e => e.status === 'replied').length})` },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
            onPress={() => setFilter(tab.key as any)}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00a49f" />
        </View>
      ) : (
        <FlatList
          data={filteredEnquiries}
          keyExtractor={item => item.id.toString()}
          renderItem={renderEnquiryItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00a49f']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No inquiries in this tab</Text>
              <Text style={styles.emptySub}>
                When buyers inquire about your ads, messages will appear here.
              </Text>
            </View>
          }
        />
      )}

      {/* Reply Modal */}
      <Modal
        visible={replyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReplyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reply to Buyer</Text>
              <TouchableOpacity onPress={() => setReplyModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedEnquiry && (
              <View style={styles.buyerPreview}>
                <Text style={styles.buyerPreviewName}>From: {selectedEnquiry.buyer_name}</Text>
                <Text style={styles.buyerPreviewMsg}>"{selectedEnquiry.message}"</Text>
              </View>
            )}

            <Text style={styles.quickRepliesTitle}>Quick responses:</Text>
            <View style={styles.quickRepliesRow}>
              {QUICK_REPLIES.map((quick, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.quickReplyChip}
                  onPress={() => setReplyText(quick)}
                >
                  <Text style={styles.quickReplyText} numberOfLines={1}>{quick}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.replyInputLabel}>Your Response Message *</Text>
            <TextInput
              style={styles.replyInput}
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Type your response to the buyer..."
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setReplyModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sendBtn, sendingReply && styles.sendBtnDisabled]}
                onPress={handleSendReply}
                disabled={sendingReply}
              >
                {sendingReply ? (
                  <ActivityIndicator color="#002f34" size="small" />
                ) : (
                  <Text style={styles.sendBtnText}>SEND REPLY TO BUYER</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f6',
  },
  header: {
    backgroundColor: '#002f34',
    padding: 16,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 12,
    color: '#00a49f',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#00a49f',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  tabTextActive: {
    color: '#002f34',
    fontWeight: '800',
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
    paddingBottom: 10,
    marginBottom: 10,
  },
  adThumb: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#eee',
  },
  adInfo: {
    flex: 1,
    marginLeft: 10,
  },
  adTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#002f34',
  },
  adPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00a49f',
    marginTop: 1,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusReplied: {
    backgroundColor: '#d1fae5',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextPending: {
    color: '#92400e',
  },
  statusTextReplied: {
    color: '#065f46',
  },
  messageBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#00a49f',
  },
  buyerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  buyerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
  },
  dateText: {
    fontSize: 10,
    color: '#888888',
  },
  messageText: {
    fontSize: 13,
    color: '#111827',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  phoneText: {
    fontSize: 11,
    color: '#00796b',
    fontWeight: '600',
    marginTop: 6,
  },
  replyBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  replyHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 2,
  },
  replyBody: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  callBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#002f34',
    borderRadius: 5,
    marginRight: 8,
  },
  callBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  replyBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#00a49f',
    borderRadius: 5,
  },
  replyBtnSecondary: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  replyBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  replyBtnTextSecondary: {
    color: '#374151',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002f34',
  },
  emptySub: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#002f34',
  },
  modalClose: {
    fontSize: 18,
    color: '#888',
    padding: 4,
  },
  buyerPreview: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#002f34',
  },
  buyerPreviewName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  buyerPreviewMsg: {
    fontSize: 12,
    color: '#4b5563',
    fontStyle: 'italic',
    marginTop: 2,
  },
  quickRepliesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 6,
  },
  quickRepliesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  quickReplyChip: {
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxWidth: '90%',
  },
  quickReplyText: {
    fontSize: 11,
    color: '#374151',
  },
  replyInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
    marginTop: 4,
  },
  replyInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    height: 90,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '600',
  },
  sendBtn: {
    backgroundColor: '#ffce32',
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 6,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendBtnText: {
    color: '#002f34',
    fontSize: 12,
    fontWeight: '800',
  },
});
