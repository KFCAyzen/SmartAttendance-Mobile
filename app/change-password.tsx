import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { changePassword } from '~/api/auth';
import { humanizeApiError } from '~/api/client';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { ScreenContainer } from '~/components/ui/ScreenContainer';

type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  const schema = z
    .object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8, t('changePassword.minLength')),
      confirmPassword: z.string().min(1),
    })
    .refine((v) => v.newPassword === v.confirmPassword, {
      message: t('changePassword.mismatch'),
      path: ['confirmPassword'],
    });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: t('changePassword.success') });
      router.back();
    },
    onError: (error) => {
      Toast.show({ type: 'error', text1: humanizeApiError(error) });
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('changePassword.title') }} />
      <ScreenContainer>
        <View className="gap-2">
          <Text className="text-base text-slate-500 dark:text-slate-400">
            {t('changePassword.subtitle')}
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('changePassword.current')}
                placeholder="••••••••"
                secureTextEntry={!visible}
                autoCapitalize="none"
                textContentType="password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.currentPassword?.message}
                showPasswordToggle
                isPasswordVisible={visible}
                onTogglePassword={() => setVisible((p) => !p)}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('changePassword.new')}
                placeholder="••••••••"
                secureTextEntry={!visible}
                autoCapitalize="none"
                textContentType="newPassword"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.newPassword?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label={t('changePassword.confirm')}
                placeholder="••••••••"
                secureTextEntry={!visible}
                autoCapitalize="none"
                textContentType="newPassword"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
              />
            )}
          />
        </View>

        <Button
          label={t('changePassword.submit')}
          loading={mutation.isPending}
          onPress={onSubmit}
        />
      </ScreenContainer>
    </>
  );
}
