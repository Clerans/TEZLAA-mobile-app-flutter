import '../core/constants/api_endpoints.dart';
import '../models/loyalty_model.dart';
import 'api_client.dart';

class LoyaltyService {
  final ApiClient _client = ApiClient();

  Future<LoyaltyAccountModel> getAccount() async {
    final res = await _client.get(ApiEndpoints.loyaltyAccount);
    final data = res.data['data'] ?? res.data;
    return LoyaltyAccountModel.fromJson(data);
  }

  Future<List<LoyaltyRewardModel>> getRewards() async {
    final res = await _client.get(ApiEndpoints.loyaltyRewards);
    final list = (res.data['data'] ?? res.data) as List<dynamic>;
    return list.map((r) => LoyaltyRewardModel.fromJson(r)).toList();
  }

  Future<Map<String, dynamic>> redeemReward(String rewardId) async {
    final res = await _client.post(ApiEndpoints.redeemReward, data: {
      'rewardId': rewardId,
    });
    return (res.data['data'] ?? res.data) as Map<String, dynamic>;
  }
}
