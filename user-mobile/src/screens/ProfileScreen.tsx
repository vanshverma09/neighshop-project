import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { userApi, getAuthToken, setAuthToken, subscribeAuthChange } from '../api/apiClient';
import { IUser } from '../types/user.types';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [stats, setStats] = useState<{ favouritesCount?: number; enquiriesCount?: number }>({});
  const [loading, setLoading] = useState(true);

  // Edit Profile Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!getAuthToken()) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await userApi.getProfile();
      setCurrentUser(res.user);
      setNameInput(res.user?.name || '');
      setPhoneInput(res.user?.phone || '');
      setStats(res.stats || {});
    } catch {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    const unsubNav = navigation.addListener('focus', fetchProfile);
    const unsubAuth = subscribeAuthChange(() => fetchProfile());
    return () => {
      unsubNav();
      unsubAuth();
    };
  }, [navigation, fetchProfile]);

  const handleUpdateProfile = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }

    setUpdating(true);
    try {
      const res = await userApi.updateProfile({
        name: nameInput.trim(),
        phone: phoneInput.trim() || undefined
      });
      setCurrentUser(res.user);
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of NeighShop?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await userApi.logout();
          setCurrentUser(null);
          Alert.alert('Signed Out', 'You have been safely signed out.');
        }
      }
    ]);
  };

  if (!currentUser) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.guestContent}>
        <View style={styles.guestIconCircle}>
          <Text style={styles.guestIcon}>👤</Text>
        </View>
        <Text style={styles.guestTitle}>Welcome to NeighShop Global</Text>
        <Text style={styles.guestSubtitle}>
          Sign in to save items to your wishlist, message sellers directly, and track your inquiries.
        </Text>

        <TouchableOpacity
          style={styles.signInBtn}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.signInBtnText}>Sign In / Register</Text>
        </TouchableOpacity>

        {/* Quick Demo Buyer Login */}
        <TouchableOpacity
          style={styles.demoBtn}
          activeOpacity={0.8}
          onPress={async () => {
            try {
              setLoading(true);
              const res = await userApi.login('buyer@neighshop.com', 'Buyer@123');
              setCurrentUser(res.user || null);
              fetchProfile();
            } catch (err: any) {
              Alert.alert('Demo Error', err.message || 'Demo sign in failed.');
            } finally {
              setLoading(false);
            }
          }}
        >
          <Text style={styles.demoBtnText}>⚡ 1-Click Buyer Demo Sign In</Text>
        </TouchableOpacity>

        {/* Trust Badges */}
        <View style={styles.trustCard}>
          <Text style={styles.trustHeading}>Why Sign In to NeighShop?</Text>
          <Text style={styles.trustItem}>✓ 100% Free - Zero Buyer or Seller Commissions</Text>
          <Text style={styles.trustItem}>✓ Direct Chat - Inquire directly with verified owners</Text>
          <Text style={styles.trustItem}>✓ Instant Alerts - Save listings and get notified</Text>
        </View>
      </ScrollView>
    );
  }

  const joinDate = currentUser.created_at
    ? new Date(currentUser.created_at).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short'
      })
    : '2026';

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'B'}
          </Text>
        </View>
        <Text style={styles.userName}>{currentUser.name}</Text>
        <Text style={styles.userEmail}>{currentUser.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>VERIFIED BUYER • MEMBER SINCE {joinDate.toUpperCase()}</Text>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Wishlist')}
        >
          <Text style={styles.statIcon}>❤️</Text>
          <Text style={styles.statNumber}>{stats.favouritesCount || 0}</Text>
          <Text style={styles.statLabel}>Saved Favourites</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('Chats')}
        >
          <Text style={styles.statIcon}>💬</Text>
          <Text style={styles.statNumber}>{stats.enquiriesCount || 0}</Text>
          <Text style={styles.statLabel}>Sent Inquiries</Text>
        </TouchableOpacity>
      </View>

      {/* Account Settings Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Account Details</Text>

        <View style={styles.menuItem}>
          <Text style={styles.menuItemLabel}>Full Name</Text>
          <Text style={styles.menuItemValue}>{currentUser.name}</Text>
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuItemLabel}>Email</Text>
          <Text style={styles.menuItemValue}>{currentUser.email}</Text>
        </View>

        <View style={styles.menuItem}>
          <Text style={styles.menuItemLabel}>Phone</Text>
          <Text style={styles.menuItemValue}>{currentUser.phone || 'Not set'}</Text>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setEditModalVisible(true)}
        >
          <Text style={styles.editBtnText}>✏️ Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Safety & Support Card */}
      <View style={styles.section}>
        <Text style={styles.sectionHeading}>Trust & Safety</Text>
        <Text style={styles.safetyInfo}>
          NeighShop safeguards your personal data. Your email and phone are never displayed publicly without your consent.
        </Text>
        <TouchableOpacity
          style={styles.safetyAction}
          onPress={() =>
            Alert.alert(
              'NeighShop Safety Guidelines',
              '1. Always meet in a public place like a shopping mall or metro station.\n2. Verify the item condition in person before releasing payment.\n3. Never wire funds or scan unknown QR codes in advance.'
            )
          }
        >
          <Text style={styles.safetyActionText}>🛡️ Read Marketplace Safety Tips</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <View style={styles.logoutWrapper}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your full name"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.modalInput}
              value={phoneInput}
              onChangeText={setPhoneInput}
              placeholder="+91 98765 43210"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, updating && styles.saveBtnDisabled]}
                onPress={handleUpdateProfile}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  guestContent: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  guestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 47, 52, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestIcon: {
    fontSize: 40,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#002f34',
    textAlign: 'center',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    maxWidth: 280,
  },
  signInBtn: {
    backgroundColor: '#002f34',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  demoBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  demoBtnText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '700',
  },
  trustCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  trustHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: 8,
  },
  trustItem: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 4,
  },
  header: {
    backgroundColor: '#002f34',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#00a49f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#ffce32',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#002f34',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#002f34',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  menuItemLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  menuItemValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#002f34',
  },
  editBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  editBtnText: {
    color: '#002f34',
    fontSize: 13,
    fontWeight: '700',
  },
  safetyInfo: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 10,
  },
  safetyAction: {
    paddingVertical: 6,
  },
  safetyActionText: {
    fontSize: 12,
    color: '#00a49f',
    fontWeight: '700',
  },
  logoutWrapper: {
    paddingHorizontal: 12,
    marginBottom: 32,
  },
  logoutBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34',
  },
  modalClose: {
    fontSize: 16,
    color: '#64748b',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#002f34',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cancelBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#00a49f',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  saveBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
