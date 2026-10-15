import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { sellerApi } from '../api/apiClient';

interface SellerLoginScreenProps {
  navigation: any;
}

export default function SellerLoginScreen({ navigation }: SellerLoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (customEmail?: string, customPass?: string) => {
    const targetEmail = (customEmail || email).trim();
    const targetPass = customPass || password;

    if (!targetEmail || !targetPass) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const res = await sellerApi.login(targetEmail, targetPass);
      if (res.user.role !== 'seller' && res.user.role !== 'admin') {
        Alert.alert(
          'Role Notice',
          `You logged in as "${res.user.role}". You can manage your marketplace storefront with standard seller permissions.`
        );
      }
      navigation.navigate('SellerMain');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillSellerDemo = () => {
    setEmail('seller@neighshop.com');
    setPassword('Seller@123');
    handleLogin('seller@neighshop.com', 'Seller@123');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🏪 SELLER STUDIO</Text>
          </View>
          <Text style={styles.title}>Welcome Back, Merchant</Text>
          <Text style={styles.subtitle}>
            Publish listings, manage inquiries, track inventory, and grow your sales on NeighShop.
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in to your Seller Account</Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Registered Email</Text>
          <TextInput
            style={styles.input}
            placeholder="seller@example.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errorMessage) setErrorMessage('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errorMessage) setErrorMessage('');
            }}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#002f34" />
            ) : (
              <Text style={styles.primaryBtnText}>SIGN IN AS SELLER</Text>
            )}
          </TouchableOpacity>

          {/* Quick Demo Autofill */}
          <TouchableOpacity
            style={styles.demoBtn}
            onPress={fillSellerDemo}
            disabled={loading}
          >
            <Text style={styles.demoBtnText}>⚡ 1-Click Demo Seller (Vansh)</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>

          {/* Registration Link */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('SellerRegister')}
          >
            <Text style={styles.registerBtnText}>
              New seller? <Text style={styles.registerHighlight}>Register your storefront</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Benefits Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>✨ Why sell on NeighShop Global?</Text>
          <Text style={styles.noteItem}>• Free classified advertisement publishing across all 7 categories.</Text>
          <Text style={styles.noteItem}>• Direct buyer communication and call requests with zero commission.</Text>
          <Text style={styles.noteItem}>• Real-time moderation feedback with clear rejection guidance.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002f34',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 36,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  badge: {
    backgroundColor: '#ffce32',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    color: '#002f34',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: '#00a49f',
    marginTop: 6,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 10,
    borderRadius: 4,
    marginBottom: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 14,
  },
  primaryBtn: {
    backgroundColor: '#ffce32',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#002f34',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoBtn: {
    backgroundColor: '#e6f7f6',
    borderWidth: 1,
    borderColor: '#00a49f',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  demoBtnText: {
    color: '#00796b',
    fontSize: 13,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: '600',
  },
  registerBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  registerBtnText: {
    fontSize: 13,
    color: '#4b5563',
  },
  registerHighlight: {
    color: '#00a49f',
    fontWeight: '700',
  },
  noteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  noteTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  noteItem: {
    color: '#d1d5db',
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 16,
  },
});
