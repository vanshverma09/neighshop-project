import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView
} from 'react-native';
import { userApi } from '../api/apiClient';
import { ICategory, ISubcategory } from '../types/category.types';
import LoadingView from '../components/LoadingView';
import EmptyState from '../components/EmptyState';

interface CategoryBrowseScreenProps {
  navigation: any;
}

export default function CategoryBrowseScreen({ navigation }: CategoryBrowseScreenProps) {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCatId, setExpandedCatId] = useState<number | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await userApi.getCategories();
      setCategories(res.categories || []);
    } catch (err: any) {
      console.warn('Error loading categories:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleSelectCategory = (categoryId: number, categoryName: string) => {
    navigation.navigate('Explore', {
      initialCategory: categoryId,
      initialCategoryName: categoryName
    });
  };

  const handleSelectSubcategory = (
    categoryId: number,
    subcategoryId: number,
    subName: string
  ) => {
    navigation.navigate('Explore', {
      initialCategory: categoryId,
      initialSubcategory: subcategoryId,
      initialCategoryName: subName
    });
  };

  const renderCategoryItem = ({ item }: { item: ICategory }) => {
    const isExpanded = expandedCatId === item.id;
    const subcategories = item.subcategories || [];

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.7}
          onPress={() => setExpandedCatId(isExpanded ? null : item.id)}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.cardIcon}>{item.icon || '📦'}</Text>
          </View>
          <View style={styles.headerTextWrapper}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.cardDesc} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
            <Text style={styles.countBadge}>
              {item.ad_count || 0} active listings
            </Text>
          </View>
          <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {/* View All in this Category Button */}
        <TouchableOpacity
          style={styles.browseAllBtn}
          onPress={() => handleSelectCategory(item.id, item.name)}
        >
          <Text style={styles.browseAllBtnText}>Explore All {item.name} →</Text>
        </TouchableOpacity>

        {/* Subcategories (Expanded) */}
        {isExpanded && subcategories.length > 0 && (
          <View style={styles.subcategoriesContainer}>
            <Text style={styles.subHeading}>Subcategories:</Text>
            <View style={styles.subChipsGrid}>
              {subcategories.map((sub: ISubcategory) => (
                <TouchableOpacity
                  key={sub.id}
                  style={styles.subChip}
                  activeOpacity={0.75}
                  onPress={() => handleSelectSubcategory(item.id, sub.id, sub.name)}
                >
                  <Text style={styles.subChipText}>{sub.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return <LoadingView message="Loading Categories..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.pageTitle}>All Categories</Text>
        <Text style={styles.pageSubtitle}>
          Select a category or subcategory to discover verified listings
        </Text>
      </View>

      <FlatList
        data={categories}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCategoryItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00a49f']} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🗂️"
            title="No Categories Available"
            description="Categories will appear here once configured by the platform administrator."
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
  topHeader: {
    backgroundColor: '#002f34',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 164, 159, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIcon: {
    fontSize: 22,
  },
  headerTextWrapper: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#002f34',
  },
  cardDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  countBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00a49f',
    marginTop: 4,
  },
  chevron: {
    fontSize: 12,
    color: '#94a3b8',
    paddingHorizontal: 8,
  },
  browseAllBtn: {
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  browseAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00a49f',
  },
  subcategoriesContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  subHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  subChipText: {
    fontSize: 11,
    color: '#002f34',
    fontWeight: '600',
  },
});
