import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';

import Svg, {
  Rect,
  Defs,
  Mask,
  Ellipse,
} from 'react-native-svg';

const {
  width: screenWidth,
  height: screenHeight,
} = Dimensions.get('window');

// =====================================================
// LAYOUT CONSTANTS
// =====================================================

const TOP_UI_HEIGHT = 140;
const BOTTOM_UI_HEIGHT = 240;

const overlayTop = TOP_UI_HEIGHT;

const overlayHeight =
  screenHeight -
  TOP_UI_HEIGHT -
  BOTTOM_UI_HEIGHT;

// =====================================================
// DOCUMENT FRAME (unchanged)
// =====================================================

const DOCUMENT_ASPECT_RATIO = 1.586;

const docWidth = Math.min(
  screenWidth * 0.88,
  420
);

const docHeight =
  docWidth / DOCUMENT_ASPECT_RATIO;

const docX =
  (screenWidth - docWidth) / 2;

const docY =
  overlayTop +
  overlayHeight * 0.24;

// =====================================================
// SELFIE FRAME – LARGER ON PHONES
// =====================================================

// Detect phone (typical screen width < 600)
const isPhone = screenWidth < 600;

// On phones use 85% of screen width (max 400px), otherwise original 68% (max 320px)
const faceWidth = isPhone
  ? Math.min(screenWidth * 0.85, 400)
  : Math.min(screenWidth * 0.68, 320);

const faceHeight = faceWidth * 1.18;

const faceX = (screenWidth - faceWidth) / 2;

// Adjust vertical position: move oval slightly down on phones for better centering
const faceY = isPhone
  ? overlayTop + overlayHeight * -0.01
  : overlayTop + overlayHeight * -0.02;

// =====================================================
// COMPONENT
// =====================================================

export default function OverlayFrame({
  overlayType,
}) {
  const isDocument =
    overlayType === 'document';

  const isSelfie =
    overlayType === 'selfie';

  // =====================================================
  // DOCUMENT OVERLAY
  // =====================================================

  if (isDocument) {
    return (
      <View
        style={styles.container}
        pointerEvents="none"
      >
        <Svg
          width={screenWidth}
          height={screenHeight}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <Mask id="documentMask">
              {/* FULL SCREEN */}
              <Rect
                width={screenWidth}
                height={screenHeight}
                fill="white"
              />

              {/* CUTOUT */}
              <Rect
                x={docX}
                y={docY}
                width={docWidth}
                height={docHeight}
                rx={18}
                fill="black"
              />
            </Mask>
          </Defs>

          {/* DARK OVERLAY */}
          <Rect
            width={screenWidth}
            height={screenHeight}
            fill="rgba(0,0,0,0.72)"
            mask="url(#documentMask)"
          />

          {/* MAIN BORDER */}
          <Rect
            x={docX}
            y={docY}
            width={docWidth}
            height={docHeight}
            rx={18}
            stroke="#FFFFFF"
            strokeWidth={3}
            fill="transparent"
          />

          {/* INNER BORDER */}
          <Rect
            x={docX + 8}
            y={docY + 8}
            width={docWidth - 16}
            height={docHeight - 16}
            rx={14}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={1}
            fill="transparent"
          />
        </Svg>
      </View>
    );
  }

  // =====================================================
  // SELFIE OVERLAY
  // =====================================================

  if (isSelfie) {
    const rx = faceWidth / 2;
    const ry = faceHeight / 2;

    const cx = faceX + rx;
    const cy = faceY + ry;

    return (
      <View
        style={styles.container}
        pointerEvents="none"
      >
        <Svg
          width={screenWidth}
          height={screenHeight}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <Mask id="faceMask">
              {/* FULL SCREEN */}
              <Rect
                width={screenWidth}
                height={screenHeight}
                fill="white"
              />

              {/* OVAL CUTOUT */}
              <Ellipse
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill="black"
              />
            </Mask>
          </Defs>

          {/* DARK OVERLAY */}
          <Rect
            width={screenWidth}
            height={screenHeight}
            fill="rgba(0,0,0,0.72)"
            mask="url(#faceMask)"
          />

          {/* MAIN OVAL */}
          <Ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            stroke="#FFFFFF"
            strokeWidth={3}
            fill="none"
          />

          {/* INNER OVAL */}
          <Ellipse
            cx={cx}
            cy={cy}
            rx={rx - 8}
            ry={ry - 8}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={1}
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  return null;
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});