import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const STEPS = [
  { key: 'front', label: 'Front ID' },
  { key: 'back', label: 'Back ID' },
  { key: 'selfie', label: 'Selfie' },
  { key: 'preview', label: 'Review' },
  { key: 'submitting', label: 'Submit' },
];

// Normalize screen step = progress step
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

export default function ProgressHeader({
  currentStep,
  isRetake = false,
  colors,
}) {
  const activeKey = useMemo(
    () => normalizeStep(currentStep),
    [currentStep]
  );

  const activeIndex = useMemo(
    () => STEPS.findIndex((s) => s.key === activeKey),
    [activeKey]
  );

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const progress =
      activeIndex <= 0
        ? 0
        : activeIndex / (STEPS.length - 1);

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [activeIndex]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width],
  });

  const showRetakeNotice =
    isRetake ||
    currentStep === 'frontCamera' ||
    currentStep === 'backCamera' ||
    currentStep === 'selfie';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      
      {/* RETAKE NOTICE */}
      {showRetakeNotice && (
        <View style={[styles.notice, { borderColor: colors.primary }]}>
          <Text style={[styles.noticeText, { color: colors.primary }]}>
            Retake — this photo will replace the previous one
          </Text>
        </View>
      )}

      {/* STEPS */}
      <View style={styles.track}>
        {STEPS.map((step, index) => {
          const isCompleted = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <View key={step.key} style={styles.step}>
              
              {index !== 0 && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor:
                        isCompleted || isActive
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                />
              )}

              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor:
                      isCompleted || isActive
                        ? colors.primary
                        : 'transparent',
                    borderColor:
                      isCompleted || isActive
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                {isCompleted ? (
                  <Text style={styles.check}>✓</Text>
                ) : (
                  <Text
                    style={[
                      styles.number,
                      {
                        color: isActive
                          ? '#fff'
                          : colors.secondaryText,
                      },
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>

              <Text
                style={[
                  styles.label,
                  {
                    color: isActive
                      ? colors.primary
                      : isCompleted
                      ? colors.text
                      : colors.secondaryText,
                    fontWeight: isActive ? '700' : '400',
                  },
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* PROGRESS BAR */}
      <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },

  track: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  step: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },

  line: {
    position: 'absolute',
    top: 12,
    left: -20,
    right: 20,
    height: 3,
  },

  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },

  check: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  number: {
    fontSize: 12,
    fontWeight: '600',
  },

  label: {
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 70,
  },

  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressFill: {
    height: 4,
    borderRadius: 2,
  },

  notice: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
  },

  noticeText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
});