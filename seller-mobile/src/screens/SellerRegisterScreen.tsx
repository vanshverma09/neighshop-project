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

interface SellerRegisterScreenProps {
  navigation: any;
}

export default function SellerRegisterScreen({ navigation }: SellerRegisterScreenProps) {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your full name or proprietor name.');
      return;
    }
    if (!businessName.trim()) {
      setErrorMessage('Please enter your business or store display name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid business email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await sellerApi.register({
        name: name.trim(),
        business_name: businessName.trim(),
        business_address: businessAddress.trim() || 'Mumbai, Maharashtra',
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      });

      Alert.alert(
        'Merchant Account Created! 🎉',
        'Your seller storefront has been initialized. You can now post listings and manage buyer inquiries.',
        [
          {
            text: 'Launch Seller Studio',
            onPress: () => navigation.navigate('SellerMain'),
          },
        ]
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Email might already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>← Back to Login</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Register Storefront</Text>
          <Text style={styles.subtitle}>
            Join thousands of local merchants and certified sellers on NeighShop Global.
          </Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Proprietor / Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Vansh Verma"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={(t) => { setName(t); setErrorMessage(''); }}
          />

          <Text style={styles.label}>Store / Business Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Verma Electronics & Gadgets"
            placeholderTextColor="#9ca3af"
            value={businessName}
            onChangeText={(t) => { setBusinessName(t); setErrorMessage(''); }}
          />

          <Text style={styles.label}>Shop Address / Pickup Location</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Shop #14, Linking Road, Bandra West, Mumbai"
            placeholderTextColor="#9ca3af"
            value={businessAddress}
            onChangeText={(t) => { setBusinessAddress(t); setErrorMessage(''); }}
          />

          <Text style={styles.label}>Contact Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 98201 12345"
            placeholderTextColor="#9ca3af"
            value={phone}
            onChangeText={(t) => { setPhone(t); setErrorMessage(''); }}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email Address (Login ID) *</Text>
          <TextInput
            style={styles.input}
            placeholder="store@domain.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrorMessage(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Secure Password (min 6 characters) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a strong password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrorMessage(''); }}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#002f34" />
            ) : (
              <Text style={styles.primaryBtnText}>REGISTER STOREFRONT</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('SellerLogin')}
          >
            <Text style={styles.loginLinkText}>
              Already registered? <Text style={styles.loginHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>
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
    paddingTop: 28,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  backBtn: {
    marginBottom: 12,
  },
  backBtnText: {
    color: '#00a49f',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13,
    color: '#a7f3d0',
    marginTop: 4,
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
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#111827',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#ffce32',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
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
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  loginLinkText: {
    fontSize: 13,
    color: '#4b5563',
  },
  loginHighlight: {
    color: '#00a49f',
    fontWeight: '700',
  },
});
