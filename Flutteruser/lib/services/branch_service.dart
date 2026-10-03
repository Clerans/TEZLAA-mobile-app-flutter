import '../core/constants/api_endpoints.dart';
import '../models/branch_model.dart';
import 'api_client.dart';

class BranchService {
  final ApiClient _client = ApiClient();

  Future<List<BranchModel>> getBranches() async {
    final res = await _client.get(ApiEndpoints.branches);
    final list = (res.data['data'] ?? res.data) as List<dynamic>;
    return list.map((b) => BranchModel.fromJson(b)).toList();
  }
}
