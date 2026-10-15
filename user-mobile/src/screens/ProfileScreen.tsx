import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert
} from 'react-native';
import { userApi, setAuthToken } from '../api/apiClient';
import { IUser } from '../types/user.types';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [emailInput, setEmailInput] = useState('buyer@neighshop.com');
  const [passwordInput, setPasswordInput] = useState('Buyer@123');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await userApi.getProfile();
      setCurrentUser(res.user);
    } catch {
      // not logged in
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await userApi.login(emailInput, passwordInput);
      setAuthToken(res.token || null, res.user);
      setCurrentUser(res.user || null);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null, null);
    setCurrentUser(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Account & Profile</Text>
      </View>

      {currentUser ? (
        <View style={styles.content}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <Image
              source={{ uri: currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }}
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{currentUser.name}</Text>
              <Text style={styles.userEmail}>{currentUser.email}</Text>
              <Text style={styles.userRole}>Account Role: {currentUser.role.toUpperCase()}</Text>
            </View>
          </View>

          {/* Quick Menu */}
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('Wishlist')}
            >
              <Text style={styles.menuIcon}>❤️</Text>
              <Text style={styles.menuLabel}>Saved Wishlist Advertisements</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('Chats')}
            >
              <Text style={styles.menuIcon}>💬</Text>
              <Text style={styles.menuLabel}>Messages & Inquiries</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => Alert.alert('Safety Tips', 'Always meet in public places, verify product condition in person before paying, and never share OTPs.')}
            >
              <Text style={styles.menuIcon}>🛡️</Text>
              <Text style={styles.menuLabel}>NeighShop Safety & Fraud Guidelines</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Switch to Seller Mode Notice */}
          <View style={styles.switchBox}>
            <Text style={styles.switchTitle}>Are you a Seller?</Text>
            <Text style={styles.switchSub}>
              Use the dedicated NeighShop Seller Mobile App to manage your listings, post new classifieds, and track buyer leads.
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.authBox}>
            <Text style={styles.authTitle}>Log In to NeighShop</Text>
            <Text style={styles.authSub}>Access your saved ads, chats, and customized recommendations.</Text>

            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={emailInput}
              onChangeText={setEmailInput}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={passwordInput}
              onChangeText={setPasswordInput}
              secureTextEntry
            />

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoggingIn}>
              <Text style={styles.loginBtnText}>{isLoggingIn ? 'Logging in...' : 'Sign In as Buyer'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
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
    fontWeight: '800'
  },
  content: {
    padding: 16
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#cbd5e1',
    marginRight: 14
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34'
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2
  },
  userRole: {
    fontSize: 11,
    color: '#00a49f',
    fontWeight: '700',
    marginTop: 4
  },
  menuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    fontWeight: '500'
  },
  menuArrow: {
    fontSize: 20,
    color: '#94a3b8'
  },
  switchBox: {
    backgroundColor: '#e6f7f6',
    borderWidth: 1,
    borderColor: '#99e2df',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: 4
  },
  switchSub: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  logoutBtnText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 14
  },
  authBox: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  authTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#002f34',
    marginBottom: 6
  },
  authSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#002f34',
    marginBottom: 12
  },
  loginBtn: {
    backgroundColor: '#002f34',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center'
  },
  loginBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14
  }
});
