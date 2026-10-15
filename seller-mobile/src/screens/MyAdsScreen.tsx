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
import { IAdvertisement, AdStatus } from '../types/advertisement.types';

interface MyAdsScreenProps {
  route?: { params?: { filter?: string } };
  navigation: any;
}

export default function MyAdsScreen({ route, navigation }: MyAdsScreenProps) {
  const [ads, setAds] = useState<IAdvertisement[]>([]);
  const [activeTab, setActiveTab] = useState<string>(route?.params?.filter || 'all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAds = async () => {
    try {
      const res = await sellerApi.getMyAdvertisements();
      setAds(res.advertisements || []);
    } catch (err: any) {
      console.warn('Error fetching seller ads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAds();
    });
    fetchAds();
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route?.params?.filter) {
      setActiveTab(route.params.filter);
    }
  }, [route?.params?.filter]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAds();
  };

  const handleMarkAsSold = async (adId: number) => {
    Alert.alert(
      'Mark as Sold',
      'Are you sure you want to mark this item as sold?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Sold',
          onPress: async () => {
            try {
              await sellerApi.markAsSold(adId);
              setAds(prev => prev.map(a => a.id === adId ? { ...a, status: 'sold' as AdStatus } : a));
              Alert.alert('Success', 'Item marked as sold!');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to update ad status');
            }
          }
        }
      ]
    );
  };

  const handleDelete = (adId: number) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to permanently delete this advertisement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await sellerApi.deleteAdvertisement(adId);
              setAds(prev => prev.filter(a => a.id !== adId));
              Alert.alert('Deleted', 'Advertisement removed successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete advertisement');
            }
          }
        }
      ]
    );
  };

  const filteredAds = ads.filter(ad => {
    if (activeTab === 'all') return true;
    return ad.status === activeTab;
  });

  const getStatusBadge = (status: AdStatus) => {
    switch (status) {
      case 'approved':
        return <View style={[styles.badge, styles.badgeApproved]}><Text style={styles.badgeTextApproved}>ACTIVE</Text></View>;
      case 'pending':
        return <View style={[styles.badge, styles.badgePending]}><Text style={styles.badgeTextPending}>UNDER REVIEW</Text></View>;
      case 'rejected':
        return <View style={[styles.badge, styles.badgeRejected]}><Text style={styles.badgeTextRejected}>REJECTED</Text></View>;
      case 'sold':
        return <View style={[styles.badge, styles.badgeSold]}><Text style={styles.badgeTextSold}>SOLD</Text></View>;
      default:
        return null;
    }
  };

  const renderAdItem = ({ item }: { item: IAdvertisement }) => (
    <View style={styles.adCard}>
      <View style={styles.cardMain}>
        <Image
          source={{ uri: item.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200' }}
          style={styles.adImage}
        />
        <View style={styles.cardInfo}>
          <View style={styles.statusRow}>
            {getStatusBadge(item.status)}
            <Text style={styles.viewsText}>👀 {item.views_count || 0} views</Text>
          </View>
          <Text style={styles.adPrice}>₹{Number(item.price).toLocaleString('en-IN')}</Text>
          <Text style={styles.adTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.adMeta}>{item.city} • {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Rejection Reason Feedback Callout */}
      {item.status === 'rejected' && (
        <View style={styles.rejectionBox}>
          <View style={styles.rejectionHeaderRow}>
            <Text style={styles.rejectionIcon}>⚠️</Text>
            <Text style={styles.rejectionHeaderTitle}>Moderator Feedback</Text>
          </View>
          <Text style={styles.rejectionText}>
            {item.rejection_reason || 'This listing does not meet community guidelines. Please provide clearer details and adjust the price.'}
          </Text>
          <TouchableOpacity
            style={styles.resubmitBtn}
            onPress={() => navigation.navigate('PostAd', { editAd: item })}
          >
            <Text style={styles.resubmitBtnText}>✏️ Edit & Resubmit for Review</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Card Actions */}
      <View style={styles.actionRow}>
        {item.status === 'approved' && (
          <TouchableOpacity
            style={styles.soldActionBtn}
            onPress={() => handleMarkAsSold(item.id)}
          >
            <Text style={styles.soldActionText}>✓ Mark as Sold</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.editActionBtn}
          onPress={() => navigation.navigate('PostAd', { editAd: item })}
        >
          <Text style={styles.editActionText}>✏️ Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteActionBtn}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteActionText}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Advertisements</Text>
        <Text style={styles.headerSub}>Manage your listings and live inventory</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'all', label: `All (${ads.length})` },
          { key: 'approved', label: `Active (${ads.filter(a => a.status === 'approved').length})` },
          { key: 'pending', label: `Pending (${ads.filter(a => a.status === 'pending').length})` },
          { key: 'rejected', label: `Rejected (${ads.filter(a => a.status === 'rejected').length})` },
          { key: 'sold', label: `Sold (${ads.filter(a => a.status === 'sold').length})` },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00a49f" />
        </View>
      ) : (
        <FlatList
          data={filteredAds}
          keyExtractor={item => item.id.toString()}
          renderItem={renderAdItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00a49f']} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>No listings in this category</Text>
              <Text style={styles.emptySub}>Tap below to create a new advertisement.</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('PostAd')}
              >
                <Text style={styles.emptyButtonText}>+ Create Advertisement</Text>
              </TouchableOpacity>
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
    paddingHorizontal: 8,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 12,
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
  adCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
  },
  adImage: {
    width: 88,
    height: 88,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  badgeApproved: {
    backgroundColor: '#d1fae5',
  },
  badgeTextApproved: {
    color: '#065f46',
    fontSize: 10,
    fontWeight: '700',
  },
  badgePending: {
    backgroundColor: '#fef3c7',
  },
  badgeTextPending: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeRejected: {
    backgroundColor: '#fee2e2',
  },
  badgeTextRejected: {
    color: '#991b1b',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeSold: {
    backgroundColor: '#e5e7eb',
  },
  badgeTextSold: {
    color: '#374151',
    fontSize: 10,
    fontWeight: '700',
  },
  viewsText: {
    fontSize: 11,
    color: '#757575',
  },
  adPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34',
    marginTop: 2,
  },
  adTitle: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
    marginTop: 2,
  },
  adMeta: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  rejectionBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 6,
    padding: 10,
    marginTop: 10,
  },
  rejectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rejectionIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  rejectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#991b1b',
  },
  rejectionText: {
    fontSize: 12,
    color: '#7f1d1d',
    lineHeight: 16,
  },
  resubmitBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  resubmitBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991b1b',
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
    marginTop: 10,
    paddingTop: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  soldActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#00a49f',
    borderRadius: 4,
    marginRight: 8,
  },
  soldActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  editActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginRight: 8,
  },
  editActionText: {
    color: '#333',
    fontSize: 11,
    fontWeight: '600',
  },
  deleteActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff0f0',
    borderRadius: 4,
  },
  deleteActionText: {
    color: '#d32f2f',
    fontSize: 11,
    fontWeight: '600',
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
  emptyButton: {
    backgroundColor: '#002f34',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
