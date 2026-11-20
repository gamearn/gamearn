import 'package:flutter_test/flutter_test.dart';
import 'package:gamearn/config/api_config.dart';
import 'package:gamearn/services/api_service.dart';
import 'package:gamearn/utils/error_utils.dart';

void main() {
  test('default production API points only to api.gamearn.app', () {
    expect(ApiConfig.nodeBaseUrl, 'https://api.gamearn.app');
  });

  group('safe error messages', () {
    test('hides server implementation details for 5xx failures', () {
      final message = friendlyMessage(ApiException(
        code: 'INTERNAL_ERROR',
        message: 'database password authentication failed',
        statusCode: 500,
      ));
      expect(message,
          'Something went wrong on our end. Please try again shortly.');
      expect(message, isNot(contains('database')));
    });

    test('keeps actionable validation messages', () {
      expect(
        friendlyMessage(ApiException(
          code: 'VALIDATION_ERROR',
          message: 'Enter a valid tournament name.',
          statusCode: 400,
        )),
        'Enter a valid tournament name.',
      );
    });
  });

  group('API response envelope', () {
    test('returns data from successful responses', () {
      expect(
        decodeApiResponse(200, '{"success":true,"data":{"value":7}}'),
        {'value': 7},
      );
    });

    test('preserves backend error code and status', () {
      expect(
        () => decodeApiResponse(
          409,
          '{"success":false,"error":{"code":"CONFLICT","message":"Already exists"}}',
        ),
        throwsA(isA<ApiException>()
            .having((error) => error.code, 'code', 'CONFLICT')
            .having((error) => error.statusCode, 'statusCode', 409)),
      );
    });

    test('classifies malformed JSON as an invalid server response', () {
      expect(
        () => decodeApiResponse(502, '<html>Bad gateway</html>'),
        throwsA(isA<ApiException>()
            .having((error) => error.code, 'code', 'INVALID_RESPONSE')),
      );
    });
  });
}
