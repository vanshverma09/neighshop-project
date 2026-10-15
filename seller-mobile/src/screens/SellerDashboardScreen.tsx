import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { sellerApi } from '../api/apiClient';
import { IAdvertisement } from '../types/advertisement.types';
import { IEnquiry } from '../types/enquiry.types';

interface SellerDashboardScreenProps {
  navigation: any;
}

export default function SellerDashboardScreen({ navigation }: SellerDashboardScreenProps) {
  const [ads, setAds] = useState<IAdvertisement[]>([]);
  const [enquiries, setEnquiries] = useState<IEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [adsRes, enqRes] = await Promise.all([
        sellerApi.getMyAdvertisements(),
        sellerApi.getSellerEnquiries().catch(() => ({ enquiries: [] })),
      ]);
      setAds(adsRes.advertisements || []);
      setEnquiries(enqRes.enquiries || []);
    } catch (err) {
      console.warn('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });
    loadDashboardData();
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const activeAdsCount = ads.filter(a => a.status === 'approved').length;
  const pendingAdsCount = ads.filter(a => a.status === 'pending').length;
  const rejectedAdsCount = ads.filter(a => a.status === 'rejected').length;
  const soldAdsCount = ads.filter(a => a.status === 'sold').length;
  const totalViews = ads.reduce((sum, a) => sum + (a.views_count || 0), 0);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00a49f" />
        <Text style={styles.loadingText}>Loading Seller Studio...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00a49f']} />}
    >
      {/* Header Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Seller Studio 🏪</Text>
          <Text style={styles.headerSubtitle}>Manage your marketplace inventory & buyer leads</Text>
        </View>
        <TouchableOpacity
          style={styles.quickSellBtn}
          onPress={() => navigation.navigate('PostAd')}
        >
          <Text style={styles.quickSellBtnText}>+ SELL NOW</Text>
        </TouchableOpacity>
      </View>

      {/* Rejection Alert Banner if any ads are rejected */}
      {rejectedAdsCount > 0 && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => navigation.navigate('MyAds', { filter: 'rejected' })}
        >
          <Text style={styles.alertIcon}>⚠️</Text>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Action Required: {rejectedAdsCount} Ad(s) Rejected</Text>
            <Text style={styles.alertSub}>Review the admin moderation feedback and resubmit your ad.</Text>
          </View>
          <Text style={styles.alertArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* KPI Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { borderTopColor: '#00a49f' }]}>
          <Text style={styles.statNumber}>{activeAdsCount}</Text>
          <Text style={styles.statLabel}>Active Ads</Text>
        </View>

        <View style={[styles.statCard, { borderTopColor: '#f59e0b' }]}>
          <Text style={styles.statNumber}>{pendingAdsCount}</Text>
          <Text style={styles.statLabel}>Under Review</Text>
        </View>

        <View style={[styles.statCard, { borderTopColor: '#ef4444' }]}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>{rejectedAdsCount}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>

        <View style={[styles.statCard, { borderTopColor: '#3b82f6' }]}>
          <Text style={styles.statNumber}>{enquiries.length}</Text>
          <Text style={styles.statLabel}>Buyer Inquiries</Text>
        </View>
      </View>

      {/* Additional Stats Row */}
      <View style={styles.secondaryStatsRow}>
        <View style={styles.secStatBox}>
          <Text style={styles.secStatNum}>👀 {totalViews}</Text>
          <Text style={styles.secStatLabel}>Total Ad Views</Text>
        </View>
        <View style={styles.secStatBox}>
          <Text style={styles.secStatNum}>🏷️ {soldAdsCount}</Text>
          <Text style={styles.secStatLabel}>Items Sold</Text>
        </View>
      </View>

      {/* Quick Action Cards */}
      <Text style={styles.sectionHeader}>Quick Actions</Text>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('PostAd')}
        >
          <Text style={styles.actionIcon}>📸</Text>
          <View>
            <Text style={styles.actionTitle}>Post a New Advertisement</Text>
            <Text style={styles.actionDesc}>Upload photos, set price in ₹, choose category</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('MyAds')}
        >
          <Text style={styles.actionIcon}>📦</Text>
          <View>
            <Text style={styles.actionTitle}>Inventory & Ad Manager</Text>
            <Text style={styles.actionDesc}>Manage active ads, mark items as sold, view feedback</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Inquiries')}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <View>
            <Text style={styles.actionTitle}>Buyer Leads & Inquiries</Text>
            <Text style={styles.actionDesc}>Respond to questions from prospective buyers</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tips for Fast Selling */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsHeader}>💡 Seller Best Practices</Text>
        <Text style={styles.tipItem}>• High-resolution, multi-angle photos generate 4x more buyer calls.</Text>
        <Text style={styles.tipItem}>• Research comparable marketplace prices for fast sales.</Text>
        <Text style={styles.tipItem}>• Mention exact condition details and reason for selling clearly.</Text>
        <Text style={styles.tipItem}>• Quick responses within 1 hour significantly improve conversion.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f3f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    backgroundColor: '#002f34',
    padding: 20,
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#00a49f',
    marginTop: 4,
  },
  quickSellBtn: {
    backgroundColor: '#ffce32',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  quickSellBtnText: {
    color: '#002f34',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  alertBanner: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: '#991b1b',
    fontWeight: '700',
    fontSize: 13,
  },
  alertSub: {
    color: '#b91c1c',
    fontSize: 11,
    marginTop: 2,
  },
  alertArrow: {
    color: '#991b1b',
    fontWeight: '800',
    fontSize: 16,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    width: '48%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#002f34',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    fontWeight: '600',
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  secStatBox: {
    backgroundColor: '#ffffff',
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  secStatNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002f34',
  },
  secStatLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002f34',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002f34',
  },
  actionDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  tipsCard: {
    backgroundColor: '#e6f7f6',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccefed',
  },
  tipsHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00796b',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 12,
    color: '#004d40',
    marginBottom: 4,
    lineHeight: 18,
  },
});
