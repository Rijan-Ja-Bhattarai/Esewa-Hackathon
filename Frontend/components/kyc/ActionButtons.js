import React from 'react';

import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';

export default function ActionButtons({
  isReady,
  onCapture,
  onCancel,
  colors,
  overlayType,
}) {
  const { width } =
    useWindowDimensions();

  const isSmall = width < 420;

  const isTablet = width > 900;

  const buttonHeight = isSmall
    ? 52
    : 58;

  const primaryHorizontal =
    isTablet ? 40 : 32;

  const cancelHorizontal =
    isTablet ? 30 : 24;

  return (
    <View
      style={[
        styles.container,

        {
          bottom: isSmall
            ? 28
            : 40,

          flexDirection:
            isSmall
              ? 'column'
              : 'row',

          width: isSmall
            ? '90%'
            : 'auto',
        },
      ]}
    >
      {/* CANCEL */}
      <Pressable
        onPress={onCancel}
        style={({ pressed }) => [
          styles.cancelButton,

          {
            height: buttonHeight,

            paddingHorizontal:
              cancelHorizontal,

            marginRight:
              isSmall ? 0 : 16,

            marginBottom:
              isSmall ? 14 : 0,

            transform: [
              {
                scale: pressed
                  ? 0.97
                  : 1,
              },
            ],
          },
        ]}
      >
        <Text
          style={styles.cancelText}
        >
          Cancel
        </Text>
      </Pressable>

      {/* PRIMARY */}
      <Pressable
        disabled={!isReady}
        onPress={onCapture}
        style={({ pressed }) => [
          styles.captureButton,

          {
            backgroundColor:
              isReady
                ? colors.primary
                : '#666',

            height: buttonHeight,

            paddingHorizontal:
              primaryHorizontal,

            width: isSmall
              ? '100%'
              : 'auto',

            transform: [
              {
                scale: pressed
                  ? 0.97
                  : 1,
              },
            ],

            shadowColor:
              colors.primary,
          },
        ]}
      >
        <Text
          style={[
            styles.captureText,

            {
              fontSize: isSmall
                ? 16
                : 17,
            },
          ]}
        >
          {overlayType ===
          'document'
            ? 'Capture'
            : 'Take Selfie'}
        </Text>
      </Pressable>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // =====================================================

  cancelButton: {
    backgroundColor:
      'rgba(255,255,255,0.14)',

    borderRadius: 999,

    justifyContent: 'center',
    alignItems: 'center',

    minWidth: 110,

    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.08)',
  },

  cancelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  // =====================================================

  captureButton: {
    borderRadius: 999,

    justifyContent: 'center',
    alignItems: 'center',

    minWidth: 180,

    shadowOpacity: 0.45,
    shadowRadius: 14,

    elevation: 10,
  },

  captureText: {
    color: '#fff',
    fontWeight: '700',
  },
});