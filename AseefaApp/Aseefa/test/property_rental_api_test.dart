import 'package:flutter_test/flutter_test.dart';
import 'package:suitapps/features/property_management/rental_info_screen.dart';

void main() {
  group('Rental tenant API mapping', () {
    test('maps the web tenant response fields', () {
      final tenant = RentalTenantOption.fromApi({
        'UserId': 597,
        'Name': 'Alan',
        'Mobile': '8900988909',
        'Email': null,
      });

      expect(tenant.id, 597);
      expect(tenant.label, 'Alan');
      expect(tenant.mobile, '8900988909');
      expect(tenant.email, isEmpty);
    });

    test('keeps tenant and audit IDs separate in rental payload', () {
      final rental = RentalForm(
        recordId: 1068,
        tenantUserId: 597,
        tenantName: 'Alan',
      );

      final payload = rental.toPayload(
        companyId: 8,
        userId: 23,
        propertyId: 24,
      );

      expect(payload['TenantUserID'], 597);
      expect(payload['UserID'], 23);
      expect(payload['RecordID'], 1068);
      expect(payload['PropertyID'], 24);
      expect(payload['CompanyID'], 8);
    });
  });
}
