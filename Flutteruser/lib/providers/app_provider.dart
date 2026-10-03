import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/branch_model.dart';
import '../services/branch_service.dart';
import '../services/storage_service.dart';

class AppState {
  final String orderType; // DELIVERY, PICKUP
  final BranchModel? selectedBranch;
  final List<BranchModel> branches;
  final bool isLoadingBranches;

  AppState({
    this.orderType = 'DELIVERY',
    this.selectedBranch,
    this.branches = const [],
    this.isLoadingBranches = false,
  });

  AppState copyWith({
    String? orderType,
    BranchModel? selectedBranch,
    List<BranchModel>? branches,
    bool? isLoadingBranches,
  }) {
    return AppState(
      orderType: orderType ?? this.orderType,
      selectedBranch: selectedBranch ?? this.selectedBranch,
      branches: branches ?? this.branches,
      isLoadingBranches: isLoadingBranches ?? this.isLoadingBranches,
    );
  }
}

class AppNotifier extends StateNotifier<AppState> {
  final BranchService _branchService = BranchService();
  final StorageService _storage = StorageService();

  AppNotifier() : super(AppState(isLoadingBranches: true)) {
    loadInitialState();
  }

  Future<void> loadInitialState() async {
    final savedOrderType = _storage.getOrderType();
    state = state.copyWith(orderType: savedOrderType);
    await loadBranches();
  }

  Future<void> loadBranches() async {
    state = state.copyWith(isLoadingBranches: true);
    try {
      final branches = await _branchService.getBranches();
      BranchModel? selected;
      final savedBranchId = _storage.getSelectedBranchId();

      if (savedBranchId != null) {
        selected = branches.where((b) => b.id == savedBranchId).firstOrNull;
      }
      selected ??= branches.firstOrNull;

      state = state.copyWith(
        branches: branches,
        selectedBranch: selected,
        isLoadingBranches: false,
      );
    } catch (_) {
      state = state.copyWith(isLoadingBranches: false);
    }
  }

  void setOrderType(String type) {
    _storage.saveOrderType(type);
    state = state.copyWith(orderType: type);
  }

  void setSelectedBranch(BranchModel branch) {
    _storage.saveSelectedBranchId(branch.id);
    state = state.copyWith(selectedBranch: branch);
  }
}

final appProvider = StateNotifierProvider<AppNotifier, AppState>((ref) {
  return AppNotifier();
});
