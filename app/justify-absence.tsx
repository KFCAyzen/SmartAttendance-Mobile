import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { justifyAbsence } from '~/api/absences';
import { humanizeApiError } from '~/api/client';
import { Button } from '~/components/ui/Button';
import { ScreenContainer } from '~/components/ui/ScreenContainer';

interface PickedFile {
  uri: string;
  name: string;
  mime: string;
}

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

export default function JustifyAbsenceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      if (!id) throw new Error('Identifiant manquant');
      if (!file) throw new Error('Document obligatoire');
      if (!reason.trim()) throw new Error('Raison obligatoire');
      return justifyAbsence(id, {
        reason: reason.trim(),
        fileUri: file.uri,
        fileName: file.name,
        fileMime: file.mime,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['absences'] });
      Toast.show({ type: 'success', text1: 'Justification envoyée' });
      router.back();
    },
    onError: (e) => Toast.show({ type: 'error', text1: humanizeApiError(e) }),
  });

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ACCEPTED_MIME,
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    const mime = asset.mimeType ?? guessMime(asset.name);
    if (!ACCEPTED_MIME.includes(mime)) {
      Alert.alert('Format non supporté', 'Seuls les fichiers PDF, JPG et PNG sont acceptés.');
      return;
    }
    if (asset.size && asset.size > 5 * 1024 * 1024) {
      Alert.alert('Fichier trop volumineux', 'Maximum 5 Mo.');
      return;
    }
    setFile({ uri: asset.uri, name: asset.name, mime });
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setFile({
      uri: asset.uri,
      name: asset.fileName ?? `justification-${Date.now()}.jpg`,
      mime: asset.mimeType ?? 'image/jpeg',
    });
  };

  const choose = () => {
    Alert.alert('Justificatif', 'Choisissez une source', [
      { text: 'Document (PDF / image)', onPress: () => void pickDocument() },
      { text: 'Prendre une photo', onPress: () => void pickPhoto() },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <ScreenContainer>
      <Stack.Screen
        options={{ headerShown: true, title: "Justifier l'absence", headerBackTitle: 'Annuler' }}
      />

      <View className="gap-1 mt-2">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Justifier l&apos;absence
        </Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          Joignez un document (PDF, JPG ou PNG, max 5 Mo) et précisez la raison.
        </Text>
      </View>

      <View className="gap-1.5">
        <Text className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Raison
        </Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Ex : arrêt maladie, rendez-vous médical"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={4}
          className="min-h-[100px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-base text-slate-900 dark:text-white"
        />
      </View>

      <View className="gap-2">
        <Text className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Document justificatif
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={choose}
          className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-5 items-center gap-2"
        >
          {file ? (
            <>
              <Ionicons name="document-attach" size={32} color="#1E40AF" />
              <Text className="text-base font-semibold text-slate-900 dark:text-white text-center">
                {file.name}
              </Text>
              <Text className="text-xs text-slate-500 dark:text-slate-400">{file.mime}</Text>
              <Text className="text-sm text-primary-700 dark:text-primary-100 mt-1">
                Toucher pour remplacer
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={32} color="#64748B" />
              <Text className="text-base text-slate-700 dark:text-slate-300">
                Choisir un fichier ou prendre une photo
              </Text>
            </>
          )}
        </Pressable>
      </View>

      <Button
        label="Envoyer la justification"
        loading={mutation.isPending}
        disabled={!file || !reason.trim()}
        onPress={() => mutation.mutate()}
      />
    </ScreenContainer>
  );
}

function guessMime(filename?: string): string {
  if (!filename) return 'application/octet-stream';
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}
