import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/constants/api_endpoints.dart';
import '../services/api_client.dart';
import '../services/storage_service.dart';

class FavoritesNotifier extends StateNotifier<List<String>> {
  final StorageService _storage = StorageService();
  final ApiClient _client = ApiClient();

  FavoritesNotifier() : super([]) {
    loadFavorites();
  }

  Future<void> loadFavorites() async {
    final local = _storage.getFavoriteIds();
    state = local;

    final token = await _storage.getAccessToken();
    if (token != null && token.isNotEmpty) {
      try {
        final res = await _client.get(ApiEndpoints.favourites);
        final list = (res.data['data'] ?? res.data) as List<dynamic>;
        final ids = list.map((item) {
          if (item is String) return item;
          if (item is Map) return (item['productId'] ?? item['id'] ?? '').toString();
          return '';
        }).where((id) => id.isNotEmpty).toList();

        final merged = {...local, ...ids}.toList();
        state = merged;
        _storage.saveFavoriteIds(merged);
      } catch (_) {
        // Fallback to local
      }
    }
  }

  Future<void> toggleFavorite(String productId) async {
    final isFav = state.contains(productId);
    if (isFav) {
      state = state.where((id) => id != productId).toList();
    } else {
      state = [...state, productId];
    }
    _storage.saveFavoriteIds(state);

    final token = await _storage.getAccessToken();
    if (token != null && token.isNotEmpty) {
      try {
        await _client.post(ApiEndpoints.toggleFavourite(productId));
      } catch (_) {
        // Revert or keep local
      }
    }
  }

  bool isFavorite(String productId) {
    return state.contains(productId);
  }
}

final favoritesProvider = StateNotifierProvider<FavoritesNotifier, List<String>>((ref) {
  return FavoritesNotifier();
});
