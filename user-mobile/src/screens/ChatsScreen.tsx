import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl
} from 'react-native';
import { userApi, getAuthToken, subscribeAuthChange } from '../api/apiClient';
import { IEnquiry } from '../types/enquiry.types';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';

interface ChatsScreenProps {
  navigation: any;
}

export default function ChatsScreen({ navigation }: ChatsScreenProps) {
  const [enquiries, setEnquiries] = useState<IEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!getAuthToken());

  const fetchChats = useCallback(async () => {
    if (!getAuthToken()) {
      setIsLoggedIn(false);
      setEnquiries([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setIsLoggedIn(true);
    try {
      const res = await userApi.getBuyerEnquiries();
      setEnquiries(res.enquiries || []);
    } catch (err: any) {
      console.warn('Error fetching buyer enquiries:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
    const unsubNav = navigation.addListener('focus', fetchChats);
    const unsubAuth = subscribeAuthChange(() => fetchChats());
    return () => {
      unsubNav();
      unsubAuth();
    };
  }, [navigation, fetchChats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChats();
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats & Inquiries</Text>
        </View>
        <EmptyState
          icon="💬"
          title="Sign in to View Conversations"
          description="Send messages to sellers on any listing and track replies in real time."
          actionLabel="Sign In / Register"
          onAction={() => navigation.navigate('Login')}
        />
      </View>
    );
  }

  if (loading && !refreshing) {
    return <LoadingView message="Loading your conversations..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats & Inquiries</Text>
        <Text style={styles.headerSub}>
          {enquiries.length} {enquiries.length === 1 ? 'inquiry' : 'inquiries'} sent to sellers
        </Text>
      </View>

      {/* Inquiries Thread List */}
      <FlatList
        data={enquiries}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00a49f']} />
        }
        renderItem={({ item }) => {
          const isReplied = !!item.reply;
          const sentDate = item.created_at
            ? new Date(item.created_at).toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric'
              })
            : '';

          return (
            <View style={styles.card}>
              {/* Ad Header Info */}
              <TouchableOpacity
                style={styles.adHeader}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('ProductDetail', { adId: item.advertisement_id })
                }
              >
                <Image
                  source={{
                    uri:
                      item.ad_image ||
                      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200'
                  }}
                  style={styles.adThumb}
                />
                <View style={styles.adDetails}>
                  <Text style={styles.adTitle} numberOfLines={1}>
                    {item.ad_title || 'Advertisement'}
                  </Text>
                  {item.ad_price && (
                    <Text style={styles.adPrice}>
                      ₹{Number(item.ad_price).toLocaleString('en-IN')}
                    </Text>
                  )}
                  <Text style={styles.sellerName}>Seller: {item.seller_name || 'Community Seller'}</Text>
                </View>
                <View style={[styles.statusBadge, isReplied ? styles.statusReplied : styles.statusPending]}>
                  <Text style={[styles.statusText, isReplied ? styles.statusRepliedText : styles.statusPendingText]}>
                    {isReplied ? '✓ Replied' : '⏳ Pending'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Buyer Message Bubble */}
              <View style={styles.buyerBubbleContainer}>
                <View style={styles.buyerBubble}>
                  <Text style={styles.bubbleLabel}>You asked ({sentDate}):</Text>
                  <Text style={styles.buyerMessageText}>{item.message}</Text>
                </View>
              </View>

              {/* Seller Reply Bubble (if replied) */}
              {isReplied ? (
                <View style={styles.sellerReplyContainer}>
                  <View style={styles.sellerReplyBubble}>
                    <Text style={styles.sellerReplyHeader}>
                      💬 {item.seller_name || 'Seller'} responded:
                    </Text>
                    <Text style={styles.sellerReplyText}>{item.reply}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.waitingContainer}>
                  <Text style={styles.waitingText}>
                    Waiting for seller to respond. You will see their reply here once posted.
                  </Text>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="💬"
            title="No Active Conversations"
            description="When you send a message to a seller regarding an advertisement, your inquiry thread and replies will appear here."
            actionLabel="Discover Products"
            onAction={() => navigation.navigate('Home')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    backgroundColor: '#002f34',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  adThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    marginRight: 10,
  },
  adDetails: {
    flex: 1,
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
  sellerName: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusPendingText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '700',
  },
  statusReplied: {
    backgroundColor: '#dcfce7',
  },
  statusRepliedText: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '700',
  },
  buyerBubbleContainer: {
    padding: 12,
    alignItems: 'flex-end',
  },
  buyerBubble: {
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    borderBottomRightRadius: 2,
    padding: 10,
    maxWidth: '85%',
  },
  bubbleLabel: {
    fontSize: 10,
    color: '#0369a1',
    fontWeight: '600',
    marginBottom: 2,
  },
  buyerMessageText: {
    fontSize: 12,
    color: '#0c4a6e',
    lineHeight: 16,
  },
  sellerReplyContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    alignItems: 'flex-start',
  },
  sellerReplyBubble: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    borderBottomLeftRadius: 2,
    padding: 10,
    maxWidth: '85%',
  },
  sellerReplyHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 2,
  },
  sellerReplyText: {
    fontSize: 12,
    color: '#14532d',
    lineHeight: 16,
  },
  waitingContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  waitingText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});
