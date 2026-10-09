import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../models/address_model.dart';
import '../../services/address_service.dart';
import '../../widgets/tezlaa_button.dart';

final addressesListProvider = FutureProvider<List<AddressModel>>((ref) async {
  return await AddressService().getAddresses();
});

class AddressesScreen extends ConsumerStatefulWidget {
  const AddressesScreen({super.key});

  @override
  ConsumerState<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends ConsumerState<AddressesScreen> {
  void _showAddAddressSheet(BuildContext context) {
    final labelCtrl = TextEditingController(text: 'Home');
    final addressCtrl = TextEditingController();
    final cityCtrl = TextEditingController(text: 'Malabe');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Add Delivery Address',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, fontFamily: 'serif'),
            ),
            const SizedBox(height: 16),
            const Text('Label', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            TextField(
              controller: labelCtrl,
              decoration: const InputDecoration(hintText: 'Home, Office, etc.'),
            ),
            const SizedBox(height: 12),
            const Text('Address Line', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            TextField(
              controller: addressCtrl,
              decoration: const InputDecoration(hintText: 'No 123, Galle Road...'),
            ),
            const SizedBox(height: 12),
            const Text('City', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            TextField(
              controller: cityCtrl,
              decoration: const InputDecoration(hintText: 'Malabe / Colombo'),
            ),
            const SizedBox(height: 20),
            TezlaaButton(
              title: 'Save Address',
              width: double.infinity,
              size: TezlaaButtonSize.lg,
              onPress: () async {
                if (addressCtrl.text.trim().isEmpty) return;
                try {
                  await AddressService().createAddress(
                    label: labelCtrl.text.trim(),
                    addressLine1: addressCtrl.text.trim(),
                    city: cityCtrl.text.trim(),
                  );
                  ref.invalidate(addressesListProvider);
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                  }
                } catch (_) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      const SnackBar(content: Text('Failed to save address. Please check your input.'), backgroundColor: AppColors.red),
                    );
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final addressesAsync = ref.watch(addressesListProvider);

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Saved Addresses'),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.plus, color: AppColors.primary),
            onPressed: () => _showAddAddressSheet(context),
          ),
        ],
      ),
      body: SafeArea(
        child: addressesAsync.when(
          data: (addresses) {
            if (addresses.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.mapPin, size: 40, color: AppColors.primary),
                    const SizedBox(height: 12),
                    const Text('No saved addresses yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 16),
                    TezlaaButton(
                      title: 'Add New Address',
                      onPress: () => _showAddAddressSheet(context),
                    ),
                  ],
                ),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              itemCount: addresses.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, idx) {
                final addr = addresses[idx];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.neutral200),
                    boxShadow: const [
                      BoxShadow(
                        color: Color.fromRGBO(15, 23, 42, 0.04),
                        offset: Offset(0, 2),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: addr.isDefault ? AppColors.primaryMuted : AppColors.neutral100,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Icon(
                            LucideIcons.mapPin,
                            size: 18,
                            color: addr.isDefault ? AppColors.primary : AppColors.neutral600,
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(addr.label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                                if (addr.isDefault) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFDCFCE7),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Text('Default', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.green)),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text('${addr.addressLine1}, ${addr.city}', style: const TextStyle(fontSize: 13, color: AppColors.neutral500)),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.trash2, size: 16, color: AppColors.red),
                        onPressed: () async {
                          try {
                            await AddressService().deleteAddress(addr.id);
                            ref.invalidate(addressesListProvider);
                          } catch (_) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Failed to delete address'), backgroundColor: AppColors.red),
                              );
                            }
                          }
                        },
                      ),
                    ],
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
          error: (_, __) => const Center(child: Text('Failed to load addresses')),
        ),
      ),
    );
  }
}
