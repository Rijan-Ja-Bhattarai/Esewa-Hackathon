import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';

export default function PreviewScreen({
  colors,
  frontPhoto,
  backPhoto,
  selfiePhoto,
  onRetake,
  onSubmit,
  onViewImage,
}) {
  const { width } = useWindowDimensions();

  // =====================================================
  // BREAKPOINTS
  // =====================================================

  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 1100;
  const isDesktop = width >= 1100;

  const isWeb = Platform.OS === 'web';

  const cardWidth = isDesktop
    ? '32%'
    : isTablet
    ? '48%'
    : '100%';

  const titleSize = isPhone ? 28 : 34;

  const subtitleSize = isPhone ? 15 : 16;

  // =====================================================
  // QUALITY ROW
  // =====================================================

  const QualityRow = ({ label, passed }) => (
    <View style={styles.qualityRow}>
      <View
        style={[
          styles.dot,
          {
            backgroundColor: passed
              ? '#4CAF50'
              : '#FF9800',
          },
        ]}
      />
      <Text
        style={[
          styles.qualityText,
          { color: colors.secondaryText },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  // =====================================================
  // CARD (updated to accept onViewImage)
  // =====================================================

  const PreviewCard = ({
    title,
    image,
    type,
    status = 'valid',
    onViewImage,   // <-- added
  }) => {
    const isSelfie = type === 'selfie';

    const imageHeight = isPhone
      ? isSelfie
        ? 240
        : 180
      : isTablet
      ? isSelfie
        ? 300
        : 220
      : isSelfie
      ? 360
      : 250;

    return (
      <View
        style={[
          styles.card,
          {
            width: cardWidth,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {/* HEADER */}
        <View style={styles.cardHeader}>
          <Text
            style={[
              styles.cardTitle,
              { color: colors.text },
            ]}
          >
            {title}
          </Text>

          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  status === 'valid'
                    ? 'rgba(76,175,80,0.12)'
                    : 'rgba(255,152,0,0.12)',
              },
            ]}
          >
            <Text
              style={{
                color:
                  status === 'valid'
                    ? '#4CAF50'
                    : '#FF9800',
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              {status === 'valid'
                ? 'Verified'
                : 'Review'}
            </Text>
          </View>
        </View>

        {/* IMAGE */}
        <View style={styles.imageWrapper}>
          {image?.uri ? (
            <Image
              source={{ uri: image.uri }}
              style={{
                width: '100%',
                height: imageHeight,
              }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                {
                  height: imageHeight,
                },
              ]}
            >
              <Text style={styles.placeholderText}>
                No image available
              </Text>
            </View>
          )}
        </View>

        {/* QUALITY */}
        <View style={styles.qualityContainer}>
          <QualityRow
            label="Sharp image"
            passed
          />
          <QualityRow
            label="Good lighting"
            passed
          />
          <QualityRow
            label={
              isSelfie
                ? 'Face clearly visible'
                : 'All corners detected'
            }
            passed
          />
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() =>
              onRetake(type)
            }
            style={[
              styles.secondaryBtn,
              {
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: '700',
              }}
            >
              Retake
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor:
                  colors.primary,
              },
            ]}
            onPress={() => onViewImage(image, type)}   // <-- added onPress
          >
            <Text
              style={styles.primaryText}
            >
              View
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor:
          colors.background,
      }}
      contentContainerStyle={{
        paddingHorizontal: isPhone
          ? 16
          : 24,
        paddingTop: 24,
        paddingBottom: 60,
        alignItems: 'center',
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* CONTAINER */}
      <View
        style={{
          width: '100%',
          maxWidth: 1400,
        }}
      >
        {/* HEADER */}
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: titleSize,
              fontWeight: '800',
              marginBottom: 10,
            }}
          >
            Review Verification
          </Text>

          <Text
            style={{
              color:
                colors.secondaryText,
              fontSize: subtitleSize,
              lineHeight: 24,
              maxWidth: 700,
            }}
          >
            Confirm that your documents and
            selfie are clear before
            submitting.
          </Text>
        </View>

        {/* CARDS GRID */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent:
              isPhone
                ? 'center'
                : 'space-between',
            gap: 16,
          }}
        >
          <PreviewCard
            title="Front ID"
            image={frontPhoto}
            type="front"
            onViewImage={onViewImage}
          />

          <PreviewCard
            title="Back ID"
            image={backPhoto}
            type="back"
            onViewImage={onViewImage}
          />

          <PreviewCard
            title="Selfie"
            image={selfiePhoto}
            type="selfie"
            onViewImage={onViewImage}
          />
        </View>

        {/* SUBMIT */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            {
              backgroundColor:
                colors.primary,
            },
          ]}
          onPress={onSubmit}
        >
          <Text
            style={styles.submitText}
          >
            Submit Verification
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  card: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  imageWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },

  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#222',
  },

  placeholderText: {
    color: '#888',
  },

  qualityContainer: {
    marginTop: 14,
    gap: 8,
  },

  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    marginRight: 10,
  },

  qualityText: {
    fontSize: 14,
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },

  secondaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },

  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },

  submitBtn: {
    marginTop: 22,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },

  submitText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },
};