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

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600', // phone
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', // macbook
  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600', // bike
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', // sofa
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600', // smartwatch
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
  const [location, setLocation] = useState(editAd?.location || 'Andheri West');
  const [phone, setPhone] = useState(editAd?.contact_phone || '+91 98201 12345');
  const [imageUrl, setImageUrl] = useState(editAd?.primary_image || SAMPLE_IMAGES[0]);

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

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for your ad.');
      return;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price in ₹.');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Required Field', 'Please select a product category.');
      return;
    }
    if (!city.trim() || !location.trim()) {
      Alert.alert('Required Field', 'Please provide city and locality details.');
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
          images: [imageUrl],
          status: 'pending', // resubmitted for admin review
        });

        Alert.alert(
          'Ad Resubmitted! 🎉',
          'Your updated advertisement has been submitted to the moderation queue for review.',
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
          images: [imageUrl],
        });

        Alert.alert(
          'Ad Posted Successfully! 🎉',
          'Your listing is currently under review by our moderation team and will go live once verified.',
          [
            {
              text: 'View My Ads',
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

      {/* Category Section */}
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

      {/* Ad Details Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Item Details</Text>

        <Text style={styles.fieldLabel}>Ad Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Apple iPhone 14 Pro 128GB Space Black"
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

        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Mention brand, age, reason for selling, accessories included, scratches/defects..."
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Photo Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>3. Product Photos</Text>
        <Text style={styles.fieldLabel}>Primary Photo URL</Text>
        <TextInput
          style={styles.input}
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://example.com/item.jpg"
        />

        <Text style={styles.photoPresetsTitle}>Quick sample presets:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {SAMPLE_IMAGES.map((url, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setImageUrl(url)}
              style={[styles.presetThumbWrapper, imageUrl === url && styles.presetThumbActive]}
            >
              <Image source={{ uri: url }} style={styles.presetThumb} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {imageUrl ? (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Current Photo Preview:</Text>
            <Image source={{ uri: imageUrl }} style={styles.photoPreview} resizeMode="cover" />
          </View>
        ) : null}
      </View>

      {/* Location & Contact */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>4. Location & Contact</Text>

        <Text style={styles.fieldLabel}>Locality / Area *</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Bandra West, Near Metro Station"
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

        <Text style={styles.fieldLabel}>Contact Phone *</Text>
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
            {isEditing ? 'RESUBMIT AD FOR REVIEW' : 'POST ADVERTISEMENT NOW'}
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
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 6,
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
    fontWeight: '600',
  },
  subcatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  subcatChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fafafa',
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  subcatChipActive: {
    backgroundColor: '#00a49f',
    borderColor: '#00a49f',
  },
  subcatText: {
    fontSize: 11,
    color: '#555',
  },
  subcatTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333333',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 10,
    color: '#888888',
    alignSelf: 'flex-end',
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
    fontSize: 18,
    fontWeight: '800',
    color: '#002f34',
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#002f34',
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  condChip: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 2,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  condChipActive: {
    backgroundColor: '#002f34',
    borderColor: '#002f34',
  },
  condChipText: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '600',
  },
  condChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  photoPresetsTitle: {
    fontSize: 11,
    color: '#666',
    marginTop: 10,
    marginBottom: 6,
  },
  presetScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  presetThumbWrapper: {
    marginRight: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  presetThumbActive: {
    borderColor: '#00a49f',
  },
  presetThumb: {
    width: 60,
    height: 60,
    borderRadius: 4,
  },
  previewContainer: {
    marginTop: 6,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 0.48,
  },
  submitBtn: {
    backgroundColor: '#ffce32',
    marginHorizontal: 14,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#002f34',
    letterSpacing: 0.5,
  },
});
