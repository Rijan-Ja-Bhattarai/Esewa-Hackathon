import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function LoadingScreen({ colors, text }) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
      }}
    >
      <ActivityIndicator
        size="large"
        color={colors.primary}
      />

      <Text
        style={{
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          marginTop: 24,
        }}
      >
        Verifying Documents...
      </Text>

      <Text
        style={{
          color: colors.secondaryText,
          marginTop: 12,
          textAlign: 'center',
          lineHeight: 22,
        }}
      >
        {text || 'Usually takes less than 10 seconds'}
      </Text>
    </View>
  );
}