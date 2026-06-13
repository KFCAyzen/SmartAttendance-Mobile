import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { z } from 'zod';

import { api, humanizeApiError } from '~/api/client';
import { feedback } from '~/components/feedback';
import {
  AuthField,
  AuthScreen,
  BackButton,
  C,
  FONT,
  PrimaryButton,
} from '~/components/login/auth-ui';

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
      feedback.success(t('auth.forgotPassword.sentTitle'), t('auth.forgotPassword.sentMessage'));
      router.back();
    } catch (error) {
      feedback.error(humanizeApiError(error));
    }
  });

  return (
    <AuthScreen>
      <Animated.View entering={FadeInDown.duration(500)}>
        <BackButton onPress={() => router.back()} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(60)} style={{ marginTop: 32 }}>
        <Text style={{ fontFamily: FONT.display, fontSize: 30, color: C.white, letterSpacing: -0.5 }}>
          {t('auth.forgotPassword.title')}
        </Text>
        <Text
          style={{
            marginTop: 10,
            fontFamily: FONT.body,
            fontSize: 14.5,
            lineHeight: 21,
            color: 'rgba(255,255,255,0.6)',
            maxWidth: 300,
          }}
        >
          {t('auth.forgotPassword.subtitle')}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(500).delay(120)} style={{ marginTop: 28, gap: 16 }}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <AuthField
              icon="mail-outline"
              label={t('auth.login.email')}
              placeholder="prenom.nom@entreprise.com"
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoComplete="email"
              error={errors.email?.message}
            />
          )}
        />
        <PrimaryButton
          label={t('auth.forgotPassword.submit')}
          onPress={onSubmit}
          loading={isSubmitting}
          icon="paper-plane-outline"
        />
      </Animated.View>

      <View style={{ flex: 1 }} />
    </AuthScreen>
  );
}
