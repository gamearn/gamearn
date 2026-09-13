import 'package:flutter_test/flutter_test.dart';
import 'package:gamearn/utils/auth_route_policy.dart';

void main() {
  group('authentication routing', () {
    test('signed-out users go to the landing flow', () {
      expect(
        authDestinationBeforeProfile(
          hasUser: false,
          isPasswordUser: false,
          emailVerified: false,
          hasEmail: false,
        ),
        AuthDestination.signedOut,
      );
    });

    test('unverified password users with email go to OTP verification', () {
      expect(
        authDestinationBeforeProfile(
          hasUser: true,
          isPasswordUser: true,
          emailVerified: false,
          hasEmail: true,
        ),
        AuthDestination.verifyEmail,
      );
    });

    test('social and verified users continue to profile loading', () {
      expect(
        authDestinationBeforeProfile(
          hasUser: true,
          isPasswordUser: false,
          emailVerified: false,
          hasEmail: true,
        ),
        AuthDestination.loadProfile,
      );
      expect(
        authDestinationBeforeProfile(
          hasUser: true,
          isPasswordUser: true,
          emailVerified: true,
          hasEmail: true,
        ),
        AuthDestination.loadProfile,
      );
    });

    test('profile state selects setup, admin, or player', () {
      expect(
        authDestinationFromProfile(profileExists: false, isAdmin: false),
        AuthDestination.profileSetup,
      );
      expect(
        authDestinationFromProfile(profileExists: true, isAdmin: true),
        AuthDestination.admin,
      );
      expect(
        authDestinationFromProfile(profileExists: true, isAdmin: false),
        AuthDestination.player,
      );
    });
  });
}
