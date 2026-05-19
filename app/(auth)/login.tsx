import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { humanizeApiError } from '~/api/client';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { ScreenContainer } from '~/components/ui/ScreenContainer';
import { useAuth } from '~/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      router.replace('/(tabs)');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('auth.errors.invalidCredentials'),
        text2: humanizeApiError(error),
      });
    }
  });

  return (
    <ScreenContainer>
      <View className="mt-12 gap-2">
        <Text className="text-xs font-medium uppercase tracking-widest text-primary-700 dark:text-primary-100">
          {t('common.appName')}
        </Text>
        <Text className="text-4xl font-bold text-slate-900 dark:text-white">
          {t('auth.login.title')}
        </Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          Connectez-vous pour pointer et consulter vos présences.
        </Text>
      </View>

      <View className="gap-4">
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
              textContentType="emailAddress"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('auth.login.password')}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
            />
          )}
        />

        <Link href="/(auth)/forgot-password" className="self-end">
          <Text className="text-sm font-medium text-primary-700 dark:text-primary-100">
            {t('auth.login.forgotPassword')}
          </Text>
        </Link>
      </View>

      <View className="gap-3">
        <Button
          label={t('auth.login.submit')}
          loading={login.isPending}
          onPress={onSubmit}
        />
      </View>
    </ScreenContainer>
  );
}
