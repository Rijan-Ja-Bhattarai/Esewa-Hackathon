import React from 'react';
import { View, Text } from 'react-native';

export default function SuccessScreen({ colors }) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
      }}
    >
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: 999,
          backgroundColor: 'rgba(67,160,71,0.15)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            color: colors.primary,
            fontSize: 60,
            fontWeight: '700',
          }}
        >
          ✓
        </Text>
      </View>

      <Text
        style={{
          color: colors.text,
          fontSize: 30,
          fontWeight: '700',
          marginTop: 30,
        }}
      >
        Verification Submitted
      </Text>

      <Text
        style={{
          color: colors.secondaryText,
          marginTop: 14,
          textAlign: 'center',
          lineHeight: 24,
          fontSize: 16,
        }}
      >
        Your documents are now under review.
      </Text>
    </View>
  );
}