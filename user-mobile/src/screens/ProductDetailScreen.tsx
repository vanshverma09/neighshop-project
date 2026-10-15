import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert
} from 'react-native';
import { userApi } from '../api/apiClient';
import { IAdvertisement } from '../types/advertisement.types';

interface ProductDetailScreenProps {
  route: { params: { adId: number } };
  navigation: any;
}

export default function ProductDetailScreen({ route, navigation }: ProductDetailScreenProps) {
  const { adId } = route.params;
  const [ad, setAd] = useState<IAdvertisement | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Enquiry Modal
  const [enquiryModalVisible, setEnquiryModalVisible] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('Hi, is this still available? What is your best price?');
  const [isSendingEnquiry, setIsSendingEnquiry] = useState(false);

  // Report Modal
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('fraud');
  const [reportDesc, setReportDesc] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await userApi.getAdvertisementById(adId);
      setAd(res.advertisement);
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Unable to load advertisement details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [adId]);

  const handleToggleFav = async () => {
    if (!ad) return;
    try {
      const res = await userApi.toggleWishlist(ad.id);
      setAd(prev => (prev ? { ...prev, is_favourited: res.is_favourited } : null));
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Please log in to save to your favourites.');
    }
  };

  const handleSendEnquiry = async () => {
    if (!ad || !enquiryMsg.trim()) return;
    setIsSendingEnquiry(true);
    try {
      await userApi.createEnquiry(ad.id, enquiryMsg.trim());
      Alert.alert('Success', 'Your message has been delivered to the seller!');
      setEnquiryModalVisible(false);
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Please log in to send enquiries to sellers.');
    } finally {
      setIsSendingEnquiry(false);
    }
  };

  const handleSendReport = async () => {
    if (!ad) return;
    try {
      await userApi.submitReport(ad.id, reportReason, reportDesc);
      Alert.alert('Report Submitted', 'Our moderation team will investigate this advertisement.');
      setReportModalVisible(false);
    } catch (err: any) {
      Alert.alert('Notice', err.message || 'Failed to submit report');
    }
  };

  if (loading || !ad) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00a49f" />
        <Text style={styles.loadingText}>Loading advertisement...</Text>
      </View>
    );
  }

  const images = ad.images && ad.images.length > 0 ? ad.images : [{ id: 0, advertisement_id: ad.id, image_url: ad.primary_image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600', is_primary: true, display_order: 1 }];

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>{ad.title}</Text>
        <TouchableOpacity onPress={handleToggleFav} style={styles.navBtn}>
          <Text style={styles.favIcon}>{ad.is_favourited ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Photo Gallery Carousel */}
        <View style={styles.gallery}>
          <Image
            source={{ uri: images[activeImageIndex]?.image_url }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {images.length > 1 && (
            <View style={styles.thumbRow}>
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={img.id || idx}
                  style={[styles.thumbBox, activeImageIndex === idx && styles.thumbBoxActive]}
                  onPress={() => setActiveImageIndex(idx)}
                >
                  <Image source={{ uri: img.image_url }} style={styles.thumbImg} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Price & Details Header */}
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{Number(ad.price).toLocaleString('en-IN')}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{ad.category_name}</Text>
            </View>
          </View>
          <Text style={styles.title}>{ad.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>📍 {ad.location || ad.city}, {ad.state}</Text>
            <Text style={styles.metaText}>📅 {new Date(ad.created_at).toLocaleDateString()}</Text>
          </View>

          <View style={styles.conditionTag}>
            <Text style={styles.conditionText}>
              Condition: {ad.product_condition ? ad.product_condition.replace('_', ' ').toUpperCase() : 'USED'}
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Description</Text>
          <Text style={styles.description}>{ad.description}</Text>
        </View>

        {/* Seller Profile Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Seller Information</Text>
          <View style={styles.sellerRow}>
            <Image
              source={{ uri: ad.seller_avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }}
              style={styles.sellerAvatar}
            />
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{ad.seller_name}</Text>
              <Text style={styles.sellerBio}>{ad.business_name || 'Verified Marketplace Member'}</Text>
              <Text style={styles.sellerRating}>⭐ {ad.seller_rating || '5.0'} • {ad.seller_sales || 1} transactions</Text>
            </View>
          </View>
        </View>

        {/* Safety Guidelines */}
        <View style={[styles.card, styles.safetyCard]}>
          <Text style={styles.safetyHeading}>🛡️ Safety & Inspection Advice</Text>
          <Text style={styles.safetyText}>• Inspect the item in person in daylight before handing over payment.</Text>
          <Text style={styles.safetyText}>• Always meet in a public location (e.g. coffee shop, metro station).</Text>
          <Text style={styles.safetyText}>• Never transfer token advances or share bank OTPs with anyone.</Text>
        </View>

        {/* Report Listing */}
        <TouchableOpacity style={styles.reportBtn} onPress={() => setReportModalVisible(true)}>
          <Text style={styles.reportBtnText}>🚩 Report suspicious or policy-violating advertisement</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => Alert.alert('Contact Seller', `Phone: ${ad.contact_phone || 'Available on request'}\nEmail: ${ad.seller_email || 'Verified'}`)}
        >
          <Text style={styles.callBtnText}>📞 Call / Info</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => setEnquiryModalVisible(true)}
        >
          <Text style={styles.chatBtnText}>💬 Chat with Seller</Text>
        </TouchableOpacity>
      </View>

      {/* Enquiry Modal */}
      <Modal visible={enquiryModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Contact {ad.seller_name}</Text>
            <Text style={styles.modalSub}>Regarding: "{ad.title}"</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              value={enquiryMsg}
              onChangeText={setEnquiryMsg}
              placeholder="Write your inquiry or price offer..."
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setEnquiryModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmit}
                onPress={handleSendEnquiry}
                disabled={isSendingEnquiry}
              >
                <Text style={styles.modalSubmitText}>{isSendingEnquiry ? 'Sending...' : 'Send Message'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={reportModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Report Advertisement</Text>
            <Text style={styles.modalSub}>Select violation type:</Text>
            <View style={styles.radioGroup}>
              {['counterfeit', 'fraud', 'spam', 'wrong_category'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.radioItem, reportReason === r && styles.radioItemActive]}
                  onPress={() => setReportReason(r)}
                >
                  <Text style={[styles.radioText, reportReason === r && styles.radioTextActive]}>
                    {r.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={3}
              value={reportDesc}
              onChangeText={setReportDesc}
              placeholder="Explain the problem to the moderation team..."
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setReportModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmit, { backgroundColor: '#ef4444' }]}
                onPress={handleSendReport}
              >
                <Text style={styles.modalSubmitText}>Submit Report</Text>
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
    backgroundColor: '#f1f5f9'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#002f34'
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#002f34',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  navBtn: {
    padding: 6
  },
  navBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  navTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 8
  },
  favIcon: {
    fontSize: 18
  },
  scroll: {
    paddingBottom: 90
  },
  gallery: {
    backgroundColor: '#e2e8f0'
  },
  mainImage: {
    width: '100%',
    height: 280
  },
  thumbRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    backgroundColor: '#ffffff'
  },
  thumbBox: {
    width: 60,
    height: 60,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  thumbBoxActive: {
    borderColor: '#00a49f'
  },
  thumbImg: {
    width: '100%',
    height: '100%'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#002f34'
  },
  badge: {
    backgroundColor: '#e6f7f6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  badgeText: {
    color: '#00a49f',
    fontSize: 12,
    fontWeight: '700'
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    lineHeight: 22
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  metaText: {
    fontSize: 12,
    color: '#64748b'
  },
  conditionTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002f34',
    marginBottom: 8
  },
  description: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12
  },
  sellerDetails: {
    flex: 1
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#002f34'
  },
  sellerBio: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1
  },
  sellerRating: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '700',
    marginTop: 2
  },
  safetyCard: {
    backgroundColor: '#fffdf5',
    borderColor: '#fef08a'
  },
  safetyHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#854d0e',
    marginBottom: 6
  },
  safetyText: {
    fontSize: 12,
    color: '#713f12',
    lineHeight: 18,
    marginBottom: 2
  },
  reportBtn: {
    alignItems: 'center',
    padding: 16
  },
  reportBtnText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600'
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 10
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#002f34',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center'
  },
  callBtnText: {
    color: '#002f34',
    fontWeight: '700',
    fontSize: 14
  },
  chatBtn: {
    flex: 1.4,
    backgroundColor: '#002f34',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center'
  },
  chatBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#002f34',
    marginBottom: 4
  },
  modalSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#002f34',
    textAlignVertical: 'top',
    marginBottom: 14
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12
  },
  radioItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f1f5f9'
  },
  radioItemActive: {
    backgroundColor: '#fee2e2'
  },
  radioText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  radioTextActive: {
    color: '#dc2626',
    fontWeight: '800'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  modalCancel: {
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  modalCancelText: {
    color: '#64748b',
    fontWeight: '600'
  },
  modalSubmit: {
    backgroundColor: '#002f34',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6
  },
  modalSubmitText: {
    color: '#ffffff',
    fontWeight: '700'
  }
});
