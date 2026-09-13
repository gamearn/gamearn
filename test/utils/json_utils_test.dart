import 'package:flutter_test/flutter_test.dart';
import 'package:gamearn/utils/json_utils.dart';

void main() {
  group('JSON boundary parsing', () {
    test('accepts integer, decimal, and numeric string values', () {
      expect(jsonInt(4), 4);
      expect(jsonInt(4.0), 4);
      expect(jsonInt('4'), 4);
      expect(jsonInt(null), isNull);
      expect(jsonInt('invalid'), isNull);
    });

    test('normalizes dice and legal-piece arrays safely', () {
      expect(jsonIntList(<Object?>[6, 3.0, '2', null, 'bad']), [6, 3, 2]);
      expect(jsonIntList(null), isEmpty);
    });

    test('normalizes maps and ignores malformed array entries', () {
      expect(
        jsonMapList(<Object?>[
          <String, Object?>{'pieceId': 1, 'diceValue': 6},
          'invalid',
        ]),
        [
          <String, dynamic>{'pieceId': 1, 'diceValue': 6}
        ],
      );
    });
  });
}
