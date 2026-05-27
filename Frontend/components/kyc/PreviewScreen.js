import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';

export default function PreviewScreen({
  colors,
  frontPhoto,
  backPhoto,
  selfiePhoto,
  onRetake,
  onSubmit,
  onViewImage,
  qualityResults,
  checkingQuality,
  onCheckQuality,
  qualityErrors = {}, // safe default prevents crash
}) {
  const { width } = useWindowDimensions();

  // -------------------------
  // BREAKPOINTS
  // -------------------------
  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 1100;
  const isDesktop = width >= 1100;

  const cardWidth = isDesktop ? '32%' : isTablet ? '48%' : '100%';

  const titleSize = isPhone ? 28 : 34;
  const subtitleSize = isPhone ? 15 : 16;

  // -------------------------
  // SAFETY CHECKS
  // -------------------------
  const hasImages = frontPhoto && backPhoto && selfiePhoto;

  const hasBackendResults =
    qualityResults?.front &&
    qualityResults?.back &&
    qualityResults?.selfie;

  const allValid =
    qualityResults?.front?.valid &&
    qualityResults?.back?.valid &&
    qualityResults?.selfie?.valid;

  const canSubmit =
    hasImages &&
    hasBackendResults &&
    allValid &&
    !checkingQuality;

  // -------------------------
  // QUALITY ROW
  // -------------------------
  const QualityRow = ({ label, passed }) => (
    <View style={styles.row}>
      <View
        style={[
          styles.dot,
          { backgroundColor: passed ? '#4CAF50' : '#FF5252' },
        ]}
      />
      <Text
        style={[
          styles.rowText,
          { color: passed ? colors.secondaryText : '#FF5252' },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  // -------------------------
  // CARD
  // -------------------------
  const PreviewCard = ({ title, image, type, status, qualityData }) => {
    const isSelfie = type === 'selfie';

    const imageHeight = isPhone
      ? isSelfie ? 240 : 180
      : isTablet
        ? isSelfie ? 300 : 220
        : isSelfie ? 360 : 250;

    const errorMessage = qualityErrors?.[type];

    return (
      <View
        style={[
          styles.card,
          {
            width: cardWidth,
            backgroundColor: colors.surface,
            borderColor: status === 'invalid' ? '#FF5252' : colors.border,
            borderWidth: status === 'invalid' ? 2 : 1,
          },
        ]}
      >
        {/* ERROR */}
        {!!errorMessage && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>

          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  status === 'valid'
                    ? 'rgba(76,175,80,0.12)'
                    : status === 'invalid'
                    ? 'rgba(255,82,82,0.12)'
                    : 'rgba(255,152,0,0.12)',
              },
            ]}
          >
            <Text
              style={{
                color:
                  status === 'valid'
                    ? '#4CAF50'
                    : status === 'invalid'
                    ? '#FF5252'
                    : '#FF9800',
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              {status === 'valid'
                ? 'Verified'
                : status === 'invalid'
                ? 'Issues Found'
                : 'Unchecked'}
            </Text>
          </View>
        </View>

        {/* IMAGE */}
        <View style={styles.imageWrap}>
          {image?.uri ? (
            <Image
              source={{ uri: image.uri }}
              style={{ width: '100%', height: imageHeight }}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholder, { height: imageHeight }]}>
              <Text style={{ color: '#888' }}>No image</Text>
            </View>
          )}
        </View>

        {/* QUALITY */}
        <View style={styles.qualityBox}>
          {qualityData?.checks ? (
            Object.entries(qualityData.checks).map(([key, value]) => (
              <QualityRow
                key={key}
                label={key.replace(/_/g, ' ')}
                passed={value}
              />
            ))
          ) : (
            <Text style={{ color: colors.secondaryText }}>
              Run quality check first
            </Text>
          )}

          {!!qualityData?.message && (
            <Text
              style={{
                marginTop: 10,
                color: qualityData.valid ? '#4CAF50' : '#FF5252',
                fontWeight: '600',
              }}
            >
              {qualityData.message}
            </Text>
          )}
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onRetake(type)}
            style={[styles.btnSecondary, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              Retake
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onViewImage(image, type)}
            style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>
              View
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // -------------------------
  // RENDER
  // -------------------------
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: isPhone ? 16 : 24,
        alignItems: 'center',
      }}
    >
      <View style={{ width: '100%', maxWidth: 1400 }}>
        {/* HEADER */}
        <Text style={{ fontSize: titleSize, fontWeight: '800', color: colors.text }}>
          Review Verification
        </Text>

        <Text
          style={{
            fontSize: subtitleSize,
            color: colors.secondaryText,
            marginBottom: 20,
          }}
        >
          Confirm documents before submitting.
        </Text>

        {/* CARDS */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <PreviewCard
            title="Front ID"
            image={frontPhoto}
            type="front"
            qualityData={qualityResults?.front}
            status={
              qualityResults?.front?.valid
                ? 'valid'
                : qualityResults?.front
                ? 'invalid'
                : 'unchecked'
            }
          />

          <PreviewCard
            title="Back ID"
            image={backPhoto}
            type="back"
            qualityData={qualityResults?.back}
            status={
              qualityResults?.back?.valid
                ? 'valid'
                : qualityResults?.back
                ? 'invalid'
                : 'unchecked'
            }
          />

          <PreviewCard
            title="Selfie"
            image={selfiePhoto}
            type="selfie"
            qualityData={qualityResults?.selfie}
            status={
              qualityResults?.selfie?.valid
                ? 'valid'
                : qualityResults?.selfie
                ? 'invalid'
                : 'unchecked'
            }
          />
        </View>

        {/* CHECK QUALITY */}
        <TouchableOpacity
          onPress={onCheckQuality}
          disabled={checkingQuality}
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 14,
            backgroundColor: '#FF9800',
            opacity: checkingQuality ? 0.6 : 1,
          }}
        >
          {checkingQuality ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center' }}>
              Check Image Quality
            </Text>
          )}
        </TouchableOpacity>

        {/* SUBMIT */}
        <TouchableOpacity
          onPress={onSubmit}
          disabled={!canSubmit}
          style={{
            marginTop: 12,
            padding: 16,
            borderRadius: 14,
            backgroundColor: colors.primary,
            opacity: canSubmit ? 1 : 0.4,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center' }}>
            Submit Verification
          </Text>
        </TouchableOpacity>

        {/* BLOCK MESSAGE */}
        {!canSubmit && (
          <Text
            style={{
              marginTop: 10,
              textAlign: 'center',
              color: '#FF5252',
              fontWeight: '600',
            }}
          >
            Complete quality check before submitting.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

// -------------------------
// STYLES (SELF-CONTAINED)
// -------------------------
const styles = {
  card: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  title: { fontSize: 16, fontWeight: '700' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  imageWrap: { borderRadius: 14, overflow: 'hidden' },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },
  qualityBox: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 99, marginRight: 8 },
  rowText: { fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btnSecondary: {
    flex: 1,
    padding: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimary: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorBox: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(255,0,0,0.1)',
    borderRadius: 8,
  },
  errorText: {
    color: '#FF5252',
    fontWeight: '600',
  },
};