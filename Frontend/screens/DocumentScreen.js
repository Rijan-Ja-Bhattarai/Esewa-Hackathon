import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';

import {
  CameraView,
  useCameraPermissions,
} from 'expo-camera';

import * as ImagePicker from 'expo-image-picker';
import ProgressHeader from '../component/ProgressHeader';


// DEVICE DIMENSIONS
const { width, height } = Dimensions.get('window');
const FACE_OVAL_WIDTH = width * 0.65;
const FACE_OVAL_HEIGHT = width * 0.85;
const DOC_FRAME_WIDTH = width * 0.85;
const DOC_FRAME_HEIGHT = height * 0.35;


// THEME (dark)
const useTheme = () => ({
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    secondaryText: '#BBBBBB',
    border: '#333333',
    primary: '#43A047',
    overlay: 'rgba(0,0,0,0.45)',
  },
});


// CAMERA CAPTURE COMPONENT (reusable)
function CameraCapture({ facing, overlayType, onCapture, colors }) {
  const cameraRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Reset readiness when camera (facing) changes
  useEffect(() => {
    setIsReady(false);
  }, [facing]);

  const handleCapture = async () => {
    if (!cameraRef.current || !isReady) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        exif: false,
        skipProcessing: true,
      });

      onCapture(photo);
    } catch (err) {
      console.log(err);
      Alert.alert('Capture Failed', 'Could not capture image.');
    }
  };

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={() => setIsReady(true)}
      />

      {/* Overlay frame */}

      <View style={styles.overlayContainer} pointerEvents="none">
        <View style={styles.overlayTop} />

        <View style={styles.overlayCenter}>
          <View style={styles.overlaySide} />

          <View
            style={
              overlayType === 'document'
                ? styles.documentFrame
                : styles.faceOval
            }
          />

          <View style={styles.overlaySide} />
        </View>

        <View style={styles.overlayBottom} />
      </View>

      {/* Capture button */}
      <View style={styles.captureButtonContainer}>
        <TouchableOpacity
          disabled={!isReady}
          onPress={handleCapture}
          style={[
            styles.captureButton,
            { backgroundColor: isReady ? colors.primary : '#666666' },
          ]}
        >
          <Text style={styles.captureButtonText}>
            {overlayType === 'document' ? 'Capture' : 'Take Selfie'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


// MAIN DOCUMENT SCREEN

export default function DocumentScreen() {
  const { colors } = useTheme();

  // ----- state -----
  const [step, setStep] = useState('front');
  const [isRetake, setIsRetake] = useState(false);
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [backPhoto, setBackPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // All hooks before any early returns
  useEffect(() => {
    if (step === 'preview') setIsRetake(false);
  }, [step]);

  // ----- permission loading / denied -----
  if (!permission) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      />
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          Camera access is required
        </Text>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={requestPermission}
        >
          <Text style={styles.primaryButtonText}>
            Grant Permission
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ----- document capture handler (camera & gallery) -----
  const handleDocumentCapture = (side, photo) => {
    if (side === 'front') {
      setFrontPhoto(photo);
      setStep(isRetake ? 'preview' : 'back');
    } else {
      setBackPhoto(photo);

      if (isRetake) {
        setStep('preview');
      } else {
        setStep('loading');
        setTimeout(() => setStep('selfie'), 300);
      }
    }
  };

  // ----- selfie capture handler -----
  const handleSelfieCapture = (photo) => {
    setSelfiePhoto(photo);
    setStep('preview');
  };

  // ----- gallery picker (with permission) -----
  const pickFromGallery = async (side) => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Allow photo library access in Settings to continue.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        handleDocumentCapture(side, result.assets[0]);
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Gallery Error', 'Could not open gallery.');
    }
  };

  // ----- backend upload helper -----
  const uploadKycDocuments = async () => {
    const formData = new FormData();

    formData.append('front_photo', {
      uri: frontPhoto?.uri,
      type: 'image/jpeg',
      name: 'front.jpg',
    });

    formData.append('back_photo', {
      uri: backPhoto?.uri,
      type: 'image/jpeg',
      name: 'back.jpg',
    });

    formData.append('selfie_photo', {
      uri: selfiePhoto?.uri,
      type: 'image/jpeg',
      name: 'selfie.jpg',
    });

    // REPLACE WITH ACTUAL BACKEND URL
    const API_URL = 'BACKEND_URL_HERE';

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response;
  };

  // ----- submit with status-code alerts -----
  const submitDocuments = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStep('submitting');

    try {
      const response = await uploadKycDocuments();

      switch (response.status) {
        case 200:
        case 201:
          Alert.alert(
            'Verification Submitted',
            'Your documents have been received and are under review.',
            [{ text: 'OK', onPress: () => setStep('done') }]
          );
          break;

        case 400:
          Alert.alert(
            'Invalid Request',
            'The submitted data is malformed. Please try again.',
            [{ text: 'OK', onPress: () => setStep('preview') }]
          );
          break;

        case 401:
        case 403:
          Alert.alert(
            'Authentication Required',
            'Your session has expired. Please log in again.',
            [{ text: 'OK', onPress: () => { } }]
          );
          break;

        case 422:
          Alert.alert(
            'Document Validation Failed',
            'One or more photos did not pass validation. Please retake the documents and ensure they are clear and well-lit.',
            [{ text: 'Retake', onPress: () => setStep('preview') }]
          );
          break;

        case 500:
        case 502:
        case 503:
          Alert.alert(
            'Server Error',
            'We are experiencing technical difficulties. Please try again later.',
            [{ text: 'OK', onPress: () => setStep('preview') }]
          );
          break;

        default:
          Alert.alert(
            'Unexpected Response',
            `Server returned status ${response.status}. Please try again.`,
            [{ text: 'OK', onPress: () => setStep('preview') }]
          );
      }
    } catch (error) {
      Alert.alert(
        'Connection Error',
        'Could not reach the server. Check your internet connection and try again.',
        [{ text: 'OK', onPress: () => setStep('preview') }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----- UI helpers -----
  const OptionScreen = ({ side }) => {
    const label = side === 'front' ? 'Front' : 'Back';

    return (
      <View
        style={[
          styles.optionContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Citizenship {label}
        </Text>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={() =>
            setStep(
              side === 'front'
                ? 'frontCamera'
                : 'backCamera'
            )
          }
        >
          <Text style={styles.primaryButtonText}>
            Take Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.secondaryButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={() => pickFromGallery(side)}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              { color: colors.text },
            ]}
          >
            Upload From Gallery
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const PreviewScreen = () => {
    const PreviewCard = ({
      title,
      image,
      onRetake,
    }) => (
      <View
        style={[
          styles.previewCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.previewTitle,
            { color: colors.secondaryText },
          ]}
        >
          {title}
        </Text>

        <Image
          source={{ uri: image?.uri }}
          style={styles.previewImage}
        />

        <TouchableOpacity onPress={onRetake}>
          <Text
            style={{
              color: colors.primary,
              marginTop: 10,
              fontWeight: '600',
            }}
          >
            Retake
          </Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <ScrollView
        contentContainerStyle={[
          styles.previewContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          Review Documents
        </Text>

        <PreviewCard
          title="Citizenship Front"
          image={frontPhoto}
          onRetake={() => {
            setIsRetake(true);
            setStep('front');
          }}
        />

        <PreviewCard
          title="Citizenship Back"
          image={backPhoto}
          onRetake={() => {
            setIsRetake(true);
            setStep('back');
          }}
        />

        <PreviewCard
          title="Selfie"
          image={selfiePhoto}
          onRetake={() => {
            setIsRetake(true);
            setStep('selfie');
          }}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={submitDocuments}
        >
          <Text style={styles.submitButtonText}>
            Submit Verification
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ----- main render -----
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <ProgressHeader
        currentStep={step}
        isRetake={isRetake}
        colors={colors}
      />

      {step === 'front' && (
        <OptionScreen side="front" />
      )}

      {step === 'back' && (
        <OptionScreen side="back" />
      )}

      {step === 'frontCamera' && (
        <CameraCapture
          facing="back"
          overlayType="document"
          onCapture={(photo) =>
            handleDocumentCapture('front', photo)
          }
          colors={colors}
        />
      )}

      {step === 'backCamera' && (
        <CameraCapture
          facing="back"
          overlayType="document"
          onCapture={(photo) =>
            handleDocumentCapture('back', photo)
          }
          colors={colors}
        />
      )}

      {step === 'loading' && (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />
        </View>
      )}

      {step === 'selfie' && (
        <CameraCapture
          facing="front"
          overlayType="face"
          onCapture={handleSelfieCapture}
          colors={colors}
        />
      )}

      {step === 'preview' && <PreviewScreen />}

      {step === 'submitting' && (
        <View style={styles.centerContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text
            style={{
              color: colors.text,
              marginTop: 20,
            }}
          >
            Submitting documents...
          </Text>
        </View>
      )}

      {step === 'done' && (
        <View style={styles.centerContainer}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.primary,
            }}
          >
            Verification Complete
          </Text>

          <Text
            style={{
              color: colors.secondaryText,
              marginTop: 12,
            }}
          >
            Your documents have been submitted.
          </Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  optionContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 40,
  },

  primaryButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  secondaryButton: {
    marginTop: 16,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },

  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },

  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },

  camera: {
    flex: 1,
  },

  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },

  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  overlayCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  overlaySide: {
    flex: 1,
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  documentFrame: {
    width: DOC_FRAME_WIDTH,
    height: DOC_FRAME_HEIGHT,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 18,
    borderColor: '#00FF88',
    shadowColor: '#00FF88',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  faceOval: {
    width: FACE_OVAL_WIDTH,
    height: FACE_OVAL_HEIGHT,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: FACE_OVAL_WIDTH / 2,
  },

  captureButtonContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },

  captureButton: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 999,
  },

  captureButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  // Preview
  previewContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  previewCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },

  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#DDDDDD',
  },

  submitButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});