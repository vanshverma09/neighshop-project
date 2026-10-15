import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { userApi, getAuthToken } from '../api/apiClient';
import { ReportReason } from '../types/report.types';

const REPORT_REASONS: { label: string; value: ReportReason; desc: string }[] = [
  {
    label: 'Counterfeit / Replica Item',
    value: 'counterfeit',
    desc: 'Seller is offering counterfeit, fake or unauthorized replica goods'
  },
  {
    label: 'Fraud / Advance Payment Scam',
    value: 'fraud',
    desc: 'Seller asks for advance deposits or refuses in-person inspection'
  },
  {
    label: 'Spam or Duplicate Listing',
    value: 'spam',
    desc: 'Multiple identical advertisements posted repeatedly'
  },
  {
    label: 'Offensive or Prohibited Item',
    value: 'offensive',
    desc: 'Items violating law, adult goods, or offensive content'
  },
  {
    label: 'Wrong Category / Misleading Info',
    value: 'wrong_category',
    desc: 'Item title, photos or specifications do not match the listing'
  },
  {
    label: 'Other Community Issue',
    value: 'other',
    desc: 'Any other safety or marketplace policy concern'
  }
];

interface ReportAdScreenProps {
  route: { params: { adId: number; adTitle: string } };
  navigation: any;
}

export default function ReportAdScreen({ route, navigation }: ReportAdScreenProps) {
  const { adId, adTitle } = route.params;

  const [selectedReason, setSelectedReason] = useState<ReportReason>('counterfeit');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!getAuthToken()) {
      Alert.alert('Sign In Required', 'Please sign in to submit a safety report.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    if (!description.trim()) {
      Alert.alert('Required Information', 'Please provide a brief explanation of the issue.');
      return;
    }

    setLoading(true);
    try {
      await userApi.submitReport(adId, selectedReason, description.trim());
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconCircle}>
          <Text style={styles.successIcon}>🛡️</Text>
        </View>
        <Text style={styles.successTitle}>Report Received</Text>
        <Text style={styles.successSub}>
          Thank you for helping keep NeighShop safe. Our safety and moderation team will review this listing promptly.
        </Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneBtnText}>Return to Listing</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Info */}
      <View style={styles.cardHeader}>
        <Text style={styles.reportingOnLabel}>Reporting Advertisement:</Text>
        <Text style={styles.adTitle} numberOfLines={2}>{adTitle || `#${adId}`}</Text>
      </View>

      <Text style={styles.sectionLabel}>Select Reason for Report</Text>

      {/* Reasons Radio List */}
      <View style={styles.reasonsList}>
        {REPORT_REASONS.map(r => {
          const isSelected = selectedReason === r.value;
          return (
            <TouchableOpacity
              key={r.value}
              style={[styles.reasonItem, isSelected && styles.reasonItemSelected]}
              activeOpacity={0.8}
              onPress={() => setSelectedReason(r.value)}
            >
              <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
              <View style={styles.reasonTextWrapper}>
                <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelSelected]}>
                  {r.label}
                </Text>
                <Text style={styles.reasonDesc}>{r.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Details Textarea */}
      <Text style={styles.sectionLabel}>Additional Details *</Text>
      <TextInput
        style={styles.textarea}
        multiline
        numberOfLines={4}
        placeholder="Please describe why this listing violates community safety guidelines..."
        placeholderTextColor="#94a3b8"
        value={description}
        onChangeText={setDescription}
      />

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
        activeOpacity={0.85}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.submitBtnText}>Submit Safety Report</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        NeighShop takes all fraud and counterfeit reports seriously. False reports may result in account penalties.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardHeader: {
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  reportingOnLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#002f34',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#002f34',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonsList: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  reasonItemSelected: {
    backgroundColor: '#f0fdfa',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#00a49f',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00a49f',
  },
  reasonTextWrapper: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  reasonLabelSelected: {
    color: '#002f34',
  },
  reasonDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  textarea: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 12,
    fontSize: 13,
    color: '#002f34',
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitBtnDisabled: {
    backgroundColor: '#f87171',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  doneBtn: {
    backgroundColor: '#002f34',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
