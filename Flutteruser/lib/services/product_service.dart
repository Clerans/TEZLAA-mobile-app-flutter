import '../core/constants/api_endpoints.dart';
import '../models/category_model.dart';
import '../models/product_model.dart';
import '../models/promotion_model.dart';
import 'api_client.dart';

class ProductService {
  final ApiClient _client = ApiClient();

  Future<List<CategoryModel>> getCategories() async {
    final res = await _client.get(ApiEndpoints.categories);
    final list = (res.data['data'] ?? res.data) as List<dynamic>;
    return list.map((c) => CategoryModel.fromJson(c)).toList();
  }

  Future<List<ProductModel>> getProducts({
    String? categoryId,
    String? search,
    bool? isFeatured,
    bool? isRecommended,
    bool? isFreshToday,
  }) async {
    final Map<String, dynamic> params = {};
    if (categoryId != null && categoryId.isNotEmpty && categoryId != 'all') {
      params['categoryId'] = categoryId;
    }
    if (search != null && search.isNotEmpty) {
      params['search'] = search;
    }
    if (isFeatured == true) params['featured'] = true;
    if (isRecommended == true) params['recommended'] = true;
    if (isFreshToday == true) params['freshToday'] = true;

    final res = await _client.get(ApiEndpoints.products, queryParameters: params);
    final data = res.data['data'] ?? res.data;
    final List<dynamic> list = data is List ? data : (data['items'] ?? []);
    return list.map((p) => ProductModel.fromJson(p)).toList();
  }

  Future<ProductModel> getProductById(String id) async {
    final res = await _client.get(ApiEndpoints.productDetail(id));
    final data = res.data['data'] ?? res.data;
    return ProductModel.fromJson(data);
  }

  Future<List<ProductModel>> getFreshToday() async {
    final res = await _client.get(ApiEndpoints.freshToday);
    final list = (res.data['data'] ?? res.data) as List<dynamic>;
    return list.map((p) => ProductModel.fromJson(p)).toList();
  }

  Future<List<PromotionModel>> getPromotions() async {
    final res = await _client.get(ApiEndpoints.promotions);
    final list = (res.data['data'] ?? res.data) as List<dynamic>;
    return list.map((p) => PromotionModel.fromJson(p)).toList();
  }
}
