import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uuid/uuid.dart';
import '../../core/constants/app_colors.dart';
import '../../models/address_model.dart';
import '../../providers/app_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/address_service.dart';
import '../../services/coupon_service.dart';
import '../../services/order_service.dart';
import '../../services/payment_service.dart';
import '../../models/order_model.dart';
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

  // Authoritative Pricing & Coupon state
  bool _validatingCart = false;
  Map<String, dynamic>? _serverCartData;
  List<String> _cartNotices = [];
  bool _applyingCoupon = false;
  String? _couponError;
  late String _idempotencyKey;

  @override
  void initState() {
    super.initState();
    _idempotencyKey = const Uuid().v4();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _validateCartWithServer();
    });
  }

  @override
  void dispose() {
    _customerNotesController.dispose();
    _couponCodeController.dispose();
    super.dispose();
  }

  Future<void> _validateCartWithServer() async {
    final cart = ref.read(cartProvider);
    final appState = ref.read(appProvider);
    if (cart.items.isEmpty) return;

    setState(() {
      _validatingCart = true;
      _couponError = null;
    });

    try {
      final itemsPayload = cart.items.map((i) {
        return {
          'productId': i.productId,
          if (i.variantId != null) 'variantId': i.variantId,
          if (i.addons.isNotEmpty)
            'addonIds': i.addons.expand((a) => List.filled(a.quantity, a.id)).toList(),
          'quantity': i.quantity,
          'clientUnitPrice': i.lineTotal / (i.quantity > 0 ? i.quantity : 1),
        };
      }).toList();

      final result = await OrderService().validateCart(
        branchId: appState.selectedBranch?.id,
        orderType: appState.orderType,
        items: itemsPayload,
      );

      if (mounted) {
        setState(() {
          _serverCartData = result;
          _cartNotices = List<String>.from(result['notices'] ?? []);
          _validatingCart = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _validatingCart = false);
      }
    }
  }

  Future<void> _applyCoupon() async {
    final code = _couponCodeController.text.trim();
    if (code.isEmpty) {
      setState(() => _couponError = 'Please enter a coupon code.');
      return;
    }

    final cart = ref.read(cartProvider);
    setState(() {
      _applyingCoupon = true;
      _couponError = null;
    });

    try {
      final res = await CouponService().validateCoupon(
        code: code,
        subtotal: cart.subtotal,
      );

      final discountAmount = (res['discountAmount'] as num?)?.toDouble() ?? 0.0;
      ref.read(cartProvider.notifier).applyCoupon(code.toUpperCase(), discountAmount);

      if (mounted) {
        _couponCodeController.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Coupon $code applied! You saved Rs. ${discountAmount.toStringAsFixed(0)}'),
            backgroundColor: AppColors.green,
          ),
        );
      }
      await _validateCartWithServer();
    } catch (e) {
      String msg = 'Invalid or expired coupon code.';
      if (e is DioException && e.response?.data?['message'] != null) {
        msg = e.response!.data['message'].toString();
      }
      setState(() => _couponError = msg);
    } finally {
      if (mounted) setState(() => _applyingCoupon = false);
    }
  }

  void _removeCoupon() {
    ref.read(cartProvider.notifier).removeCoupon();
    _validateCartWithServer();
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
      setState(() => _error = 'Please select a branch before placing your order.');
      return;
    }

    if (appState.orderType == 'DELIVERY' && _selectedAddress == null) {
      setState(() => _error = 'Please select or add a delivery address.');
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
        deliveryInstructions: null,
        customerNotes: _customerNotesController.text.trim().isNotEmpty
            ? _customerNotesController.text.trim()
            : null,
        couponCode: cart.couponCode,
        idempotencyKey: _idempotencyKey,
        paymentMethod: _paymentMethod,
        items: itemsPayload,
      );

      // Card / Online Payment: Launch PayHere gateway if params are present
      if (_paymentMethod == 'CARD') {
        if (order.payHereParams == null) {
          throw Exception('PayHere payment details could not be initialized by the server.');
        }

        final params = order.payHereParams!;
        final checkoutUrl = params['checkout_url']?.toString() ?? 'https://sandbox.payhere.lk/pay/checkout';
        final queryParams = params.map((k, v) => MapEntry(k, v.toString()));
        final launchUri = Uri.parse(checkoutUrl).replace(queryParameters: queryParams);

        try {
          await launchUrl(launchUri, mode: LaunchMode.externalApplication);
        } catch (_) {
          // Fallback if browser cannot open external app
        }

        if (!mounted) return;

        // Show payment verification modal
        final result = await showModalBottomSheet<String>(
          context: context,
          isDismissible: false,
          enableDrag: false,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (ctx) => _PaymentVerificationSheet(
            order: order,
            onRetryLaunch: () async {
              try {
                await launchUrl(launchUri, mode: LaunchMode.externalApplication);
              } catch (_) {}
            },
          ),
        );

        if (!mounted) return;

        if (result == 'COMPLETED') {
          // Payment confirmed by backend - clear cart and route to tracking
          ref.read(cartProvider.notifier).clearCart();
          setState(() => _loading = false);
          context.pushReplacement('/order-tracking?orderId=${order.id}&orderNumber=${order.orderNumber}');
        } else if (result == 'PENDING') {
          // Customer accepted pending authorization - clear cart and route to tracking
          ref.read(cartProvider.notifier).clearCart();
          setState(() => _loading = false);
          context.pushReplacement('/order-tracking?orderId=${order.id}&orderNumber=${order.orderNumber}&pending=true');
        } else {
          // Cancelled or Failed - cart is preserved!
          setState(() {
            _loading = false;
            _error = 'Payment was cancelled or unsuccessful. Your cart items are preserved so you can retry or select another payment method.';
          });
        }
      } else {
        // Cash on delivery: immediate confirmation
        ref.read(cartProvider.notifier).clearCart();
        if (!mounted) return;
        setState(() => _loading = false);
        context.pushReplacement('/order-tracking?orderId=${order.id}&orderNumber=${order.orderNumber}');
      }
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

    final deliveryFee = _serverCartData?['deliveryFee'] != null
        ? (_serverCartData!['deliveryFee'] as num).toDouble()
        : cart.getDeliveryFee(appState.orderType);

    final calculatedSubtotal = _serverCartData?['subtotal'] != null
        ? (_serverCartData!['subtotal'] as num).toDouble()
        : cart.subtotal;

    final grandTotal = (calculatedSubtotal + deliveryFee - cart.discount).clamp(0.0, double.infinity);

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
                    if (_cartNotices.isNotEmpty) ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFFDE68A)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: _cartNotices
                              .map((notice) => Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 2),
                                    child: Row(
                                      children: [
                                        const Icon(LucideIcons.info, size: 14, color: Color(0xFFD97706)),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            notice,
                                            style: const TextStyle(color: Color(0xFF92400E), fontSize: 12, fontWeight: FontWeight.w600),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ))
                              .toList(),
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
                              onTap: () {
                                ref.read(appProvider.notifier).setOrderType('DELIVERY');
                                _validateCartWithServer();
                              },
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
                              onTap: () {
                                ref.read(appProvider.notifier).setOrderType('PICKUP');
                                _validateCartWithServer();
                              },
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
                          loading: () => const LinearProgressIndicator(),
                          error: (_, __) => const Text('Error loading addresses', style: TextStyle(color: AppColors.red)),
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
                    // 3. Coupon & Promotional Code
                    _buildSectionCard(
                      title: 'Promo Code & Coupons',
                      icon: LucideIcons.ticket,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (cart.couponCode != null) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              decoration: BoxDecoration(
                                color: const Color(0xFFD1FAE5),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: const Color(0xFFA7F3D0)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      const Icon(LucideIcons.tag, size: 16, color: Color(0xFF059669)),
                                      const SizedBox(width: 8),
                                      Text(
                                        '${cart.couponCode} applied (-Rs. ${cart.discount.toStringAsFixed(0)})',
                                        style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF065F46), fontSize: 13),
                                      ),
                                    ],
                                  ),
                                  InkWell(
                                    onTap: _removeCoupon,
                                    child: const Icon(LucideIcons.x, size: 16, color: Color(0xFF065F46)),
                                  ),
                                ],
                              ),
                            ),
                          ] else ...[
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _couponCodeController,
                                    textCapitalization: TextCapitalization.characters,
                                    decoration: InputDecoration(
                                      hintText: 'Enter coupon code (e.g. TEZLAA20)',
                                      fillColor: AppColors.neutral100,
                                      filled: true,
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide.none,
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                SizedBox(
                                  height: 46,
                                  child: ElevatedButton(
                                    onPressed: _applyingCoupon ? null : _applyCoupon,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.primary,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                      elevation: 0,
                                    ),
                                    child: _applyingCoupon
                                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                        : const Text('Apply', style: TextStyle(fontWeight: FontWeight.w700)),
                                  ),
                                ),
                              ],
                            ),
                            if (_couponError != null) ...[
                              const SizedBox(height: 6),
                              Text(_couponError!, style: const TextStyle(color: AppColors.red, fontSize: 12, fontWeight: FontWeight.w600)),
                            ],
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // 4. Payment Method
                    _buildSectionCard(
                      title: 'Payment Method',
                      icon: LucideIcons.creditCard,
                      child: Column(
                        children: [
                          // ignore: deprecated_member_use
                          RadioListTile<String>(
                            value: 'CASH_ON_DELIVERY',
                            // ignore: deprecated_member_use
                            groupValue: _paymentMethod,
                            // ignore: deprecated_member_use
                            onChanged: (val) {
                              if (val != null) setState(() => _paymentMethod = val);
                            },
                            title: const Text('Cash On Delivery (COD)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                            subtitle: const Text('Pay with cash upon delivery or pickup', style: TextStyle(fontSize: 12, color: AppColors.neutral500)),
                            contentPadding: EdgeInsets.zero,
                          ),
                          const Divider(height: 1, color: AppColors.neutral100),
                          // ignore: deprecated_member_use
                          RadioListTile<String>(
                            value: 'CARD',
                            // ignore: deprecated_member_use
                            groupValue: _paymentMethod,
                            // ignore: deprecated_member_use
                            onChanged: (val) {
                              if (val != null) setState(() => _paymentMethod = val);
                            },
                            title: const Text('Credit / Debit Card (PayHere Online)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                            subtitle: const Text('Visa, Mastercard, Amex, Genie sandbox', style: TextStyle(fontSize: 12, color: AppColors.neutral500)),
                            contentPadding: EdgeInsets.zero,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // 5. Notes & Instructions
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
                    // 6. Payment Breakdown
                    _buildSectionCard(
                      title: 'Payment Breakdown',
                      icon: LucideIcons.receipt,
                      child: Column(
                        children: [
                          if (_validatingCart)
                            const Padding(
                              padding: EdgeInsets.symmetric(vertical: 4),
                              child: LinearProgressIndicator(color: AppColors.primary),
                            ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Subtotal', style: TextStyle(fontSize: 13, color: AppColors.neutral500)),
                              Text('Rs. ${calculatedSubtotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
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
                          if (cart.discount > 0) ...[
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Discount (${cart.couponCode})', style: const TextStyle(fontSize: 13, color: AppColors.green, fontWeight: FontWeight.w600)),
                                Text('-Rs. ${cart.discount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.green)),
                              ],
                            ),
                          ],
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
                title: _paymentMethod == 'CARD'
                    ? 'Pay with PayHere — Rs. ${grandTotal.toStringAsFixed(0)}'
                    : 'Place Order — Rs. ${grandTotal.toStringAsFixed(0)}',
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

class _PaymentVerificationSheet extends StatefulWidget {
  final OrderModel order;
  final VoidCallback onRetryLaunch;

  const _PaymentVerificationSheet({
    required this.order,
    required this.onRetryLaunch,
  });

  @override
  State<_PaymentVerificationSheet> createState() => _PaymentVerificationSheetState();
}

class _PaymentVerificationSheetState extends State<_PaymentVerificationSheet> {
  bool _checking = false;
  String _status = 'INITIAL'; // INITIAL, PENDING, COMPLETED, FAILED, CANCELLED
  String? _message;

  @override
  void initState() {
    super.initState();
    _checkStatus();
  }

  Future<void> _checkStatus() async {
    if (_checking) return;
    setState(() {
      _checking = true;
      _message = null;
    });

    try {
      final res = await PaymentService().getPaymentStatus(widget.order.id);
      final paymentStatus = res['paymentStatus']?.toString() ?? 'PENDING';

      if (!mounted) return;

      if (paymentStatus == 'COMPLETED') {
        setState(() {
          _status = 'COMPLETED';
          _checking = false;
          _message = 'Payment successfully confirmed!';
        });
        await Future.delayed(const Duration(milliseconds: 600));
        if (mounted) Navigator.of(context).pop('COMPLETED');
      } else if (paymentStatus == 'CANCELLED') {
        setState(() {
          _status = 'CANCELLED';
          _checking = false;
          _message = 'Payment was cancelled.';
        });
      } else if (paymentStatus == 'FAILED') {
        setState(() {
          _status = 'FAILED';
          _checking = false;
          _message = 'Payment failed. Please retry or choose another payment method.';
        });
      } else {
        // PENDING
        setState(() {
          _status = 'PENDING';
          _checking = false;
          _message = 'Payment is awaiting authorization from the gateway.';
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _checking = false;
        _message = 'Could not verify payment status yet. Please check your network or tap check again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 48,
              height: 5,
              decoration: BoxDecoration(
                color: AppColors.neutral300,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(LucideIcons.creditCard, color: AppColors.primary),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'PayHere Online Payment',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.neutral900),
                    ),
                    Text(
                      'Order #${widget.order.orderNumber} • LKR ${widget.order.grandTotal.toStringAsFixed(2)}',
                      style: const TextStyle(fontSize: 13, color: AppColors.neutral500),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.neutral50,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.neutral200),
            ),
            child: Column(
              children: [
                if (_checking)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                        SizedBox(width: 12),
                        Text('Checking payment status...', style: TextStyle(fontSize: 14, color: AppColors.neutral600)),
                      ],
                    ),
                  )
                else ...[
                  Icon(
                    _status == 'COMPLETED'
                        ? LucideIcons.checkCircle2
                        : _status == 'PENDING'
                            ? LucideIcons.clock
                            : _status == 'CANCELLED' || _status == 'FAILED'
                                ? LucideIcons.alertCircle
                                : LucideIcons.externalLink,
                    size: 32,
                    color: _status == 'COMPLETED'
                        ? Colors.green
                        : _status == 'PENDING'
                            ? Colors.amber.shade700
                            : _status == 'CANCELLED' || _status == 'FAILED'
                                ? Colors.red
                                : AppColors.primary,
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _message ?? 'Please complete payment in the PayHere gateway window.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, color: AppColors.neutral700, height: 1.4),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),
          if (_status == 'PENDING') ...[
            ElevatedButton(
              onPressed: _checking ? null : _checkStatus,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Check Again', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop('PENDING'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Proceed with Pending Authorization', style: TextStyle(fontSize: 14)),
            ),
          ] else if (_status == 'CANCELLED' || _status == 'FAILED') ...[
            ElevatedButton(
              onPressed: () {
                widget.onRetryLaunch();
                _checkStatus();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Retry Gateway Payment', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop('FAILED'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Return to Cart', style: TextStyle(fontSize: 14)),
            ),
          ] else ...[
            ElevatedButton(
              onPressed: _checking ? null : _checkStatus,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text("I've Completed Payment", style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: widget.onRetryLaunch,
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Re-open Gateway', style: TextStyle(fontSize: 13)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).pop('CANCELLED'),
                    child: const Text('Cancel & Return', style: TextStyle(fontSize: 13, color: AppColors.neutral600)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
