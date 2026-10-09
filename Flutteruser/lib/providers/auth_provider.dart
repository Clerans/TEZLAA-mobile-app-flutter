import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import '../services/socket_service.dart';

class AuthState {
  final UserModel? user;
  final bool isLoading;
  final bool isAuthenticated;
  final String? error;

  AuthState({
    this.user,
    this.isLoading = false,
    this.isAuthenticated = false,
    this.error,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    bool? isAuthenticated,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService = AuthService();
  final StorageService _storage = StorageService();

  AuthNotifier() : super(AuthState(isLoading: true)) {
    checkAuth();
  }

  Future<void> checkAuth() async {
    try {
      final token = await _storage.getAccessToken();
      if (token == null || token.isEmpty) {
        state = AuthState(isAuthenticated: false, isLoading: false);
        return;
      }

      final user = await _authService.getCurrentUser();
      state = AuthState(user: user, isAuthenticated: true, isLoading: false);
      SocketService().connect();
    } catch (_) {
      await _storage.clearTokens();
      state = AuthState(isAuthenticated: false, isLoading: false);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _authService.login(email: email, password: password);
      state = AuthState(user: user, isAuthenticated: true, isLoading: false);
      SocketService().connect();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> register(String name, String email, String password, {String? phone}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _authService.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
      );
      // Unverified user is not authenticated until OTP verification
      state = state.copyWith(isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> verifyAccount(String email, String otp) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _authService.verifyOtp(email: email, otp: otp, purpose: 'REGISTER');
      state = AuthState(user: user, isAuthenticated: true, isLoading: false);
      SocketService().connect();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> refreshProfile() async {
    try {
      final user = await _authService.getCurrentUser();
      state = state.copyWith(user: user);
    } catch (_) {}
  }

  Future<void> logout() async {
    SocketService().disconnect();
    await _authService.logout();
    state = AuthState(isAuthenticated: false, isLoading: false);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
