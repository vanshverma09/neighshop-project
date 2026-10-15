import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { userApi, getAuthToken } from '../api/apiClient';

interface SplashScreenProps {
  navigation: any;
}

export default function SplashScreen({ navigation }: SplashScreenProps) {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        if (getAuthToken()) {
          await userApi.getProfile();
        }
      } catch {
        // session invalid or not logged in
      } finally {
        setCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  const handleStartBrowsing = () => {
    navigation.replace('MainTabs');
  };

  const handleGoLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#002f34" />
      
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>🛍️</Text>
        </View>
        <Text style={styles.brandTitle}>NEIGHSHOP</Text>
        <Text style={styles.brandTagline}>GLOBAL CLASSIFIED MARKETPLACE</Text>
        <View style={styles.brandDivider} />
        <Text style={styles.brandSub}>
          Discover great deals, chat directly with sellers, and buy with confidence across India.
        </Text>
      </View>

      {/* Feature Pills */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>🛡️</Text>
          <View style={styles.featureTextWrapper}>
            <Text style={styles.featureTitle}>100% Moderated Ads</Text>
            <Text style={styles.featureDesc}>Every listing is verified by our safety team</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>⚡</Text>
          <View style={styles.featureTextWrapper}>
            <Text style={styles.featureTitle}>Direct Seller Inquiries</Text>
            <Text style={styles.featureDesc}>Chat in real time with local sellers near you</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureIcon}>📍</Text>
          <View style={styles.featureTextWrapper}>
            <Text style={styles.featureTitle}>Hyper-Local Discovery</Text>
            <Text style={styles.featureDesc}>Filter items in Mumbai, Bengaluru, Delhi & more</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {checkingAuth ? (
          <ActivityIndicator size="small" color="#00a49f" />
        ) : (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.88}
              onPress={handleStartBrowsing}
            >
              <Text style={styles.primaryButtonText}>Explore Marketplace</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.88}
              onPress={handleGoLogin}
            >
              <Text style={styles.secondaryButtonText}>Sign In / Register</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Footer */}
      <Text style={styles.footerText}>Version 1.0 • Built for NeighShop Global</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002f34',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 32,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 164, 159, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#00a49f',
    marginBottom: 16,
  },
  logoIcon: {
    fontSize: 40,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00a49f',
    letterSpacing: 2,
    marginTop: 4,
  },
  brandDivider: {
    width: 48,
    height: 3,
    backgroundColor: '#ffce32',
    borderRadius: 2,
    marginVertical: 14,
  },
  brandSub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  featuresContainer: {
    marginVertical: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  featureTextWrapper: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  featureDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#00a49f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#00a49f',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#64748b',
  },
});
