import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ScrollView,
  Alert
} from 'react-native';
import { userApi, getAuthToken } from '../api/apiClient';
import { IAdvertisement } from '../types/advertisement.types';
import { ICategory } from '../types/category.types';
import ProductCard from '../components/ProductCard';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';

const CITIES = ['All India', 'Mumbai', 'Bengaluru', 'Delhi', 'Hyderabad', 'Pune'];

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [advertisements, setAdvertisements] = useState<IAdvertisement[]>([]);
  const [featuredAds, setFeaturedAds] = useState<IAdvertisement[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState('All India');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [adsRes, featRes, catsRes] = await Promise.all([
        userApi.getAdvertisements({
          city: selectedCity === 'All India' ? undefined : selectedCity,
          categoryId: selectedCategory || undefined,
          search: searchQuery || undefined,
          limit: 24,
          sort: 'newest'
        }),
        userApi.getFeaturedAds().catch(() => ({ success: true, featured: [] })),
        userApi.getCategories().catch(() => ({ success: true, categories: [] }))
      ]);

      setAdvertisements(adsRes.advertisements || []);
      setFeaturedAds(featRes.featured || []);
      setCategories(catsRes.categories || []);
    } catch (err: any) {
      console.warn('Error loading home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedCity, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleFav = async (adId: number) => {
    if (!getAuthToken()) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to save items to your favourites.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    try {
      const res = await userApi.toggleWishlist(adId);
      setAdvertisements(prev =>
        prev.map(ad => (ad.id === adId ? { ...ad, is_favourited: res.is_favourited } : ad))
      );
      setFeaturedAds(prev =>
        prev.map(ad => (ad.id === adId ? { ...ad, is_favourited: res.is_favourited } : ad))
      );
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Unable to update favourite.');
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Explore', {
        initialSearch: searchQuery.trim(),
        initialCategory: selectedCategory || undefined,
        initialCity: selectedCity === 'All India' ? undefined : selectedCity
      });
    } else {
      loadData();
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Location Selector Bar */}
      <View style={styles.locationBar}>
        <Text style={styles.locationPin}>📍</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cityPills}
        >
          {CITIES.map(city => (
            <TouchableOpacity
              key={city}
              style={[
                styles.cityChip,
                selectedCity === city && styles.cityChipActive
              ]}
              onPress={() => setSelectedCity(city)}
            >
              <Text
                style={[
                  styles.cityChipText,
                  selectedCity === city && styles.cityChipTextActive
                ]}
              >
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Find Cars, Mobile Phones, Laptops, Furniture..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              loadData();
            }}
          >
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills (Horizontal Scroll) */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
          <Text style={styles.seeAllText}>See All →</Text>
        </TouchableOpacity>
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
            🌟 All
          </Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryPill, selectedCategory === cat.id && styles.categoryPillActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>
              {cat.icon || '📦'} {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured Advertisements Carousel */}
      {featuredAds.length > 0 && selectedCategory === null && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.sectionTitle}>⭐ Featured Ads</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PROMOTED</Text>
              </View>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {featuredAds.map(item => (
              <View key={item.id} style={styles.featuredCardWrapper}>
                <ProductCard
                  item={item}
                  cardWidth={160}
                  onPress={() => navigation.navigate('ProductDetail', { adId: item.id })}
                  onToggleFav={handleToggleFav}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Fresh Recommendations Header */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Fresh Recommendations</Text>
        <Text style={styles.resultsCount}>{advertisements.length} listings</Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return <LoadingView message="Loading NeighShop Marketplace..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={advertisements}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={() => navigation.navigate('ProductDetail', { adId: item.id })}
            onToggleFav={handleToggleFav}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.rowWrapper}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00a49f']} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="📦"
            title={`No listings found in ${selectedCity}`}
            description="Try changing your search query, location filter, or category."
            actionLabel="View All Listings"
            onAction={() => {
              setSelectedCity('All India');
              setSelectedCategory(null);
              setSearchQuery('');
            }}
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
  headerContainer: {
    backgroundColor: '#f8fafc',
    paddingBottom: 8,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#002f34',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationPin: {
    fontSize: 14,
    marginRight: 6,
  },
  cityPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cityChipActive: {
    backgroundColor: '#00a49f',
  },
  cityChipText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
  },
  cityChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#002f34',
    height: 44,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#002f34',
    paddingVertical: 0,
  },
  clearSearch: {
    fontSize: 14,
    color: '#94a3b8',
    paddingHorizontal: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002f34',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00a49f',
  },
  proBadge: {
    backgroundColor: '#ffce32',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    color: '#002f34',
    fontSize: 9,
    fontWeight: '800',
  },
  resultsCount: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  categoriesScroll: {
    paddingHorizontal: 12,
    paddingBottom: 4,
    gap: 6,
  },
  categoryPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 6,
  },
  categoryPillActive: {
    backgroundColor: '#002f34',
    borderColor: '#002f34',
  },
  categoryText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  featuredSection: {
    backgroundColor: '#fefce8',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#fef08a',
    paddingVertical: 10,
    marginTop: 10,
  },
  featuredScroll: {
    paddingHorizontal: 12,
    gap: 10,
  },
  featuredCardWrapper: {
    marginRight: 10,
  },
  listContent: {
    paddingBottom: 24,
  },
  rowWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
});
