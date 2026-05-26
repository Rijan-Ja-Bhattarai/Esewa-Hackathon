import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
} from 'react-native';

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import ProgressHeader from '../components/kyc/ProgressHeader';
import PreviewScreen from '../components/kyc/PreviewScreen';
import LoadingScreen from '../components/kyc/LoadingScreen';
import SuccessScreen from '../components/kyc/SuccessScreen';
import ActionButtons from '../components/kyc/ActionButtons';
import OverlayFrame from '../components/kyc/OverlayFrame';

import { colors as themeColors } from '../theme/colors';
import styles from '../styles/kycStyles';

// ------------------------------------------------------------
// Helper: Convert image URI to Blob/File
// ------------------------------------------------------------
const uriToBlob = async (uri) => {
  if (Platform.OS === 'web' && uri.startsWith('data:')) {
    const res = await fetch(uri);
    return await res.blob();
  } else {
    const response = await fetch(uri);
    return await response.blob();
  }
};

// ------------------------------------------------------------
// Capture Options
// ------------------------------------------------------------
function CaptureOptions({ side, onCamera, onGallery, colors }) {
  return (
    <View style={styles.centerContainer}>
      <Text style={[styles.title, { color: colors.text }]}>
        {side === 'front' ? 'Capture Front of ID' : 'Capture Back of ID'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.text }]}>
        Make sure the document is fully visible
      </Text>
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: colors.primary, width: '100%' }]}
        onPress={onCamera}
      >
        <Text style={styles.primaryButtonText}>Take Photo</Text>
      </TouchableOpacity>
      <View style={{ height: 16 }} />
      <TouchableOpacity
        style={[styles.primaryButton, styles.glassButton, { width: '100%' }]}
        onPress={onGallery}
      >
        <Text style={[styles.primaryButtonText, { color: colors.text }]}>
          Choose From Gallery
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ------------------------------------------------------------
// Camera Wrapper
// ------------------------------------------------------------
function CameraCapture({ cameraKey, facing, overlayType, onCapture, onCancel, colors }) {
  if (Platform.OS === 'web') {
    return (
      <WebCamera
        key={cameraKey}
        facing={facing}
        overlayType={overlayType}
        onCapture={onCapture}
        onCancel={onCancel}
        colors={colors}
      />
    );
  }
  return (
    <NativeCamera
      key={cameraKey}
      facing={facing}
      overlayType={overlayType}
      onCapture={onCapture}
      onCancel={onCancel}
      colors={colors}
    />
  );
}

// ------------------------------------------------------------
// Native Camera (with skipProcessing)
// ------------------------------------------------------------
function NativeCamera({ facing, overlayType, onCapture, onCancel, colors }) {
  const cameraRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isReady && !cameraError) {
      timeoutRef.current = setTimeout(() => {
        console.warn('Camera initialization timeout');
        setCameraError(true);
      }, 6000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isReady, cameraError]);

  const handleCameraError = (error) => {
    console.error('Camera error:', error);
    setCameraError(true);
  };

  const handleCapture = async () => {
    if (!cameraRef.current || !isReady || isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      onCapture(photo);
    } catch (err) {
      Alert.alert('Capture Failed', 'Could not capture image.');
    } finally {
      setIsCapturing(false);
    }
  };

  if (cameraError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: colors.error || '#f44336', textAlign: 'center', marginBottom: 20 }}>
          Failed to start {facing === 'front' ? 'front' : 'back'} camera.
          {'\n'}Please check permissions and try again.
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={onCancel}
        >
          <Text style={styles.primaryButtonText}>Go Back & Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <View style={StyleSheet.absoluteFill}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          active={true}
          onCameraReady={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setIsReady(true);
          }}
          onError={handleCameraError}
        />
      </View>
      {!isReady && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Starting camera...
          </Text>
        </View>
      )}
      {isReady && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <OverlayFrame overlayType={overlayType} />
        </View>
      )}
      <View style={styles.uiLayer}>
        <ActionButtons
          isReady={isReady}
          onCapture={handleCapture}
          onCancel={onCancel}
          colors={colors}
          overlayType={overlayType}
        />
      </View>
    </View>
  );
}

