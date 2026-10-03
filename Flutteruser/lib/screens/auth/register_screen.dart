import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_typography.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/tezlaa_logo.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  final _nameFocusNode = FocusNode();
  final _emailFocusNode = FocusNode();
  final _phoneFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();

  bool _obscurePassword = true;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _nameFocusNode.addListener(() => setState(() {}));
    _emailFocusNode.addListener(() => setState(() {}));
    _phoneFocusNode.addListener(() => setState(() {}));
    _passwordFocusNode.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _nameFocusNode.dispose();
    _emailFocusNode.dispose();
    _phoneFocusNode.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text;

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please fill in all required fields.');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    final success = await ref.read(authProvider.notifier).register(
      name,
      email,
      password,
      phone: phone.isNotEmpty ? phone : null,
    );

    if (!mounted) return;
    setState(() => _loading = false);

    if (success) {
      context.push('/verify-account?email=${Uri.encodeComponent(email)}');
    } else {
      setState(() {
        _error = ref.read(authProvider).error ?? 'Registration failed. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Color(0xFF0F172A), size: 22),
          onPressed: () => context.pop(),
        ),
      ),
      body: Stack(
        children: [
          // Background ambient soft glow
          Positioned(
            top: -60,
            right: -60,
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFFFDEEE8).withValues(alpha: 0.9),
                    Colors.white.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 420),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Top Brand Logo with Soft Glow
                      Container(
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Color.fromRGBO(242, 92, 39, 0.2),
                              offset: Offset(0, 6),
                              blurRadius: 16,
                            ),
                          ],
                        ),
                        child: Image.asset(
                          'assets/images/logo.png',
                          width: 72,
                          height: 72,
                          fit: BoxFit.contain,
                          errorBuilder: (_, __, ___) => const TezlaaLogo(size: 72),
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Title & Subtitle
                      const Text(
                        'Join TEZLAA',
                        style: TextStyle(
                          fontFamily: AppTypography.serifFont,
                          fontFamilyFallback: ['serif'],
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Unlock 50 Welcome Points & Exclusive Perks',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 12),
                      // Card Container
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                          boxShadow: const [
                            BoxShadow(
                              color: Color.fromRGBO(15, 23, 42, 0.04),
                              offset: Offset(0, 4),
                              blurRadius: 16,
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Error Banner
                            if (_error != null) ...[
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF2F2),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: const Color(0xFFFCA5A5), width: 1.2),
                                ),
                                child: Text(
                                  _error!,
                                  style: const TextStyle(
                                    color: Color(0xFFDC2626),
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                              const SizedBox(height: 10),
                            ],
                            // Full Name Field
                            _buildInputField(
                              label: 'Full Name *',
                              controller: _nameController,
                              focusNode: _nameFocusNode,
                              hint: 'e.g. Maya Perera',
                              icon: LucideIcons.user,
                            ),
                            const SizedBox(height: 8),
                            // Email Address Field
                            _buildInputField(
                              label: 'Email Address *',
                              controller: _emailController,
                              focusNode: _emailFocusNode,
                              hint: 'e.g. maya@example.com',
                              icon: LucideIcons.mail,
                              keyboardType: TextInputType.emailAddress,
                            ),
                            const SizedBox(height: 8),
                            // Mobile Number Field
                            _buildInputField(
                              label: 'Mobile Number (Optional)',
                              controller: _phoneController,
                              focusNode: _phoneFocusNode,
                              hint: 'e.g. +94 77 123 4567',
                              icon: LucideIcons.phone,
                              keyboardType: TextInputType.phone,
                            ),
                            const SizedBox(height: 8),
                            // Password Field
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Password *',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF334155),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: _passwordFocusNode.hasFocus
                                          ? AppColors.primary
                                          : const Color(0xFFE2E8F0),
                                      width: _passwordFocusNode.hasFocus ? 1.5 : 1.2,
                                    ),
                                    boxShadow: _passwordFocusNode.hasFocus
                                        ? [
                                            const BoxShadow(
                                              color: Color.fromRGBO(242, 92, 39, 0.12),
                                              offset: Offset(0, 3),
                                              blurRadius: 8,
                                            ),
                                          ]
                                        : const [
                                            BoxShadow(
                                              color: Color.fromRGBO(15, 23, 42, 0.02),
                                              offset: Offset(0, 1),
                                              blurRadius: 3,
                                            ),
                                          ],
                                  ),
                                  child: TextField(
                                    controller: _passwordController,
                                    focusNode: _passwordFocusNode,
                                    obscureText: _obscurePassword,
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w500,
                                      color: Color(0xFF0F172A),
                                    ),
                                    decoration: InputDecoration(
                                      hintText: 'At least 6 characters',
                                      hintStyle: const TextStyle(
                                        color: Color(0xFF94A3B8),
                                        fontSize: 13,
                                      ),
                                      prefixIcon: Icon(
                                        LucideIcons.lock,
                                        size: 17,
                                        color: _passwordFocusNode.hasFocus
                                            ? AppColors.primary
                                            : const Color(0xFF94A3B8),
                                      ),
                                      suffixIcon: TextButton(
                                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                        child: Text(
                                          _obscurePassword ? 'Show' : 'Hide',
                                          style: const TextStyle(
                                            color: AppColors.primary,
                                            fontSize: 12,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                      border: InputBorder.none,
                                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            // Create Account CTA Button
                            Container(
                              width: double.infinity,
                              height: 46,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFFF25C27), Color(0xFFEA580C)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color.fromRGBO(242, 92, 39, 0.32),
                                    offset: Offset(0, 6),
                                    blurRadius: 14,
                                  ),
                                ],
                              ),
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: _loading ? null : _handleRegister,
                                  borderRadius: BorderRadius.circular(14),
                                  child: Center(
                                    child: _loading
                                        ? const SizedBox(
                                            width: 20,
                                            height: 20,
                                            child: CircularProgressIndicator(
                                              color: Colors.white,
                                              strokeWidth: 2.2,
                                            ),
                                          )
                                        : const Text(
                                            'Create Account',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 14,
                                              fontWeight: FontWeight.w700,
                                              letterSpacing: 0.2,
                                            ),
                                          ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Already have account footer
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            'Already have an account? ',
                            style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                          ),
                          GestureDetector(
                            onTap: () => context.pop(),
                            child: const Text(
                              'Sign In',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    required FocusNode focusNode,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    final isFocused = focusNode.hasFocus;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Color(0xFF334155),
          ),
        ),
        const SizedBox(height: 6),
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isFocused ? AppColors.primary : const Color(0xFFE2E8F0),
              width: isFocused ? 1.5 : 1.2,
            ),
            boxShadow: isFocused
                ? [
                    const BoxShadow(
                      color: Color.fromRGBO(242, 92, 39, 0.12),
                      offset: Offset(0, 3),
                      blurRadius: 10,
                    ),
                  ]
                : const [
                    BoxShadow(
                      color: Color.fromRGBO(15, 23, 42, 0.02),
                      offset: Offset(0, 1),
                      blurRadius: 4,
                    ),
                  ],
          ),
          child: TextField(
            controller: controller,
            focusNode: focusNode,
            keyboardType: keyboardType,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: Color(0xFF0F172A),
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 14,
              ),
              prefixIcon: Icon(
                icon,
                size: 18,
                color: isFocused ? AppColors.primary : const Color(0xFF94A3B8),
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
        ),
      ],
    );
  }
}
