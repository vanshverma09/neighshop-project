import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { userApi } from '../api/apiClient';
import { IAdvertisement } from '../types/advertisement.types';

interface WishlistScreenProps {
  navigation: any;
}

export default function WishlistScreen({ navigation }: WishlistScreenProps) {
  const [wishlist, setWishlist] = useState<IAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await userApi.getWishlist();
      setWishlist(res.wishlist || []);
    } catch {
      // not logged in or error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchWishlist();
    });
    fetchWishlist();
    return unsubscribe;
  }, [navigation]);

  const handleRemove = async (adId: number) => {
    try {
      await userApi.toggleWishlist(adId);
      setWishlist(prev => prev.filter(item => item.id !== adId));
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Failed to remove from wishlist');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Favourites</Text>
        <Text style={styles.headerSub}>{wishlist.length} saved advertisements</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00a49f" />
        </View>
      ) : wishlist.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>❤️</Text>
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptySub}>
            Tap the heart icon on any advertisement to save it here for quick access later.
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseBtnText}>Discover Deals</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ProductDetail', { adId: item.id })}
            >
              <Image
                source={{ uri: item.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200' }}
                style={styles.thumb}
              />
              <View style={styles.details}>
                <Text style={styles.price}>₹{Number(item.price).toLocaleString('en-IN')}</Text>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.meta}>{item.location || item.city} • Seller: {item.seller_name}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(item.id)}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => navigation.navigate('ProductDetail', { adId: item.id })}
                  >
                    <Text style={styles.chatBtnText}>Chat with Seller</Text>
                  </TouchableOpacity>
                </View>
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
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  thumb: {
    width: 110,
    height: 110,
    backgroundColor: '#cbd5e1'
  },
  details: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between'
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34'
  },
  title: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600'
  },
  meta: {
    fontSize: 11,
    color: '#64748b'
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6
  },
  removeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  removeBtnText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600'
  },
  chatBtn: {
    backgroundColor: '#002f34',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4
  },
  chatBtnText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
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
    lineHeight: 18,
    marginBottom: 20
  },
  browseBtn: {
    backgroundColor: '#002f34',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6
  },
  browseBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
