import { zodResolver } from '@hookform/resolvers/zod';
import { Stack, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { api, humanizeApiError } from '~/api/client';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { ScreenContainer } from '~/components/ui/ScreenContainer';

type FormValues = { email: string };

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const schema = z.object({ email: z.string().email(t('common.emailInvalid')) });
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
        text1: t('auth.forgotPassword.sentTitle'),
        text2: t('auth.forgotPassword.sentMessage'),
      });
      router.back();
    } catch (error) {
      Toast.show({ type: 'error', text1: humanizeApiError(error) });
    }
  });

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: true, title: t('auth.login.forgotPassword') }} />
      <View className="gap-2 mt-4">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('auth.forgotPassword.title')}
        </Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          {t('auth.forgotPassword.subtitle')}
        </Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('auth.login.email')}
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

      <Button label={t('auth.forgotPassword.submit')} loading={isSubmitting} onPress={onSubmit} />
    </ScreenContainer>
  );
}
