import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  final _secureStorage = const FlutterSecureStorage();
  SharedPreferences? _prefs;

  static const String _tokenKey = 'tezlaa_access_token';
  static const String _refreshTokenKey = 'tezlaa_refresh_token';
  static const String _userIdKey = 'tezlaa_user_id';
  static const String _favoritesKey = 'tezlaa_favorite_ids';
  static const String _selectedBranchKey = 'tezlaa_selected_branch_id';
  static const String _orderTypeKey = 'tezlaa_order_type';

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Token management
  Future<void> saveTokens({required String accessToken, String? refreshToken}) async {
    await _secureStorage.write(key: _tokenKey, value: accessToken);
    if (refreshToken != null) {
      await _secureStorage.write(key: _refreshTokenKey, value: refreshToken);
    }
  }

  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: _tokenKey);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: _refreshTokenKey);
  }

  Future<void> clearTokens() async {
    await _secureStorage.delete(key: _tokenKey);
    await _secureStorage.delete(key: _refreshTokenKey);
    await _secureStorage.delete(key: _userIdKey);
  }

  // Local preferences
  Future<void> saveSelectedBranchId(String branchId) async {
    await _prefs?.setString(_selectedBranchKey, branchId);
  }

  String? getSelectedBranchId() {
    return _prefs?.getString(_selectedBranchKey);
  }

  Future<void> saveOrderType(String orderType) async {
    await _prefs?.setString(_orderTypeKey, orderType);
  }

  String getOrderType() {
    return _prefs?.getString(_orderTypeKey) ?? 'DELIVERY';
  }

  Future<void> saveFavoriteIds(List<String> ids) async {
    await _prefs?.setStringList(_favoritesKey, ids);
  }

  List<String> getFavoriteIds() {
    return _prefs?.getStringList(_favoritesKey) ?? [];
  }
}
