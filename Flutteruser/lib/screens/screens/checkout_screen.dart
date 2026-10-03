import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../models/address_model.dart';
import '../../providers/app_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/address_service.dart';
import '../../services/order_service.dart';
import '../../widgets/tezlaa_button.dart';

final checkoutAddressesProvider = FutureProvider<List<AddressModel>>((ref) async {
  return await AddressService().getAddresses();
});

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  String _paymentMethod = 'CASH_ON_DELIVERY'; // CASH_ON_DELIVERY, CARD
  final _customerNotesController = TextEditingController();
  final _couponCodeController = TextEditingController();
  AddressModel? _selectedAddress;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _customerNotesController.dispose();
    _couponCodeController.dispose();
    super.dispose();
  }

  Future<void> _handlePlaceOrder() async {
    final cart = ref.read(cartProvider);
    final appState = ref.read(appProvider);

    if (cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your cart is empty.')),
      );
      return;
    }

    if (appState.selectedBranch == null) {
      setState(() {
        _error = 'Please select a branch before placing your order.';
      });
      return;
    }

    if (appState.orderType == 'DELIVERY' && _selectedAddress == null) {
      setState(() {
        _error = 'Please select or add a delivery address.';
      });
      return;
    }

    final branchId = appState.selectedBranch!.id;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final itemsPayload = cart.items.map((i) {
        return {
          'productId': i.productId,
          if (i.variantId != null) 'variantId': i.variantId,
          if (i.addons.isNotEmpty)
            'addonIds': i.addons.expand((a) => List.filled(a.quantity, a.id)).toList(),
          'quantity': i.quantity,
        };
      }).toList();

      final order = await OrderService().placeOrder(
        orderType: appState.orderType,
        branchId: branchId,
        addressId: appState.orderType == 'DELIVERY' ? _selectedAddress?.id : null,
        customerNotes: _customerNotesController.text.trim().isNotEmpty
            ? _customerNotesController.text.trim()
            : null,
        couponCode: cart.couponCode,
        paymentMethod: _paymentMethod,
        items: itemsPayload,
      );

      ref.read(cartProvider.notifier).clearCart();

      if (!mounted) return;
      setState(() => _loading = false);

      context.pushReplacement('/order-tracking?orderId=${order.id}&orderNumber=${order.orderNumber}');
    } catch (e) {
      if (!mounted) return;
      String errMsg = 'Failed to place order. Please check your connection and details.';
      if (e is DioException) {
        final msg = e.response?.data?['message'];
        if (msg != null && msg.toString().isNotEmpty) {
          errMsg = msg.toString();
        }
      }
      setState(() {
        _loading = false;
        _error = errMsg;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final appState = ref.watch(appProvider);
    final addressesAsync = ref.watch(checkoutAddressesProvider);
    final deliveryFee = cart.getDeliveryFee(appState.orderType);
    final grandTotal = cart.getGrandTotal(appState.orderType);

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Checkout'),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: AppColors.neutral900),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_error != null) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.redLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _error!,
                          style: const TextStyle(color: AppColors.red, fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],
                    // 1. Order Type (Delivery vs Pickup)
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.neutral100,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      padding: const EdgeInsets.all(4),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => ref.read(appProvider.notifier).setOrderType('DELIVERY'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: appState.orderType == 'DELIVERY' ? Colors.white : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: appState.orderType == 'DELIVERY'
                                      ? const [
                                          BoxShadow(
                                            color: Color.fromRGBO(0, 0, 0, 0.05),
                                            offset: Offset(0, 1),
                                            blurRadius: 3,
                                          )
                                        ]
                                      : null,
                                ),
                                child: Center(
                                  child: Text(
                                    'Delivery',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: appState.orderType == 'DELIVERY' ? AppColors.primary : AppColors.neutral500,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => ref.read(appProvider.notifier).setOrderType('PICKUP'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 10),
                                decoration: BoxDecoration(
                                  color: appState.orderType == 'PICKUP' ? Colors.white : Colors.transparent,
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: appState.orderType == 'PICKUP'
                                      ? const [
                                          BoxShadow(
                                            color: Color.fromRGBO(0, 0, 0, 0.05),
                                            offset: Offset(0, 1),
                                            blurRadius: 3,
                                          )
                                        ]
                                      : null,
                                ),
                                child: Center(
                                  child: Text(
                                    'Store Pickup',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: appState.orderType == 'PICKUP' ? AppColors.primary : AppColors.neutral500,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // 2. Address / Branch Destination Info
                    if (appState.orderType == 'DELIVERY') ...[
                      _buildSectionCard(
                        title: 'Delivery Address',
                        icon: LucideIcons.mapPin,
                        child: addressesAsync.when(
                          data: (addresses) {
                            if (addresses.isEmpty) {
                              return Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('No addresses saved yet', style: TextStyle(color: AppColors.neutral500)),
                                  TextButton(
                                    onPressed: () => context.push('/addresses'),
                                    child: const Text('Add Address', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
                                  ),
                                ],
                              );
                            }

                            _selectedAddress ??= addresses.firstWhere((a) => a.isDefault, orElse: () => addresses.first);

                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(_selectedAddress?.label ?? 'Home', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.neutral900)),
                                    InkWell(
                                      onTap: () => context.push('/addresses'),
                                      child: const Text('Change', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary)),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${_selectedAddress?.addressLine1 ?? ''}, ${_selectedAddress?.city ?? ''}',
                                  style: const TextStyle(fontSize: 13, color: AppColors.neutral500),
                                ),
                              ],
                            );
                          },
                          loading: () => const CircularProgressIndicator(),
                          error: (_, __) => const Text('Error loading addresses'),
                        ),
                      ),
                    ] else ...[
                      _buildSectionCard(
                        title: 'Pickup Location',
                        icon: LucideIcons.store,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(appState.selectedBranch?.name ?? 'TEZLAA Flagship', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.neutral900)),
                                InkWell(
                                  onTap: () => context.push('/branch'),
                                  child: const Text('Change', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(appState.selectedBranch?.address ?? 'No 450, Kaduwela Road, Malabe', style: const TextStyle(fontSize: 13, color: AppColors.neutral500)),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    // 3. Payment Method
                    _buildSectionCard(
                      title: 'Payment Method',
                      icon: LucideIcons.creditCard,
                      child: RadioGroup<String>(
                        groupValue: _paymentMethod,
                        onChanged: (val) {
                          if (val != null) setState(() => _paymentMethod = val);
                        },
                        child: Column(
                          children: [
                            RadioListTile<String>(
                              value: 'CASH_ON_DELIVERY',
                              title: const Text('Cash On Delivery (COD)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                              subtitle: const Text('Pay with cash upon delivery or pickup', style: TextStyle(fontSize: 12, color: AppColors.neutral500)),
                              contentPadding: EdgeInsets.zero,
                            ),
                            const Divider(height: 1, color: AppColors.neutral100),
                            RadioListTile<String>(
                              value: 'CARD',
                              title: const Text('Credit / Debit Card (PayHere)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                              subtitle: const Text('Visa, Mastercard, Amex, Genie', style: TextStyle(fontSize: 12, color: AppColors.neutral500)),
                              contentPadding: EdgeInsets.zero,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // 4. Notes & Instructions
                    _buildSectionCard(
                      title: 'Notes & Instructions',
                      icon: LucideIcons.fileText,
                      child: TextField(
                        controller: _customerNotesController,
                        maxLines: 2,
                        decoration: const InputDecoration(
                          hintText: 'e.g. Please ring bell twice, extra napkins...',
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          filled: false,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // 5. Payment Breakdown
                    _buildSectionCard(
                      title: 'Payment Breakdown',
                      icon: LucideIcons.receipt,
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Subtotal', style: TextStyle(fontSize: 13, color: AppColors.neutral500)),
                              Text('Rs. ${cart.subtotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(appState.orderType == 'DELIVERY' ? 'Delivery Fee' : 'Pickup Fee', style: const TextStyle(fontSize: 13, color: AppColors.neutral500)),
                              Text(deliveryFee == 0 ? 'FREE' : 'Rs. ${deliveryFee.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                            ],
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 10),
                            child: Divider(height: 1, color: AppColors.neutral100),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Total Amount', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.neutral900)),
                              Text('Rs. ${grandTotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primary)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
            // Sticky Place Order Button
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                boxShadow: [
                  BoxShadow(
                    color: Color.fromRGBO(15, 23, 42, 0.08),
                    offset: Offset(0, -4),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: TezlaaButton(
                title: 'Place Order — Rs. ${grandTotal.toStringAsFixed(0)}',
                onPress: _handlePlaceOrder,
                loading: _loading,
                size: TezlaaButtonSize.lg,
                width: double.infinity,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.neutral200),
        boxShadow: const [
          BoxShadow(
            color: Color.fromRGBO(15, 23, 42, 0.04),
            offset: Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        clipBehavior: Clip.antiAlias,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, size: 16, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.neutral900,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              child,
            ],
          ),
        ),
      ),
    );
  }
}
