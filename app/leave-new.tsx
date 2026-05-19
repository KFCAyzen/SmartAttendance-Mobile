import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';

import { humanizeApiError } from '~/api/client';
import { createLeave, type LeaveType } from '~/api/leaves';
import { Button } from '~/components/ui/Button';
import { DateField } from '~/components/ui/DateField';
import { ScreenContainer } from '~/components/ui/ScreenContainer';
import { Select } from '~/components/ui/Select';
import { LEAVE_TYPE_LABELS } from '~/lib/leaves';

const schema = z
  .object({
    type: z.enum(['VACATION', 'SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'UNPAID']),
    startDate: z.date(),
    endDate: z.date(),
    reason: z.string().optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    path: ['endDate'],
    message: 'La date de fin doit être après la date de début',
  });

type FormValues = z.infer<typeof schema>;

const typeOptions = (Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((t) => ({
  value: t,
  label: LEAVE_TYPE_LABELS[t],
}));

export default function LeaveNewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'VACATION', startDate: today, endDate: today, reason: '' },
  });

  const create = useMutation({
    mutationFn: (values: FormValues) =>
      createLeave({
        type: values.type,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        reason: values.reason?.trim() || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leaves'] });
      Toast.show({
        type: 'success',
        text1: 'Demande envoyée',
        text2: 'Votre responsable doit valider la demande.',
      });
      router.back();
    },
    onError: (e) => Toast.show({ type: 'error', text1: humanizeApiError(e) }),
  });

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: true, title: 'Nouvelle demande', headerBackTitle: 'Annuler' }} />

      <View className="gap-1 mt-2">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Demande de congé
        </Text>
        <Text className="text-base text-slate-500 dark:text-slate-400">
          Indiquez la période et le motif. Vous serez notifié dès qu&apos;un responsable répond.
        </Text>
      </View>

      <Controller
        control={control}
        name="type"
        render={({ field: { value, onChange } }) => (
          <Select label="Type de congé" value={value} onChange={onChange} options={typeOptions} />
        )}
      />

      <Controller
        control={control}
        name="startDate"
        render={({ field: { value, onChange } }) => (
          <DateField
            label="Du"
            value={value}
            onChange={onChange}
            minimumDate={today}
            error={errors.startDate?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="endDate"
        render={({ field: { value, onChange } }) => (
          <DateField
            label="Au"
            value={value}
            onChange={onChange}
            minimumDate={today}
            error={errors.endDate?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="reason"
        render={({ field: { value, onChange, onBlur } }) => (
          <View className="gap-1.5">
            <Text className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
              Motif (optionnel)
            </Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex : vacances familiales"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              className="min-h-[100px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-base text-slate-900 dark:text-white"
            />
          </View>
        )}
      />

      <Button
        label="Envoyer la demande"
        loading={create.isPending}
        onPress={handleSubmit((v) => create.mutate(v))}
      />
    </ScreenContainer>
  );
}
