import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/category_model.dart';
import '../models/product_model.dart';
import '../models/promotion_model.dart';
import '../services/product_service.dart';

final productServiceProvider = Provider<ProductService>((ref) => ProductService());

final categoriesProvider = FutureProvider<List<CategoryModel>>((ref) async {
  final service = ref.watch(productServiceProvider);
  return await service.getCategories();
});

final freshTodayProvider = FutureProvider<List<ProductModel>>((ref) async {
  final service = ref.watch(productServiceProvider);
  return await service.getFreshToday();
});

final featuredProductsProvider = FutureProvider<List<ProductModel>>((ref) async {
  final service = ref.watch(productServiceProvider);
  return await service.getProducts(isFeatured: true);
});

final promotionsProvider = FutureProvider<List<PromotionModel>>((ref) async {
  final service = ref.watch(productServiceProvider);
  return await service.getPromotions();
});

final selectedCategoryFilterProvider = StateProvider<String?>((ref) => null);
final searchQueryProvider = StateProvider<String>((ref) => '');

final menuProductsProvider = FutureProvider<List<ProductModel>>((ref) async {
  final service = ref.watch(productServiceProvider);
  final categoryId = ref.watch(selectedCategoryFilterProvider);
  final query = ref.watch(searchQueryProvider);

  return await service.getProducts(
    categoryId: categoryId,
    search: query.isNotEmpty ? query : null,
  );
});
