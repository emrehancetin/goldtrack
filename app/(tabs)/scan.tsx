import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { colors } from '../../src/constants/theme';
import { analyzeGoldBar } from '../../src/services/geminiVision';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [analyzing, setAnalyzing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const handleCapture = async () => {
    if (!cameraRef.current || analyzing) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo) return;

      setAnalyzing(true);
      const result = await analyzeGoldBar(photo.uri);
      setAnalyzing(false);

      if (!result) {
        Alert.alert(
          'Hata',
          'Fotoğraf analiz edilemedi. Lütfen tekrar deneyin veya bilgileri manuel girin.',
          [
            { text: 'Tekrar Dene', style: 'cancel' },
            {
              text: 'Manuel Gir',
              onPress: () =>
                router.push({
                  pathname: '/confirm',
                  params: { imageUri: photo.uri },
                }),
            },
          ]
        );
        return;
      }

      router.push({
        pathname: '/confirm',
        params: {
          ocrResult: JSON.stringify(result),
          imageUri: photo.uri,
        },
      });
    } catch {
      setAnalyzing(false);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Fotoğraf çekebilmek için kamera izni gerekiyor.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />

      {analyzing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.overlayText}>Analiz ediliyor...</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.captureButton, analyzing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={analyzing}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => router.push({ pathname: '/confirm', params: {} })}
          disabled={analyzing}
        >
          <Text style={styles.manualButtonText}>Manuel Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gold,
  },
  manualButton: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  manualButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionText: {
    color: colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: colors.gold,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
});
