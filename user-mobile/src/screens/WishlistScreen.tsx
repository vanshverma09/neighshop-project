import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert
} from 'react-native';
import { userApi, getAuthToken, subscribeAuthChange } from '../api/apiClient';
import { IAdvertisement } from '../types/advertisement.types';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';

interface WishlistScreenProps {
  navigation: any;
}

export default function WishlistScreen({ navigation }: WishlistScreenProps) {
  const [wishlist, setWishlist] = useState<IAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!getAuthToken());

  const fetchWishlist = useCallback(async () => {
    if (!getAuthToken()) {
      setIsLoggedIn(false);
      setWishlist([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setIsLoggedIn(true);
    try {
      const res = await userApi.getWishlist();
      setWishlist(res.wishlist || []);
    } catch (err: any) {
      console.warn('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
    const unsubNav = navigation.addListener('focus', fetchWishlist);
    const unsubAuth = subscribeAuthChange(() => fetchWishlist());
    return () => {
      unsubNav();
      unsubAuth();
    };
  }, [navigation, fetchWishlist]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWishlist();
  };

  const handleRemove = async (adId: number) => {
    try {
      await userApi.toggleWishlist(adId);
      setWishlist(prev => prev.filter(item => item.id !== adId));
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Failed to remove from favourites.');
    }
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saved Favourites</Text>
        </View>
        <EmptyState
          icon="❤️"
          title="Sign in to View Favourites"
          description="Save items you like to compare prices, monitor price drops, and contact sellers easily."
          actionLabel="Sign In / Register"
          onAction={() => navigation.navigate('Login')}
        />
      </View>
    );
  }

  if (loading && !refreshing) {
    return <LoadingView message="Loading your favourites..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Saved Favourites</Text>
          <Text style={styles.headerSub}>
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved in your wishlist
          </Text>
        </View>
        <TouchableOpacity
          style={styles.exploreLink}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.exploreLinkText}>Browse More →</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={wishlist}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00a49f']} />
        }
        renderItem={({ item }) => {
          const image =
            item.primary_image ||
            (item.images && item.images.length > 0 ? item.images[0].image_url : null) ||
            'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400';

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('ProductDetail', { adId: item.id })}
            >
              <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />

              <View style={styles.cardBody}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>
                    ₹{Number(item.price || 0).toLocaleString('en-IN')}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemove(item.id)}
                  >
                    <Text style={styles.removeIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.titleText} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.locationText} numberOfLines={1}>
                    📍 {item.location || item.city || 'India'}
                  </Text>
                  <Text style={styles.viewDetailsText}>View Ad →</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="🤍"
            title="Your Wishlist is Empty"
            description="Tap the heart icon on any advertisement to save it here for quick access later."
            actionLabel="Start Exploring"
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  exploreLink: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exploreLinkText: {
    color: '#00a49f',
    fontSize: 11,
    fontWeight: '700',
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
  },
  image: {
    width: 110,
    height: 110,
    backgroundColor: '#e2e8f0',
  },
  cardBody: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34',
  },
  removeBtn: {
    padding: 4,
  },
  removeIcon: {
    fontSize: 14,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 18,
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 4,
  },
  locationText: {
    fontSize: 11,
    color: '#64748b',
    flex: 1,
    marginRight: 6,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00a49f',
  },
});
