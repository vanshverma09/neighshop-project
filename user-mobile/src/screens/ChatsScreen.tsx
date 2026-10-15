import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { userApi } from '../api/apiClient';
import { IEnquiry } from '../types/enquiry.types';

interface ChatsScreenProps {
  navigation: any;
}

export default function ChatsScreen({ navigation }: ChatsScreenProps) {
  const [enquiries, setEnquiries] = useState<IEnquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const res = await userApi.getBuyerEnquiries();
      setEnquiries(res.enquiries || []);
    } catch {
      // not logged in
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchChats();
    });
    fetchChats();
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats & Inquiries</Text>
        <Text style={styles.headerSub}>Direct messages with sellers</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00a49f" />
        </View>
      ) : enquiries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No Active Conversations</Text>
          <Text style={styles.emptySub}>
            When you send a message to a seller regarding an advertisement, your conversation thread will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={enquiries}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatCard}
              onPress={() => navigation.navigate('ProductDetail', { adId: item.advertisement_id })}
            >
              <Image
                source={{ uri: item.ad_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=150' }}
                style={styles.adThumb}
              />
              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.sellerName}>{item.seller_name}</Text>
                  <Text style={[styles.statusTag, item.status === 'responded' ? styles.statusResponded : styles.statusPending]}>
                    {item.status === 'responded' ? 'REPLIED' : 'PENDING'}
                  </Text>
                </View>
                <Text style={styles.adTitle} numberOfLines={1}>{item.ad_title}</Text>
                <Text style={styles.buyerMsg} numberOfLines={1}>You: "{item.message}"</Text>
                {item.reply && (
                  <Text style={styles.sellerReply} numberOfLines={1}>Seller: "{item.reply}"</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    backgroundColor: '#002f34',
    padding: 16,
    paddingTop: 12
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  headerSub: {
    color: '#00a49f',
    fontSize: 12,
    marginTop: 2
  },
  list: {
    padding: 12
  },
  chatCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  adThumb: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
    marginRight: 12
  },
  chatInfo: {
    flex: 1
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sellerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002f34'
  },
  statusTag: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  statusResponded: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#b45309'
  },
  adTitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  buyerMsg: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic'
  },
  sellerReply: {
    fontSize: 12,
    color: '#00a49f',
    fontWeight: '600',
    marginTop: 2
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: 6
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
