import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { userApi } from '../api/apiClient';
import { IAdvertisement } from '../types/advertisement.types';
import { ICategory } from '../types/category.types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 36) / 2;

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [advertisements, setAdvertisements] = useState<IAdvertisement[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState('Mumbai');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [adsRes, catsRes] = await Promise.all([
        userApi.getAdvertisements({
          city: selectedCity === 'All India' ? undefined : selectedCity,
          categoryId: selectedCategory || undefined,
          search: searchQuery || undefined,
          limit: 20
        }),
        userApi.getCategories()
      ]);

      setAdvertisements(adsRes.advertisements || []);
      setCategories(catsRes.categories || []);
    } catch (err) {
      console.warn('Error loading home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, selectedCity]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleFav = async (adId: number) => {
    try {
      const res = await userApi.toggleWishlist(adId);
      setAdvertisements(prev =>
        prev.map(ad => (ad.id === adId ? { ...ad, is_favourited: res.is_favourited } : ad))
      );
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Please log in to save items to your wishlist.');
    }
  };

  const renderHeader = () => (
    <View>
      {/* Location Bar */}
      <View style={styles.locationBar}>
        <Text style={styles.locationPin}>📍</Text>
        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => {
            const nextCity = selectedCity === 'Mumbai' ? 'Bengaluru' : selectedCity === 'Bengaluru' ? 'All India' : 'Mumbai';
            setSelectedCity(nextCity);
          }}
        >
          <Text style={styles.locationText}>{selectedCity}, India</Text>
          <Text style={styles.locationCaret}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Find Cars, Mobile Phones, Laptops and more..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={loadData}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); loadData(); }}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills (Horizontal Scroll) */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        <TouchableOpacity
          style={[styles.categoryPill, selectedCategory === null && styles.categoryPillActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.categoryText, selectedCategory === null && styles.categoryTextActive]}>
            🌟 All Items
          </Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryPill, selectedCategory === cat.id && styles.categoryPillActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Fresh Recommendations Header */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Fresh Recommendations</Text>
        <Text style={styles.resultsCount}>{advertisements.length} ads</Text>
      </View>
    </View>
  );

  const renderAdCard = ({ item }: { item: IAdvertisement }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => navigation.navigate('ProductDetail', { adId: item.id })}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400' }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        {item.is_featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>FEATURED</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.favButton}
          onPress={() => handleToggleFav(item.id)}
        >
          <Text style={[styles.favIcon, item.is_favourited && styles.favIconActive]}>
            {item.is_favourited ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.priceText}>
          ₹{Number(item.price).toLocaleString('en-IN')}
        </Text>
        <Text style={styles.titleText} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.locationMeta} numberOfLines={1}>
            {item.location || item.city}
          </Text>
          <Text style={styles.dateMeta}>
            {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00a49f" />
        <Text style={styles.loadingText}>Loading NeighShop Marketplace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={advertisements}
        keyExtractor={item => item.id.toString()}
        renderItem={renderAdCard}
        numColumns={2}
        columnWrapperStyle={styles.rowWrapper}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00a49f']} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No listings found in {selectedCity}</Text>
            <Text style={styles.emptySubtitle}>Try changing your filter, location, or search keywords.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#002f34',
    fontWeight: '600'
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002f34',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  locationPin: {
    fontSize: 14,
    marginRight: 6
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  locationText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  locationCaret: {
    color: '#00a49f',
    fontSize: 10,
    marginLeft: 6
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#002f34',
    height: 46
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#002f34',
    paddingVertical: 0
  },
  clearSearch: {
    fontSize: 14,
    color: '#94a3b8',
    paddingHorizontal: 4
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 14,
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34'
  },
  resultsCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  categoriesScroll: {
    paddingHorizontal: 12,
    paddingBottom: 6
  },
  categoryPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  categoryPillActive: {
    backgroundColor: '#002f34',
    borderColor: '#002f34'
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002f34'
  },
  categoryTextActive: {
    color: '#ffffff'
  },
  listContent: {
    paddingBottom: 30
  },
  rowWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 12
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#e2e8f0',
    position: 'relative'
  },
  cardImage: {
    width: '100%',
    height: '100%'
  },
  featuredBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#ffce32',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  featuredBadgeText: {
    color: '#002f34',
    fontSize: 9,
    fontWeight: '800'
  },
  favButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ffffff',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3
  },
  favIcon: {
    fontSize: 14
  },
  favIconActive: {
    color: '#ef4444'
  },
  cardDetails: {
    padding: 10
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34',
    marginBottom: 3
  },
  titleText: {
    fontSize: 12.5,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 16,
    minHeight: 32,
    marginBottom: 6
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  locationMeta: {
    fontSize: 10.5,
    color: '#64748b',
    flex: 1
  },
  dateMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: 4
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: 6
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center'
  }
});
