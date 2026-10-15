import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { sellerApi } from '../api/apiClient';
import { ICategory, ISubcategory } from '../types/category.types';
import { ProductCondition, IAdvertisement } from '../types/advertisement.types';

interface PostAdScreenProps {
  route?: { params?: { editAd?: IAdvertisement } };
  navigation: any;
}

const PRESET_IMAGE_GALLERY = [
  { label: 'Smartphone', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800' },
  { label: 'Laptop', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800' },
  { label: 'Motorbike', url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800' },
  { label: 'Furniture', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800' },
  { label: 'Smartwatch', url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800' },
  { label: 'Car / Auto', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800' },
  { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800' },
  { label: 'Camera', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800' },
];

export default function PostAdScreen({ route, navigation }: PostAdScreenProps) {
  const editAd = route?.params?.editAd;
  const isEditing = !!editAd;

  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(editAd?.category_id || null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(editAd?.subcategory_id || null);

  const [title, setTitle] = useState(editAd?.title || '');
  const [description, setDescription] = useState(editAd?.description || '');
  const [price, setPrice] = useState(editAd?.price ? editAd.price.toString() : '');
  const [condition, setCondition] = useState<ProductCondition>(editAd?.product_condition || 'used_like_new');
  const [city, setCity] = useState(editAd?.city || 'Mumbai');
  const [state, setState] = useState(editAd?.state || 'Maharashtra');
  const [location, setLocation] = useState(editAd?.location || 'Bandra West');
  const [phone, setPhone] = useState(editAd?.contact_phone || '+91 98201 12345');

  // Multi-image management (array of image URLs)
  const initialImages: string[] = [];
  if (editAd?.images && editAd.images.length > 0) {
    editAd.images.forEach(img => initialImages.push(img.image_url));
  } else if (editAd?.primary_image) {
    initialImages.push(editAd.primary_image);
  } else {
    initialImages.push(PRESET_IMAGE_GALLERY[0].url);
  }

  const [images, setImages] = useState<string[]>(initialImages);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await sellerApi.getCategories();
        setCategories(res.categories || []);
        if (!selectedCategoryId && res.categories?.length > 0) {
          setSelectedCategoryId(res.categories[0].id);
        }
      } catch (err) {
        console.warn('Error loading categories:', err);
      } finally {
        setLoadingCats(false);
      }
    };
    loadCategories();
  }, []);

  const activeCategory = categories.find(c => c.id === selectedCategoryId);
  const subcategories: ISubcategory[] = activeCategory?.subcategories || [];

  // Image helpers
  const handleAddCustomImage = () => {
    const trimmed = customImageUrl.trim();
    if (!trimmed) {
      Alert.alert('Empty URL', 'Please paste a valid photo URL (JPEG, PNG, WEBP).');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Image URL must begin with http:// or https://');
      return;
    }
    if (images.length >= 8) {
      Alert.alert('Maximum Limit', 'You can upload up to 8 images per advertisement.');
      return;
    }
    setImages(prev => [...prev, trimmed]);
    setCustomImageUrl('');
  };

  const handleAddPresetImage = (url: string) => {
    if (images.length >= 8) {
      Alert.alert('Limit Reached', 'You can attach a maximum of 8 photos.');
      return;
    }
    if (images.includes(url)) {
      Alert.alert('Already Added', 'This photo has already been added to your gallery.');
      return;
    }
    setImages(prev => [...prev, url]);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (images.length <= 1) {
      Alert.alert('Required Photo', 'An advertisement must contain at least 1 photo.');
      return;
    }
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    setImages(prev => {
      const selected = prev[indexToPrimary];
      const remaining = prev.filter((_, idx) => idx !== indexToPrimary);
      return [selected, ...remaining];
    });
    Alert.alert('Cover Photo Updated', 'The selected photo has been set as the primary cover image.');
  };

  const handleSubmit = async () => {
    if (!title.trim() || title.trim().length < 5) {
      Alert.alert('Invalid Title', 'Please enter a descriptive title (at least 5 characters).');
      return;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price in INR (₹).');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Required Field', 'Please select a product category.');
      return;
    }
    if (images.length === 0) {
      Alert.alert('Photo Required', 'Please attach at least one photo of the item.');
      return;
    }
    if (!city.trim() || !location.trim()) {
      Alert.alert('Required Location', 'Please provide city and locality details.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && editAd) {
        await sellerApi.updateAdvertisement(editAd.id, {
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          category_id: selectedCategoryId,
          subcategory_id: selectedSubcategoryId || undefined,
          product_condition: condition,
          location: location.trim(),
          city: city.trim(),
          state: state.trim(),
          contact_phone: phone.trim(),
          images: images,
          status: 'pending', // Resubmitted listing enters moderation
        });

        Alert.alert(
          'Listing Resubmitted! 🎉',
          'Your updated advertisement and photos have been submitted for moderation review.',
          [
            {
              text: 'Go to My Ads',
              onPress: () => navigation.navigate('MyAds', { filter: 'pending' }),
            },
          ]
        );
      } else {
        await sellerApi.createAdvertisement({
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          category_id: selectedCategoryId,
          subcategory_id: selectedSubcategoryId || undefined,
          product_condition: condition,
          location: location.trim(),
          city: city.trim(),
          state: state.trim(),
          contact_phone: phone.trim(),
          images: images,
        });

        Alert.alert(
          'Advertisement Published! 🎉',
          'Your listing has been submitted for administrative review and will go live once approved.',
          [
            {
              text: 'View in My Ads',
              onPress: () => navigation.navigate('MyAds', { filter: 'pending' }),
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit advertisement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEditing ? '✏️ Edit & Resubmit Advertisement' : '📢 Post an Advertisement'}
        </Text>
        <Text style={styles.headerSub}>
          {isEditing
            ? 'Adjust details according to moderator feedback and resubmit.'
            : 'Fill in the details to publish your item to thousands of buyers.'}
        </Text>
      </View>

      {/* 1. Category Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Choose Category</Text>
        {loadingCats ? (
          <ActivityIndicator size="small" color="#00a49f" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.catChip,
                  selectedCategoryId === cat.id && styles.catChipActive,
                ]}
                onPress={() => {
                  setSelectedCategoryId(cat.id);
                  setSelectedSubcategoryId(null);
                }}
              >
                <Text
                  style={[
                    styles.catChipText,
                    selectedCategoryId === cat.id && styles.catChipTextActive,
                  ]}
                >
                  {cat.icon || '🏷️'} {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {subcategories.length > 0 && (
          <View style={styles.subcatContainer}>
            <Text style={styles.subcatLabel}>Subcategory (Optional):</Text>
            <View style={styles.subcatGrid}>
              {subcategories.map(sub => (
                <TouchableOpacity
                  key={sub.id}
                  style={[
                    styles.subcatChip,
                    selectedSubcategoryId === sub.id && styles.subcatChipActive,
                  ]}
                  onPress={() => setSelectedSubcategoryId(selectedSubcategoryId === sub.id ? null : sub.id)}
                >
                  <Text
                    style={[
                      styles.subcatText,
                      selectedSubcategoryId === sub.id && styles.subcatTextActive,
                    ]}
                  >
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 2. Item Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Item Details</Text>

        <Text style={styles.fieldLabel}>Ad Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Apple iPhone 14 Pro 128GB Space Black (Mint Condition)"
          maxLength={100}
        />
        <Text style={styles.charCount}>{title.length}/100 characters</Text>

        <Text style={styles.fieldLabel}>Price in INR (₹) *</Text>
        <View style={styles.priceInputWrapper}>
          <Text style={styles.currencyPrefix}>₹</Text>
          <TextInput
            style={styles.priceInput}
            value={price}
            onChangeText={setPrice}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <Text style={styles.fieldLabel}>Condition *</Text>
        <View style={styles.conditionRow}>
          {[
            { key: 'new', label: 'Brand New' },
            { key: 'used_like_new', label: 'Like New' },
            { key: 'used_good', label: 'Good' },
            { key: 'used_fair', label: 'Fair' },
          ].map(c => (
            <TouchableOpacity
              key={c.key}
              style={[styles.condChip, condition === c.key && styles.condChipActive]}
              onPress={() => setCondition(c.key as ProductCondition)}
            >
              <Text style={[styles.condChipText, condition === c.key && styles.condChipTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Detailed Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Mention key specifications, original accessories included, bill/box availability, physical condition..."
          multiline
          numberOfLines={4}
        />
      </View>

      {/* 3. Product Photos (Multi-Image Gallery & Uploader) */}
      <View style={styles.card}>
        <View style={styles.photoHeaderRow}>
          <Text style={styles.cardTitle}>3. Product Photos ({images.length}/8)</Text>
          <Text style={styles.photoHelp}>Tap photo to set as Cover</Text>
        </View>

        {/* Selected Photos Thumbnails Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbStrip}>
          {images.map((imgUrl, index) => (
            <View key={index} style={styles.thumbWrapper}>
              <TouchableOpacity onPress={() => handleSetPrimary(index)}>
                <Image source={{ uri: imgUrl }} style={styles.thumbImage} resizeMode="cover" />
              </TouchableOpacity>
              {index === 0 && (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverBadgeText}>COVER</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveImage(index)}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Custom Image URL Uploader */}
        <Text style={styles.fieldLabel}>Add Photo via URL</Text>
        <View style={styles.urlInputRow}>
          <TextInput
            style={[styles.input, styles.urlInput]}
            value={customImageUrl}
            onChangeText={setCustomImageUrl}
            placeholder="Paste image link (https://...)"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.addUrlBtn} onPress={handleAddCustomImage}>
            <Text style={styles.addUrlBtnText}>+ ADD</Text>
          </TouchableOpacity>
        </View>

        {/* Preset Gallery Picker */}
        <Text style={styles.photoPresetsTitle}>Quick sample product gallery (tap to add):</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {PRESET_IMAGE_GALLERY.map((preset, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleAddPresetImage(preset.url)}
              style={styles.presetItem}
            >
              <Image source={{ uri: preset.url }} style={styles.presetThumb} />
              <Text style={styles.presetLabel} numberOfLines={1}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 4. Location & Contact */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>4. Location & Contact Information</Text>

        <Text style={styles.fieldLabel}>Locality / Street Area *</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Linking Road, Bandra West"
        />

        <View style={styles.twoColRow}>
          <View style={styles.col}>
            <Text style={styles.fieldLabel}>City *</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Mumbai"
            />
          </View>
          <View style={styles.col}>
            <Text style={styles.fieldLabel}>State *</Text>
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="e.g. Maharashtra"
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Seller Contact Phone *</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98201 12345"
          keyboardType="phone-pad"
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#002f34" />
        ) : (
          <Text style={styles.submitBtnText}>
            {isEditing ? 'RESUBMIT ADVERTISEMENT FOR REVIEW' : 'PUBLISH ADVERTISEMENT FOR REVIEW'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f3f6',
  },
  content: {
    paddingBottom: 36,
  },
  header: {
    backgroundColor: '#002f34',
    padding: 18,
    paddingTop: 22,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 12,
    color: '#00a49f',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 14,
    marginTop: 14,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#002f34',
    marginBottom: 8,
  },
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 6,
    marginBottom: 10,
  },
  photoHelp: {
    fontSize: 11,
    color: '#00a49f',
    fontWeight: '600',
  },
  catScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  catChipActive: {
    backgroundColor: '#002f34',
    borderColor: '#002f34',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  catChipTextActive: {
    color: '#ffffff',
  },
  subcatContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  subcatLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
  },
  subcatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subcatChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  subcatChipActive: {
    backgroundColor: '#00a49f',
    borderColor: '#00a49f',
  },
  subcatText: {
    fontSize: 11,
    color: '#4b5563',
  },
  subcatTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#111827',
  },
  charCount: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 2,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002f34',
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: '700',
    color: '#002f34',
  },
  conditionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  condChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  condChipActive: {
    backgroundColor: '#002f34',
    borderColor: '#002f34',
  },
  condChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
  },
  condChipTextActive: {
    color: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  thumbStrip: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  thumbWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  thumbImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#eee',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#002f34',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  coverBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  removeBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urlInput: {
    flex: 1,
    marginRight: 8,
  },
  addUrlBtn: {
    backgroundColor: '#00a49f',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  addUrlBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  photoPresetsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
    marginBottom: 6,
  },
  presetScroll: {
    flexDirection: 'row',
  },
  presetItem: {
    alignItems: 'center',
    marginRight: 10,
    width: 64,
  },
  presetThumb: {
    width: 54,
    height: 54,
    borderRadius: 6,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  presetLabel: {
    fontSize: 10,
    color: '#4b5563',
    marginTop: 3,
    textAlign: 'center',
  },
  twoColRow: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
    marginRight: 8,
  },
  submitBtn: {
    backgroundColor: '#ffce32',
    marginHorizontal: 14,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#002f34',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
