import { homeRoute, resolveRedirect, type GuardInput } from './nav-guard';

const base: GuardInput = {
  navReady: true,
  status: 'authenticated',
  effectiveAdmin: false,
  segments: [],
};

describe('homeRoute', () => {
  it('routes admins to the back-office', () => {
    expect(homeRoute(true)).toBe('/(admin)/(home)');
  });

  it('routes non-admins to the employee tabs', () => {
    expect(homeRoute(false)).toBe('/(tabs)');
  });
});

describe('resolveRedirect', () => {
  it('does nothing before the navigator is ready', () => {
    expect(resolveRedirect({ ...base, navReady: false, status: 'unauthenticated' })).toBeNull();
  });

  it.each(['idle', 'loading', 'verifying_device'] as const)(
    'does nothing while status is %s, regardless of location',
    (status) => {
      expect(resolveRedirect({ ...base, status, segments: ['(admin)'] })).toBeNull();
    },
  );

  describe('unauthenticated', () => {
    it('redirects to login when outside the auth group', () => {
      expect(resolveRedirect({ ...base, status: 'unauthenticated', segments: ['(tabs)'] })).toBe(
        '/(auth)/login',
      );
    });

    it('stays put when already inside the auth group', () => {
      expect(
        resolveRedirect({ ...base, status: 'unauthenticated', segments: ['(auth)', 'login'] }),
      ).toBeNull();
    });

    // Documented edge case: logging out from device-pending must still bounce
    // to login even though device-pending itself lives inside (auth).
    it('still redirects to login when logging out from the device-pending screen', () => {
      expect(
        resolveRedirect({
          ...base,
          status: 'unauthenticated',
          segments: ['(auth)', 'device-pending'],
        }),
      ).toBe('/(auth)/login');
    });
  });

  describe('device_pending / device_error', () => {
    it.each(['device_pending', 'device_error'] as const)(
      'redirects to the device-pending screen when status is %s',
      (status) => {
        expect(resolveRedirect({ ...base, status, segments: ['(tabs)'] })).toBe(
          '/(auth)/device-pending',
        );
      },
    );

    it('does not loop when already on the device-pending screen', () => {
      expect(
        resolveRedirect({
          ...base,
          status: 'device_pending',
          segments: ['(auth)', 'device-pending'],
        }),
      ).toBeNull();
    });
  });

  describe('authenticated — role-based routing', () => {
    it('sends an authenticated admin out of the auth group to the back-office', () => {
      expect(
        resolveRedirect({ ...base, status: 'authenticated', effectiveAdmin: true, segments: ['(auth)', 'login'] }),
      ).toBe('/(admin)/(home)');
    });

    it('sends an authenticated non-admin out of the auth group to the employee tabs', () => {
      expect(
        resolveRedirect({ ...base, status: 'authenticated', effectiveAdmin: false, segments: ['(auth)', 'login'] }),
      ).toBe('/(tabs)');
    });

    it('redirects an effective admin away from the employee tabs to the back-office', () => {
      expect(
        resolveRedirect({ ...base, status: 'authenticated', effectiveAdmin: true, segments: ['(tabs)'] }),
      ).toBe('/(admin)/(home)');
    });

    it('redirects a non-admin away from the admin area to the employee tabs', () => {
      expect(
        resolveRedirect({ ...base, status: 'authenticated', effectiveAdmin: false, segments: ['(admin)'] }),
      ).toBe('/(tabs)');
    });

    // The exact mechanism that lets an admin toggle to "employee view" without
    // being bounced straight back to the back-office by this same guard.
    it('lets an admin who toggled to employee view stay in the employee tabs', () => {
      expect(
        resolveRedirect({ ...base, status: 'authenticated', effectiveAdmin: false, segments: ['(tabs)'] }),
      ).toBeNull();
    });

    it('does nothing when an admin is already in the admin area', () => {
      expect(
        resolveRedirect({ ...base, status: 'authenticated', effectiveAdmin: true, segments: ['(admin)'] }),
      ).toBeNull();
    });

    it('does nothing for a route outside both the tabs and admin groups (e.g. a top-level modal)', () => {
      expect(
        resolveRedirect({ ...base, status: 'authenticated', effectiveAdmin: false, segments: ['notifications'] }),
      ).toBeNull();
    });
  });
});
