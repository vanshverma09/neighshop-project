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
  Alert
} from 'react-native';
import { sellerApi } from '../api/apiClient';
import { IEnquiry } from '../types/enquiry.types';

interface InquiriesScreenProps {
  navigation: any;
}

export default function InquiriesScreen({ navigation }: InquiriesScreenProps) {
  const [enquiries, setEnquiries] = useState<IEnquiry[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleMarkReplied = async (enquiryId: number) => {
    try {
      await sellerApi.updateEnquiryStatus(enquiryId, 'replied');
      setEnquiries(prev =>
        prev.map(e => (e.id === enquiryId ? { ...e, status: 'replied' } : e))
      );
      Alert.alert('Status Updated', 'Inquiry marked as replied.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
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
            {item.status.toUpperCase()}
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

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => handleCallBuyer(item.phone, item.buyer_name)}
        >
          <Text style={styles.callBtnText}>📞 Call Buyer</Text>
        </TouchableOpacity>

        {item.status !== 'replied' && (
          <TouchableOpacity
            style={styles.replyBtn}
            onPress={() => handleMarkReplied(item.id)}
          >
            <Text style={styles.replyBtnText}>✓ Mark as Replied</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buyer Inquiries</Text>
        <Text style={styles.headerSub}>Manage leads and respond to interested buyers</Text>
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
              <Text style={styles.emptyTitle}>No inquiries found</Text>
              <Text style={styles.emptySub}>
                When buyers inquire about your ads, messages will appear here.
              </Text>
            </View>
          }
        />
      )}
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  callBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#002f34',
    borderRadius: 4,
    marginRight: 8,
  },
  callBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  replyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#00a49f',
    borderRadius: 4,
  },
  replyBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
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
});
