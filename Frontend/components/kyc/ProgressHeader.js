import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // <- add this

const STEPS = [
  { key: 'front', label: 'Front ID' },
  { key: 'back', label: 'Back ID' },
  { key: 'selfie', label: 'Selfie' },
  { key: 'preview', label: 'Review' },
  { key: 'submitting', label: 'Submit' },
];

const normalizeStep = (step) => {
  switch (step) {
    case 'front':
    case 'frontCamera':
      return 'front';
    case 'back':
    case 'backCamera':
      return 'back';
    case 'selfie':
      return 'selfie';
    case 'preview':
      return 'preview';
    case 'submitting':
    case 'done':
      return 'submitting';
    default:
      return 'front';
  }
};

export default function ProgressHeader({ currentStep, isRetake = false, colors }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets(); // <- get safe area insets
  const isSmall = width < 480;

  const activeKey = useMemo(() => normalizeStep(currentStep), [currentStep]);
  const activeIndex = useMemo(
    () => STEPS.findIndex((s) => s.key === activeKey),
    [activeKey]
  );

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: activeIndex / (STEPS.length - 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [activeIndex]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingTop: insets.top + 12, // <- add status bar height + small margin
        },
      ]}
    >
      {/* RETAKE NOTICE */}
      {isRetake && (
        <View style={[styles.notice, { borderColor: colors.primary }]}>
          <Text style={[styles.noticeText, { color: colors.primary }]}>
            This photo will replace the current one
          </Text>
        </View>
      )}

      {/* TRACK */}
      <View style={styles.track}>
        {STEPS.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <React.Fragment key={step.key}>
              <View style={styles.step}>
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor:
                        isCompleted || isActive ? colors.primary : 'transparent',
                      borderColor: isCompleted || isActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {isCompleted ? (
                    <Text style={styles.check}>✓</Text>
                  ) : (
                    <Text style={[styles.number, { color: isActive ? '#fff' : colors.secondaryText }]}>
                      {index + 1}
                    </Text>
                  )}
                </View>
                {!isSmall && (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.label,
                      {
                        color: isActive ? colors.primary : isCompleted ? colors.text : colors.secondaryText,
                        fontWeight: isActive ? '700' : '500',
                      },
                    ]}
                  >
                    {step.label}
                  </Text>
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: index < activeIndex ? colors.primary : colors.border },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* BOTTOM PROGRESS */}
      <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
        <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  step: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  connector: {
    flex: 1,
    height: 3,
    marginTop: 13,
    marginHorizontal: 8,
    borderRadius: 2,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  check: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  number: {
    fontSize: 13,
    fontWeight: '700',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 72,
  },
  progressBg: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 999,
  },
  notice: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 14,
    alignSelf: 'center',
    maxWidth: 420,
  },
  noticeText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
});