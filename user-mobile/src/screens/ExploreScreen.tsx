import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { userApi, getAuthToken } from '../api/apiClient';
import { IAdvertisement, ProductCondition } from '../types/advertisement.types';
import { ICategory } from '../types/category.types';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';

const CITIES = ['All India', 'Mumbai', 'Bengaluru', 'Delhi', 'Hyderabad', 'Pune'];

const CONDITIONS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Brand New', value: 'new' },
  { label: 'Like New', value: 'used_like_new' },
  { label: 'Good', value: 'used_good' },
  { label: 'Fair', value: 'used_fair' },
];

const SORT_OPTIONS: { label: string; value: 'newest' | 'price_asc' | 'price_desc' }[] = [
  { label: '✨ Newest First', value: 'newest' },
  { label: '📈 Price: Low to High', value: 'price_asc' },
  { label: '📉 Price: High to Low', value: 'price_desc' },
];

interface ExploreScreenProps {
  route?: {
    params?: {
      initialSearch?: string;
      initialCategory?: number;
      initialSubcategory?: number;
      initialCategoryName?: string;
      initialCity?: string;
    };
  };
  navigation: any;
}

export default function ExploreScreen({ route, navigation }: ExploreScreenProps) {
  const params = route?.params || {};

  const [search, setSearch] = useState(params.initialSearch || '');
  const [selectedCity, setSelectedCity] = useState(params.initialCity || 'All India');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(params.initialCategory || null);
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [advertisements, setAdvertisements] = useState<IAdvertisement[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Sync route params when navigated with new parameters
  useEffect(() => {
    if (params.initialSearch !== undefined) setSearch(params.initialSearch);
    if (params.initialCategory !== undefined) setSelectedCategory(params.initialCategory);
    if (params.initialCity !== undefined) setSelectedCity(params.initialCity);
  }, [params.initialSearch, params.initialCategory, params.initialCity]);

  // Load categories
  useEffect(() => {
    userApi.getCategories().then(res => setCategories(res.categories || [])).catch(() => {});
  }, []);

  const fetchResults = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await userApi.getAdvertisements({
        search: search.trim() || undefined,
        city: selectedCity === 'All India' ? undefined : selectedCity,
        categoryId: selectedCategory || undefined,
        condition: selectedCondition !== 'all' ? (selectedCondition as ProductCondition) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort: sortBy,
        page: pageNum,
        limit: 12
      });

      if (append) {
        setAdvertisements(prev => [...prev, ...(res.advertisements || [])]);
      } else {
        setAdvertisements(res.advertisements || []);
      }

      setPage(res.page || 1);
      setTotalPages(res.totalPages || 1);
      setTotalResults(res.total || 0);
    } catch (err: any) {
      console.warn('Search error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [search, selectedCity, selectedCategory, selectedCondition, minPrice, maxPrice, sortBy]);

  useEffect(() => {
    fetchResults(1, false);
  }, [fetchResults]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResults(1, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchResults(page + 1, true);
    }
  };

  const handleToggleFav = async (adId: number) => {
    if (!getAuthToken()) {
      Alert.alert('Sign In Required', 'Please sign in to save items to favourites.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    try {
      const res = await userApi.toggleWishlist(adId);
      setAdvertisements(prev =>
        prev.map(a => (a.id === adId ? { ...a, is_favourited: res.is_favourited } : a))
      );
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Unable to update favourite.');
    }
  };

  const activeFilterCount =
    (selectedCity !== 'All India' ? 1 : 0) +
    (selectedCategory !== null ? 1 : 0) +
    (selectedCondition !== 'all' ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (sortBy !== 'newest' ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedCity('All India');
    setSelectedCategory(null);
    setSelectedCondition('all');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setFilterModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search in all categories..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => fetchResults(1, false)}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(''); fetchResults(1, false); }}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.filterBtnText}>⚙️ Filter</Text>
            {activeFilterCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Horizontal Sort Bar */}
        <View style={styles.sortBar}>
          <Text style={styles.resultSummary}>
            {totalResults} {totalResults === 1 ? 'ad' : 'ads'} found
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.sortChip, sortBy === opt.value && styles.sortChipActive]}
                onPress={() => setSortBy(opt.value)}
              >
                <Text
                  style={[styles.sortChipText, sortBy === opt.value && styles.sortChipTextActive]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Main Results Grid */}
      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00a49f" />
          <Text style={styles.loadingText}>Searching marketplace...</Text>
        </View>
      ) : (
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
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00a49f']} />
          }
          ListFooterComponent={
            page < totalPages ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                activeOpacity={0.8}
                onPress={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#002f34" />
                ) : (
                  <Text style={styles.loadMoreText}>
                    Load More (Page {page + 1} of {totalPages})
                  </Text>
                )}
              </TouchableOpacity>
            ) : totalResults > 0 ? (
              <Text style={styles.endText}>✓ You've viewed all {totalResults} matching listings</Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              title="No Listings Found"
              description="No approved advertisements matched your current search criteria and filters."
              actionLabel="Clear Filters"
              onAction={handleResetFilters}
            />
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Search Results</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* City Selection */}
              <Text style={styles.filterLabel}>Location (City)</Text>
              <View style={styles.chipsRow}>
                {CITIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.modalChip, selectedCity === c && styles.modalChipActive]}
                    onPress={() => setSelectedCity(c)}
                  >
                    <Text
                      style={[styles.modalChipText, selectedCity === c && styles.modalChipTextActive]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category Selection */}
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.modalChip, selectedCategory === null && styles.modalChipActive]}
                  onPress={() => setSelectedCategory(null)}
                >
                  <Text
                    style={[
                      styles.modalChipText,
                      selectedCategory === null && styles.modalChipTextActive
                    ]}
                  >
                    🌟 All Categories
                  </Text>
                </TouchableOpacity>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.modalChip,
                      selectedCategory === cat.id && styles.modalChipActive
                    ]}
                    onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        selectedCategory === cat.id && styles.modalChipTextActive
                      ]}
                    >
                      {cat.icon || '📦'} {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Product Condition */}
              <Text style={styles.filterLabel}>Product Condition</Text>
              <View style={styles.chipsRow}>
                {CONDITIONS.map(cond => (
                  <TouchableOpacity
                    key={cond.value}
                    style={[
                      styles.modalChip,
                      selectedCondition === cond.value && styles.modalChipActive
                    ]}
                    onPress={() => setSelectedCondition(cond.value)}
                  >
                    <Text
                      style={[
                        styles.modalChipText,
                        selectedCondition === cond.value && styles.modalChipTextActive
                      ]}
                    >
                      {cond.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Range */}
              <Text style={styles.filterLabel}>Price Range (₹ INR)</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min Price"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
                <Text style={styles.priceDash}>—</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max Price"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetFilters}
              >
                <Text style={styles.resetButtonText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => {
                  setFilterModalVisible(false);
                  fetchResults(1, false);
                }}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
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
    backgroundColor: '#f1f5f9',
  },
  header: {
    backgroundColor: '#002f34',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#002f34',
    paddingVertical: 0,
  },
  clearBtn: {
    fontSize: 13,
    color: '#94a3b8',
    paddingHorizontal: 4,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: '#00a49f',
  },
  filterBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ffce32',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#002f34',
    fontSize: 10,
    fontWeight: '800',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  resultSummary: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 10,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 6,
  },
  sortChipActive: {
    backgroundColor: '#00a49f',
  },
  sortChipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  sortChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  rowWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  loadMoreBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#002f34',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 14,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#002f34',
    fontSize: 13,
    fontWeight: '700',
  },
  endText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginVertical: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34',
  },
  modalClose: {
    fontSize: 16,
    color: '#64748b',
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: 8,
    marginTop: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalChip: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalChipActive: {
    backgroundColor: '#002f34',
    borderColor: '#002f34',
  },
  modalChipText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  modalChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#002f34',
  },
  priceDash: {
    color: '#64748b',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#002f34',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
