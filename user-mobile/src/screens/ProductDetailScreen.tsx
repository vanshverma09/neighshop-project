import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Share
} from 'react-native';
import { userApi, getAuthToken } from '../api/apiClient';
import { IAdvertisement } from '../types/advertisement.types';
import ImageGallery from '../components/ImageGallery';
import ProductCard from '../components/ProductCard';
import LoadingView from '../components/LoadingView';

interface ProductDetailScreenProps {
  route: { params: { adId: number } };
  navigation: any;
}

export default function ProductDetailScreen({ route, navigation }: ProductDetailScreenProps) {
  const { adId } = route.params;

  const [ad, setAd] = useState<IAdvertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Enquiry Modal State
  const [enquiryModalVisible, setEnquiryModalVisible] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('Hi! Is this still available? Can we meet for a physical inspection?');
  const [isSendingEnquiry, setIsSendingEnquiry] = useState(false);

  // Phone Call Modal State
  const [callModalVisible, setCallModalVisible] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await userApi.getAdvertisementById(adId);
      setAd(res.advertisement);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to load advertisement details.');
    } finally {
      setLoading(false);
    }
  }, [adId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleToggleFav = async () => {
    if (!ad) return;

    if (!getAuthToken()) {
      Alert.alert('Sign In Required', 'Please sign in to save items to favourites.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    try {
      const res = await userApi.toggleWishlist(ad.id);
      setAd(prev => (prev ? { ...prev, is_favourited: res.is_favourited } : null));
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Unable to update favourite.');
    }
  };

  const handleSendEnquiry = async () => {
    if (!ad || !enquiryMsg.trim()) return;

    if (!getAuthToken()) {
      setEnquiryModalVisible(false);
      Alert.alert('Sign In Required', 'Please sign in to message the seller.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    setIsSendingEnquiry(true);
    try {
      await userApi.createEnquiry(ad.id, enquiryMsg.trim());
      Alert.alert(
        'Enquiry Delivered! 💬',
        'Your message has been delivered to the seller. You can track replies in the Chats tab.',
        [
          { text: 'View Chats', onPress: () => { setEnquiryModalVisible(false); navigation.navigate('MainTabs', { screen: 'Chats' }); } },
          { text: 'OK', onPress: () => setEnquiryModalVisible(false) }
        ]
      );
    } catch (err: any) {
      Alert.alert('Unable to Send', err.message || 'Failed to deliver enquiry.');
    } finally {
      setIsSendingEnquiry(false);
    }
  };

  const handleShare = async () => {
    if (!ad) return;
    try {
      await Share.share({
        message: `Check out "${ad.title}" on NeighShop Global for ₹${Number(ad.price).toLocaleString('en-IN')}!`,
      });
    } catch {
      // ignore
    }
  };

  const formatCondition = (cond?: string) => {
    switch (cond) {
      case 'new': return 'Brand New (Sealed)';
      case 'used_like_new': return 'Like New (Mint Condition)';
      case 'used_good': return 'Good (Normal Wear)';
      case 'used_fair': return 'Fair (Functional)';
      default: return cond ? cond.replace('_', ' ') : 'Used';
    }
  };

  if (loading) {
    return <LoadingView message="Loading listing details..." />;
  }

  if (errorMsg || !ad) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Listing Unavailable</Text>
        <Text style={styles.errorText}>
          {errorMsg || 'This advertisement is no longer available or was removed by moderation.'}
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Return to Marketplace</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = ad.images && ad.images.length > 0 ? ad.images : [{ image_url: ad.primary_image || '' }];
  const formattedPrice = Number(ad.price || 0).toLocaleString('en-IN');
  const postDate = ad.created_at
    ? new Date(ad.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : '';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Multi-Image Gallery */}
        <ImageGallery images={images} height={300} />

        {/* Pricing & Key Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{formattedPrice}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
                <Text style={styles.actionIcon}>🔗</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={handleToggleFav}>
                <Text style={styles.actionIcon}>{ad.is_favourited ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {ad.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>⭐ FEATURED ADVERTISEMENT</Text>
            </View>
          )}

          <Text style={styles.titleText}>{ad.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.categoryPath}>
              🏷️ {ad.category_name} {ad.subcategory_name ? `› ${ad.subcategory_name}` : ''}
            </Text>
            <Text style={styles.postDate}>Posted {postDate}</Text>
          </View>

          <View style={styles.conditionRow}>
            <Text style={styles.conditionLabel}>Condition:</Text>
            <View style={styles.conditionPill}>
              <Text style={styles.conditionPillText}>
                {formatCondition(ad.product_condition)}
              </Text>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Description</Text>
          <Text style={styles.descriptionText}>{ad.description}</Text>
        </View>

        {/* Location Details Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Location & Neighbourhood</Text>
          <View style={styles.locationInfoRow}>
            <Text style={styles.locationPinLarge}>📍</Text>
            <View style={styles.locationDetails}>
              <Text style={styles.locationPrimary}>
                {ad.location || ad.city || 'Neighbourhood'}
              </Text>
              <Text style={styles.locationSecondary}>
                {ad.city}, {ad.state || 'India'}
              </Text>
            </View>
          </View>
        </View>

        {/* Seller Profile Card (Private data shielded) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Seller Information</Text>
          <View style={styles.sellerRow}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.avatarText}>
                {(ad.seller_name || 'Seller').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.sellerDetails}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{ad.seller_name || 'Community Seller'}</Text>
                {ad.seller_verified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓ VERIFIED</Text>
                  </View>
                )}
              </View>
              {ad.business_name && (
                <Text style={styles.businessName}>🏪 {ad.business_name}</Text>
              )}
              <View style={styles.sellerMetrics}>
                <Text style={styles.metricItem}>
                  ⭐ {ad.seller_rating ? Number(ad.seller_rating).toFixed(1) : '5.0'} Rating
                </Text>
                <Text style={styles.metricDot}>•</Text>
                <Text style={styles.metricItem}>
                  🤝 {ad.seller_sales || 1} Deals Completed
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.safetyNotice}>
            <Text style={styles.safetyIcon}>🛡️</Text>
            <Text style={styles.safetyText}>
              NeighShop Safety Tip: Inspect items in public places. Never pay advance deposits before seeing the product in person.
            </Text>
          </View>
        </View>

        {/* Report Advertisement Section */}
        <View style={styles.reportSection}>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() =>
              navigation.navigate('ReportAd', {
                adId: ad.id,
                adTitle: ad.title
              })
            }
          >
            <Text style={styles.reportBtnText}>🚨 Report Suspicious or Fraudulent Ad</Text>
          </TouchableOpacity>
        </View>

        {/* Similar Listings Carousel */}
        {ad.similar && ad.similar.length > 0 && (
          <View style={styles.similarSection}>
            <Text style={styles.sectionHeading}>Similar Items in {ad.category_name}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarScroll}>
              {ad.similar.map(item => (
                <View key={item.id} style={styles.similarCardWrapper}>
                  <ProductCard
                    item={item}
                    cardWidth={160}
                    onPress={() => navigation.push('ProductDetail', { adId: item.id })}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Actions Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.callButton}
          activeOpacity={0.85}
          onPress={() => setCallModalVisible(true)}
        >
          <Text style={styles.callButtonText}>📞 Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chatButton}
          activeOpacity={0.85}
          onPress={() => setEnquiryModalVisible(true)}
        >
          <Text style={styles.chatButtonText}>💬 Chat with Seller</Text>
        </TouchableOpacity>
      </View>

      {/* Enquiry Modal */}
      <Modal
        visible={enquiryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEnquiryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Message Seller</Text>
              <TouchableOpacity onPress={() => setEnquiryModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickAdSummary}>
              <Text style={styles.modalAdTitle} numberOfLines={1}>{ad.title}</Text>
              <Text style={styles.modalAdPrice}>₹{formattedPrice}</Text>
            </View>

            <Text style={styles.modalLabel}>Your Message to {ad.seller_name || 'Seller'}:</Text>
            <TextInput
              style={styles.enquiryInput}
              multiline
              numberOfLines={4}
              value={enquiryMsg}
              onChangeText={setEnquiryMsg}
              placeholder="Ask about availability, location, condition, or negotiate price..."
              placeholderTextColor="#94a3b8"
            />

            <View style={styles.quickPromptRow}>
              {[
                'Is this price negotiable?',
                'Can I inspect it today?',
                'Are bills/accessories included?'
              ].map(prompt => (
                <TouchableOpacity
                  key={prompt}
                  style={styles.promptChip}
                  onPress={() => setEnquiryMsg(prompt)}
                >
                  <Text style={styles.promptChipText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.sendEnquiryBtn, isSendingEnquiry && styles.sendEnquiryBtnDisabled]}
              onPress={handleSendEnquiry}
              disabled={isSendingEnquiry}
            >
              {isSendingEnquiry ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.sendEnquiryBtnText}>Send Message</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Call Seller Modal */}
      <Modal
        visible={callModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCallModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Seller</Text>
              <TouchableOpacity onPress={() => setCallModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.callCard}>
              <Text style={styles.callIcon}>📞</Text>
              <Text style={styles.callSellerName}>{ad.seller_name || 'Seller'}</Text>
              <Text style={styles.callPhone}>{ad.contact_phone || '+91 98200 12345'}</Text>
              <Text style={styles.callHint}>
                Please mention that you found this listing on NeighShop Global.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setCallModalVisible(false)}
            >
              <Text style={styles.doneBtnText}>Close</Text>
            </TouchableOpacity>
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
  scrollContent: {
    paddingBottom: 90,
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#002f34',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 18,
  },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffce32',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  featuredBadgeText: {
    color: '#002f34',
    fontSize: 10,
    fontWeight: '800',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#002f34',
    lineHeight: 24,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryPath: {
    fontSize: 12,
    color: '#00a49f',
    fontWeight: '700',
    flex: 1,
  },
  postDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  conditionLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginRight: 6,
  },
  conditionPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  conditionPillText: {
    fontSize: 11,
    color: '#002f34',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002f34',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  locationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPinLarge: {
    fontSize: 24,
    marginRight: 10,
  },
  locationDetails: {
    flex: 1,
  },
  locationPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002f34',
  },
  locationSecondary: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#002f34',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#002f34',
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    color: '#15803d',
    fontSize: 9,
    fontWeight: '800',
  },
  businessName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  sellerMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metricItem: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  metricDot: {
    marginHorizontal: 6,
    color: '#cbd5e1',
  },
  safetyNotice: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  safetyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  safetyText: {
    flex: 1,
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  reportSection: {
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  reportBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reportBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  similarSection: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  similarScroll: {
    marginTop: 8,
  },
  similarCardWrapper: {
    marginRight: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 5,
  },
  callButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#002f34',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  callButtonText: {
    color: '#002f34',
    fontSize: 14,
    fontWeight: '800',
  },
  chatButton: {
    flex: 2,
    backgroundColor: '#00a49f',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  quickAdSummary: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalAdTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginRight: 8,
  },
  modalAdPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002f34',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: 6,
  },
  enquiryInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#002f34',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quickPromptRow: {
    marginVertical: 10,
    gap: 6,
  },
  promptChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  promptChipText: {
    fontSize: 11,
    color: '#475569',
  },
  sendEnquiryBtn: {
    backgroundColor: '#00a49f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  sendEnquiryBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  sendEnquiryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  callCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  callIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  callSellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: 4,
  },
  callPhone: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00a49f',
    marginBottom: 8,
  },
  callHint: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 240,
  },
  doneBtn: {
    backgroundColor: '#002f34',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#991b1b',
    marginBottom: 6,
  },
  errorText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    maxWidth: 280,
  },
  backBtn: {
    backgroundColor: '#002f34',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
