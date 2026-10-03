import '../core/constants/api_endpoints.dart';
import '../models/address_model.dart';
import 'api_client.dart';

class AddressService {
  final ApiClient _client = ApiClient();

  Future<List<AddressModel>> getAddresses() async {
    final res = await _client.get(ApiEndpoints.addresses);
    final list = (res.data['data'] ?? res.data) as List<dynamic>;
    return list.map((a) => AddressModel.fromJson(a)).toList();
  }

  Future<AddressModel> createAddress({
    required String label,
    required String addressLine1,
    String? addressLine2,
    String city = 'Colombo',
    String? postalCode,
    double? latitude,
    double? longitude,
    String? deliveryInstructions,
    bool isDefault = false,
  }) async {
    final res = await _client.post(ApiEndpoints.addresses, data: {
      'label': label,
      'addressLine1': addressLine1,
      if (addressLine2 != null) 'addressLine2': addressLine2,
      'city': city,
      if (postalCode != null) 'postalCode': postalCode,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (deliveryInstructions != null) 'deliveryInstructions': deliveryInstructions,
      'isDefault': isDefault,
    });
    final data = res.data['data'] ?? res.data;
    return AddressModel.fromJson(data);
  }

  Future<AddressModel> updateAddress(String id, Map<String, dynamic> data) async {
    final res = await _client.patch(ApiEndpoints.addressDetail(id), data: data);
    final resData = res.data['data'] ?? res.data;
    return AddressModel.fromJson(resData);
  }

  Future<void> deleteAddress(String id) async {
    await _client.delete(ApiEndpoints.addressDetail(id));
  }

  Future<void> setDefaultAddress(String id) async {
    await _client.patch(ApiEndpoints.setDefaultAddress(id));
  }
}
