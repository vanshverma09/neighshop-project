import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions
} from 'react-native';
import { IAdvertisement } from '../types/advertisement.types';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = (width - 36) / 2;

interface ProductCardProps {
  item: IAdvertisement;
  onPress: () => void;
  onToggleFav?: (adId: number) => void;
  cardWidth?: number;
}

export default function ProductCard({
  item,
  onPress,
  onToggleFav,
  cardWidth = CARD_WIDTH
}: ProductCardProps) {
  const formatCondition = (cond?: string) => {
    switch (cond) {
      case 'new': return 'Brand New';
      case 'used_like_new': return 'Like New';
      case 'used_good': return 'Good';
      case 'used_fair': return 'Fair';
      default: return cond ? cond.replace('_', ' ') : '';
    }
  };

  const primaryImage =
    item.primary_image ||
    (item.images && item.images.length > 0 ? item.images[0].image_url : null) ||
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400';

  const formattedPrice = Number(item.price || 0).toLocaleString('en-IN');

  const formattedDate = item.created_at
    ? new Date(item.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
    : 'Recent';

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: primaryImage }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {item.is_featured ? (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>⭐ FEATURED</Text>
          </View>
        ) : null}

        {item.product_condition ? (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{formatCondition(item.product_condition)}</Text>
          </View>
        ) : null}

        {onToggleFav && (
          <TouchableOpacity
            style={styles.favButton}
            activeOpacity={0.7}
            onPress={() => onToggleFav(item.id)}
          >
            <Text style={styles.favIcon}>
              {item.is_favourited ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.priceText}>₹{formattedPrice}</Text>
        <Text style={styles.titleText} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.locationMeta} numberOfLines={1}>
            📍 {item.city || item.location || 'India'}
          </Text>
          <Text style={styles.dateMeta}>{formattedDate}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 130,
    backgroundColor: '#e2e8f0',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#ffce32',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredBadgeText: {
    color: '#002f34',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  conditionBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 47, 52, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  conditionText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
  },
  favButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  favIcon: {
    fontSize: 14,
  },
  cardDetails: {
    padding: 8,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002f34',
    marginBottom: 2,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
    lineHeight: 16,
    minHeight: 32,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 4,
  },
  locationMeta: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
    marginRight: 4,
  },
  dateMeta: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '400',
  },
});