// ------------------------------------------------------------
// Web Camera
// ------------------------------------------------------------
function WebCamera({ facing, overlayType, onCapture, onCancel, colors }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let stream = null;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing === 'front' ? 'user' : 'environment' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = async () => {
            await videoRef.current.play();
            setIsReady(true);
          };
        }
      } catch (e) {
        Alert.alert('Camera Error', 'Web camera not available');
      }
    };
    start();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setIsReady(false);
    };
  }, [facing]);

  const handleCapture = () => {
    if (!isReady || isCapturing) return;
    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setIsCapturing(false);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    onCapture({ uri: dataUrl });
    setIsCapturing(false);
  };

  return (
    <View style={styles.cameraContainer}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div style={{ position: 'absolute', inset: 0 }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      {!isReady && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Starting camera...
          </Text>
        </View>
      )}
      {isReady && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <OverlayFrame overlayType={overlayType} />
        </View>
      )}
      <View style={styles.uiLayer}>
        <ActionButtons
          isReady={isReady}
          onCapture={handleCapture}
          onCancel={onCancel}
          colors={colors}
          overlayType={overlayType}
        />
      </View>
    </View>
  );
}

// ------------------------------------------------------------
// MAIN SCREEN
// ------------------------------------------------------------
export default function DocumentScreen() {
  const colors = themeColors;

  const [step, setStep] = useState('front');
  const [isRetake, setIsRetake] = useState(false);
  const [cameraKey, setCameraKey] = useState(0);

  const [frontPhoto, setFrontPhoto] = useState(null);
  const [backPhoto, setBackPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);

  const [submitStatus, setSubmitStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // New state for image preview modal
  const [viewingImage, setViewingImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (step === 'preview') {
      setIsRetake(false);
    }
  }, [step]);

  // ------------------------------------------------------------
  // Gallery Picker
  // ------------------------------------------------------------
  const pickFromGallery = async (side) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (result.canceled) return;
      const photo = result.assets[0];
      handleDocumentCapture(side, photo);
    } catch (e) {
      Alert.alert('Error', 'Could not open gallery');
    }
  };

  // ------------------------------------------------------------
  // Permissions
  // ------------------------------------------------------------
  if (Platform.OS !== 'web') {
    if (!permission) return <View style={styles.container} />;
    if (!permission.granted) {
      return (
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 20 }}>
            Camera permission is required to take photos.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary, width: '80%' }]}
            onPress={requestPermission}
          >
            <Text style={styles.primaryButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
        </View>
      );
    }
  }

  // ------------------------------------------------------------
  // Flow Handlers
  // ------------------------------------------------------------
  const handleDocumentCapture = (side, photo) => {
    if (side === 'front') {
      setFrontPhoto(photo);
      setStep(isRetake ? 'preview' : 'back');
    } else {
      setBackPhoto(photo);
      setStep(isRetake ? 'preview' : 'selfie');
    }
  };

  const handleSelfieCapture = (photo) => {
    setSelfiePhoto(photo);
    setStep('preview');
  };

  // ------------------------------------------------------------
  // Submission
  // ------------------------------------------------------------
  const submitVerification = async () => {
    if (!frontPhoto || !backPhoto || !selfiePhoto) {
      Alert.alert('Missing images', 'Please capture all required images first.');
      return;
    }

    setSubmitStatus('loading');
    setErrorMessage('');

    const formData = new FormData();

    try {
      const frontBlob = await uriToBlob(frontPhoto.uri);
      const backBlob = await uriToBlob(backPhoto.uri);
      const selfieBlob = await uriToBlob(selfiePhoto.uri);

      formData.append('frontId', frontBlob, 'front.jpg');
      formData.append('backId', backBlob, 'back.jpg');
      formData.append('selfie', selfieBlob, 'selfie.jpg');

      const response = await fetch('https://your-api.com/verify', {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = await response.json();

      switch (response.status) {
        case 200:
          setSubmitStatus('success');
          break;
        case 400:
          setSubmitStatus('error');
          setErrorMessage(data.message || 'Invalid request. Please check your images.');
          break;
        case 401:
          setSubmitStatus('error');
          setErrorMessage('Authentication failed. Please log in again.');
          break;
        case 422:
          setSubmitStatus('error');
          setErrorMessage(data.details || 'Image quality issues. Please retake photos with better lighting.');
          break;
        case 500:
          setSubmitStatus('error');
          setErrorMessage('Server error. Please try again later.');
          break;
        default:
          setSubmitStatus('error');
          setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } catch (error) {
      console.error(error);
      setSubmitStatus('error');
      setErrorMessage('Network error. Check your internet connection and try again.');
    }
  };

  const resetToPreview = () => {
    setSubmitStatus('idle');
    setErrorMessage('');
    setStep('preview');
  };

  const goToCameraStep = (newStep) => {
    setCameraKey(prev => prev + 1);
    setStep(newStep);
  };

  // ------------------------------------------------------------
  // Helper for cancel button during retake
  // ------------------------------------------------------------
  const handleCameraCancel = (previousStep) => {
    if (isRetake) {
      setStep('preview');   // return to preview when retaking
    } else {
      setStep(previousStep); // e.g., 'front' or 'back'
    }
  };

  // ------------------------------------------------------------
  // Render image modal
  // ------------------------------------------------------------
  const renderImageModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }}
          onPress={() => setModalVisible(false)}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>✕</Text>
        </TouchableOpacity>
        {viewingImage && (
          <Image
            source={{ uri: viewingImage.uri }}
            style={{ flex: 1, resizeMode: 'contain' }}
          />
        )}
      </View>
    </Modal>
  );

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {submitStatus === 'idle' && (
        <ProgressHeader currentStep={step} isRetake={isRetake} colors={colors} />
      )}

      {submitStatus === 'idle' && (
        <>
          {step === 'front' && (
            <CaptureOptions
              side="front"
              colors={colors}
              onCamera={() => goToCameraStep('frontCamera')}
              onGallery={() => pickFromGallery('front')}
            />
          )}

          {step === 'back' && (
            <CaptureOptions
              side="back"
              colors={colors}
              onCamera={() => goToCameraStep('backCamera')}
              onGallery={() => pickFromGallery('back')}
            />
          )}

          {step === 'frontCamera' && (
            <CameraCapture
              cameraKey={cameraKey}
              facing="back"
              overlayType="document"
              onCapture={(photo) => handleDocumentCapture('front', photo)}
              onCancel={() => handleCameraCancel('front')}
              colors={colors}
            />
          )}

          {step === 'backCamera' && (
            <CameraCapture
              cameraKey={cameraKey}
              facing="back"
              overlayType="document"
              onCapture={(photo) => handleDocumentCapture('back', photo)}
              onCancel={() => handleCameraCancel('back')}
              colors={colors}
            />
          )}

          {step === 'selfie' && (
            <CameraCapture
              cameraKey={cameraKey}
              facing="front"
              overlayType="selfie"
              onCapture={handleSelfieCapture}
              onCancel={() => handleCameraCancel('back')}
              colors={colors}
            />
          )}

          {step === 'preview' && (
            <PreviewScreen
              colors={colors}
              frontPhoto={frontPhoto}
              backPhoto={backPhoto}
              selfiePhoto={selfiePhoto}
              onRetake={(type) => {
                setIsRetake(true);
                if (type === 'front') goToCameraStep('frontCamera');
                else if (type === 'back') goToCameraStep('backCamera');
                else if (type === 'selfie') goToCameraStep('selfie');
              }}
              onSubmit={submitVerification}
              onViewImage={(image, type) => {
                setViewingImage(image);
                setModalVisible(true);
              }}
            />
          )}
        </>
      )}

      {submitStatus === 'loading' && (
        <LoadingScreen colors={colors} text="Uploading and verifying your documents..." />
      )}

      {submitStatus === 'success' && <SuccessScreen colors={colors} />}

      {submitStatus === 'error' && (
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.error || '#f44336', fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
            {errorMessage}
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary, width: '100%' }]}
            onPress={resetToPreview}
          >
            <Text style={styles.primaryButtonText}>Go Back to Preview</Text>
          </TouchableOpacity>
        </View>
      )}

      {renderImageModal()}
    </View>
  );
}