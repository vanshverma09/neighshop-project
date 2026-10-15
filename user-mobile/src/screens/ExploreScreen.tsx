import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator
} from 'react-native';
import { userApi } from '../api/apiClient';
import { IAdvertisement } from '../types/advertisement.types';

interface ExploreScreenProps {
  navigation: any;
}

export default function ExploreScreen({ navigation }: ExploreScreenProps) {
  const [ads, setAds] = useState<IAdvertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchExplore = async () => {
    setLoading(true);
    try {
      const res = await userApi.getAdvertisements({
        search: search || undefined,
        condition: conditionFilter !== 'all' ? (conditionFilter as any) : undefined,
        limit: 30
      });
      setAds(res.advertisements || []);
    } catch (err) {
      console.warn('Error fetching explore:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplore();
  }, [conditionFilter]);

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore Marketplace</Text>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search all classifieds..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={fetchExplore}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={fetchExplore}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Condition Filter Chips */}
        <View style={styles.chipsRow}>
          {['all', 'new', 'used_like_new', 'used_good'].map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, conditionFilter === c && styles.chipActive]}
              onPress={() => setConditionFilter(c)}
            >
              <Text style={[styles.chipText, conditionFilter === c && styles.chipTextActive]}>
                {c === 'all' ? 'All Conditions' : c.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00a49f" />
        </View>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => navigation.navigate('ProductDetail', { adId: item.id })}
            >
              <Image
                source={{ uri: item.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200' }}
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemPrice}>₹{Number(item.price).toLocaleString('en-IN')}</Text>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.itemCategory}>{item.category_name}</Text>
                <Text style={styles.itemMeta}>{item.location || item.city} • {item.product_condition}</Text>
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
    fontWeight: '800',
    marginBottom: 10
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    height: 42,
    marginBottom: 10
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#002f34'
  },
  searchBtn: {
    backgroundColor: '#00a49f',
    justifyContent: 'center',
    paddingHorizontal: 14
  },
  searchBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14
  },
  chipActive: {
    backgroundColor: '#ffce32'
  },
  chipText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#002f34',
    fontWeight: '800'
  },
  list: {
    padding: 12
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  itemImage: {
    width: 100,
    height: 100,
    backgroundColor: '#cbd5e1'
  },
  itemInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center'
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34'
  },
  itemTitle: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2
  },
  itemCategory: {
    fontSize: 11,
    color: '#00a49f',
    fontWeight: '700',
    marginTop: 2
  },
  itemMeta: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 4
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
