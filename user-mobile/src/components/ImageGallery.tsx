import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { IAdImage } from '../types/advertisement.types';

const { width } = Dimensions.get('window');

interface ImageGalleryProps {
  images: (IAdImage | { image_url: string; id?: number })[];
  height?: number;
}

export default function ImageGallery({ images, height = 280 }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const fallback = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800';
  const validImages = images && images.length > 0 ? images : [{ image_url: fallback }];
  const currentImage = validImages[activeIndex]?.image_url || fallback;

  return (
    <View style={styles.container}>
      {/* Main Image */}
      <View style={[styles.mainImageWrapper, { height }]}>
        <Image
          source={{ uri: currentImage }}
          style={styles.mainImage}
          resizeMode="cover"
        />
        {validImages.length > 1 && (
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              📷 {activeIndex + 1} / {validImages.length}
            </Text>
          </View>
        )}
      </View>

      {/* Thumbnails Row */}
      {validImages.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbnailsContainer}
        >
          {validImages.map((img, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              onPress={() => setActiveIndex(idx)}
              style={[
                styles.thumbnailWrapper,
                activeIndex === idx && styles.thumbnailActive
              ]}
            >
              <Image
                source={{ uri: img.image_url || fallback }}
                style={styles.thumbnailImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    position: 'relative',
  },
  mainImageWrapper: {
    width: '100%',
    backgroundColor: '#0f172a',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  counterBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  thumbnailsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
  },
  thumbnailWrapper: {
    width: 56,
    height: 56,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  thumbnailActive: {
    borderColor: '#00a49f',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
});
