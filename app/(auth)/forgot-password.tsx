import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { api, humanizeApiError } from '~/api/client';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { ScreenContainer } from '~/components/ui/ScreenContainer';

const schema = z.object({ email: z.string().email('Email invalide') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await api.post('/auth/forgot-password', { email });
      Toast.show({
        type: 'success',
        text1: 'Email envoyé',
        text2: 'Vérifiez votre boîte de réception.',
      });
      router.back();
    } catch (error) {
      Toast.show({ type: 'error', text1: humanizeApiError(error) });
    }
  });

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: true, title: 'Mot de passe oublié' }} />
      <View className="gap-2 mt-4">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Réinitialiser le mot de passe
        </Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          Saisissez votre email professionnel. Nous vous enverrons un lien pour choisir un nouveau
          mot de passe.
        </Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Adresse email"
            placeholder="prenom.nom@entreprise.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />

      <Button label="Envoyer le lien" loading={isSubmitting} onPress={onSubmit} />
    </ScreenContainer>
  );
}
