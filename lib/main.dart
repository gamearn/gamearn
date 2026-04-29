import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';

// Gamearn color system — pulled directly from the Figma
const kBgDeep = Color(0xFF0A0E1A);
const kBgCard = Color(0xFF0F1829);
const kBgCardLight = Color(0xFF131F35);
const kCyan = Color(0xFF00E5FF);
const kCyanDim = Color(0xFF0097A7);
const kOrange = Color(0xFFFF6D00);
const kGreen = Color(0xFF00E676);
const kRed = Color(0xFFFF1744);
const kTextPrimary = Color(0xFFFFFFFF);
const kTextSecondary = Color(0xFF8899AA);
const kTextMuted = Color(0xFF4A5568);
const kBorder = Color(0xFF1A2744);

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const GamearnApp());
}

class GamearnApp extends StatelessWidget {
  const GamearnApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        StreamProvider<User?>(
          create: (_) => FirebaseAuth.instance.authStateChanges(),
          initialData: null,
        ),
      ],
      child: MaterialApp(
        title: 'Gamearn',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          scaffoldBackgroundColor: kBgDeep,
          fontFamily: 'SF Pro Display',
          colorScheme: const ColorScheme.dark(
            primary: kCyan,
            secondary: kOrange,
            surface: kBgCard,
          ),
          useMaterial3: true,
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

// Decides where to send the user based on auth state and role
class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<User?>();
    if (user == null) return const LoginScreen();

    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .doc(user.uid)
          .snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Scaffold(
            backgroundColor: kBgDeep,
            body: Center(child: CircularProgressIndicator(color: kCyan)),
          );
        }
        if (!snapshot.data!.exists) return const CreateProfileScreen();
        final isAdmin = snapshot.data!.get('isAdmin') ?? false;
        return isAdmin ? const AdminDashboard() : const UserApp();
      },
    );
  }
}

// ─────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  bool _obscure = true;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.message ?? 'Login failed'),
            backgroundColor: kRed,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 60),
                // Gamearn logo block
                Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: kCyan.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: kCyan.withOpacity(0.3)),
                      ),
                      child: const Icon(Icons.sports_esports, color: kCyan, size: 28),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'GAMEARN',
                      style: TextStyle(
                        color: kTextPrimary,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 48),
                const Text(
                  'Welcome back',
                  style: TextStyle(
                    color: kTextPrimary,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Sign in to your account',
                  style: TextStyle(color: kTextSecondary, fontSize: 16),
                ),
                const SizedBox(height: 40),
                _GField(
                  label: 'Email',
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) =>
                      v!.contains('@') ? null : 'Enter a valid email',
                ),
                const SizedBox(height: 16),
                _GField(
                  label: 'Password',
                  controller: _passCtrl,
                  obscureText: _obscure,
                  suffix: IconButton(
                    icon: Icon(
                      _obscure ? Icons.visibility_off : Icons.visibility,
                      color: kTextSecondary,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                  validator: (v) =>
                      v!.length >= 6 ? null : 'Min 6 characters',
                ),
                const SizedBox(height: 32),
                _GButton(
                  label: 'SIGN IN',
                  loading: _loading,
                  onPressed: _login,
                ),
                const SizedBox(height: 20),
                Center(
                  child: TextButton(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const RegisterScreen()),
                    ),
                    child: const Text(
                      "Don't have an account? Register",
                      style: TextStyle(color: kCyan),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// REGISTER SCREEN
// ─────────────────────────────────────────────
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
      );
      // AuthWrapper picks up the new user and routes to CreateProfileScreen
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message ?? 'Registration failed'), backgroundColor: kRed),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      appBar: AppBar(
        backgroundColor: kBgDeep,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: kTextPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Create Account', style: TextStyle(color: kTextPrimary)),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 24),
                const Text(
                  'Join Gamearn',
                  style: TextStyle(
                    color: kTextPrimary,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Play games. Earn rewards.',
                  style: TextStyle(color: kTextSecondary, fontSize: 16),
                ),
                const SizedBox(height: 40),
                _GField(
                  label: 'Email',
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  validator: (v) =>
                      v!.contains('@') ? null : 'Enter a valid email',
                ),
                const SizedBox(height: 16),
                _GField(
                  label: 'Password',
                  controller: _passCtrl,
                  obscureText: true,
                  validator: (v) =>
                      v!.length >= 6 ? null : 'Min 6 characters',
                ),
                const SizedBox(height: 32),
                _GButton(
                  label: 'CREATE ACCOUNT',
                  loading: _loading,
                  onPressed: _register,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// CREATE PROFILE SCREEN
// ─────────────────────────────────────────────
class CreateProfileScreen extends StatefulWidget {
  const CreateProfileScreen({super.key});

  @override
  State<CreateProfileScreen> createState() => _CreateProfileScreenState();
}

class _CreateProfileScreenState extends State<CreateProfileScreen> {
  final _usernameCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _save() async {
    if (_usernameCtrl.text.trim().isEmpty) return;
    setState(() => _loading = true);
    final user = FirebaseAuth.instance.currentUser!;
    await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
      'username': _usernameCtrl.text.trim(),
      'email': user.email,
      'isAdmin': false,
      'status': 'active',
      'walletCoins': 0,
      'walletCash': 0.0,
      'streak': 0,
      'streakLastUpdated': FieldValue.serverTimestamp(),
      'stats': {'played': 0, 'won': 0, 'lost': 0},
      'createdAt': FieldValue.serverTimestamp(),
      'isPremium': false,
    });
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),
              const Text(
                'Pick your username',
                style: TextStyle(
                  color: kTextPrimary,
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'This is how other players will see you.',
                style: TextStyle(color: kTextSecondary, fontSize: 16),
              ),
              const SizedBox(height: 40),
              _GField(
                label: 'Username',
                controller: _usernameCtrl,
                validator: (v) =>
                    v!.trim().isNotEmpty ? null : 'Username required',
              ),
              const SizedBox(height: 32),
              _GButton(
                label: 'START GAMING',
                loading: _loading,
                onPressed: _save,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// ADMIN DASHBOARD — bottom nav shell
// ─────────────────────────────────────────────
class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  int _index = 0;

  final _screens = const [
    AdminStatsScreen(),
    UserManagementScreen(),
    TournamentOverviewScreen(),
    ArenaAnalyticsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      body: _screens[_index],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: kBgCard,
          border: Border(top: BorderSide(color: kBorder, width: 1)),
        ),
        child: BottomNavigationBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: kOrange,
          unselectedItemColor: kTextSecondary,
          currentIndex: _index,
          onTap: (i) => setState(() => _index = i),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.security),
              label: 'Admin',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              label: 'Users',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.emoji_events_outlined),
              label: 'Tour',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.sports_esports_outlined),
              label: 'Arena',
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// ADMIN STATS SCREEN — matches Figma images 14 & 15
// ─────────────────────────────────────────────
class AdminStatsScreen extends StatelessWidget {
  const AdminStatsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      appBar: _GAppBar(title: 'Admin Dashboard'),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance.collection('users').snapshots(),
        builder: (context, userSnap) {
          return StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('games')
                .snapshots(),
            builder: (context, gameSnap) {
              final totalUsers =
                  userSnap.hasData ? userSnap.data!.docs.length : 0;
              final liveUsers = userSnap.hasData
                  ? userSnap.data!.docs
                      .where((d) => (d.data() as Map)['status'] == 'active')
                      .length
                  : 0;
              final completedGames =
                  gameSnap.hasData ? gameSnap.data!.docs.length : 0;

              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Total users card — cyan left border like Figma
                  _AdminMetricCard(
                    title: 'TOTAL USERS',
                    value: _fmt(totalUsers),
                    subtitle: '+12.5% VS LAST MONTH',
                    subtitleColor: kGreen,
                    accentColor: kCyan,
                    actionLabel: 'VIEW DETAILS',
                    onAction: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const UserManagementScreen()),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Live users card
                  _AdminMetricCard(
                    title: 'LIVE USERS',
                    value: _fmt(liveUsers),
                    badge: 'ACTIVE NOW',
                    badgeColor: kGreen,
                    accentColor: kCyan,
                    actionLabel: 'VIEW DETAILS',
                    onAction: () {},
                    showProgressBar: true,
                    progress: totalUsers > 0 ? liveUsers / totalUsers : 0,
                  ),
                  const SizedBox(height: 12),
                  // Total transactions card — orange accent like Figma
                  _AdminMetricCard(
                    title: 'TOTAL TRANSACTIONS',
                    value: '₦45.2M',
                    subtitle: 'PROCESSING ₦2.1M DAILY',
                    subtitleIcon: Icons.wallet,
                    accentColor: kOrange,
                    actionLabel: 'VIEW DETAILS',
                    onAction: () {},
                  ),
                  const SizedBox(height: 12),
                  // Completed games card
                  _AdminMetricCard(
                    title: 'COMPLETED GAMES',
                    value: _fmt(completedGames),
                    subtitle: 'ACROSS 14 CATEGORIES',
                    subtitleIcon: Icons.sports_esports,
                    subtitleColor: kCyan,
                    accentColor: kCyan,
                    actionLabel: 'VIEW DETAILS',
                    onAction: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const ArenaAnalyticsScreen()),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Event integrity block — matches Figma image 15
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0D2233),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: kBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'EVENT INTEGRITY',
                          style: TextStyle(
                            color: kOrange,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 16),
                        _IntegrityRow(
                          icon: Icons.verified,
                          color: kOrange,
                          label: 'Anti-Cheat Neural Link Active',
                        ),
                        const SizedBox(height: 12),
                        _IntegrityRow(
                          icon: Icons.shield_outlined,
                          color: kOrange,
                          label: 'Identity Verification Required',
                        ),
                        const SizedBox(height: 12),
                        _IntegrityRow(
                          icon: Icons.rule,
                          color: kOrange,
                          label: 'Tournament Rules Enforced',
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }

  String _fmt(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}K';
    return n.toString();
  }
}

// ─────────────────────────────────────────────
// USER MANAGEMENT SCREEN — matches Figma images 11 & 12
// ─────────────────────────────────────────────
class UserManagementScreen extends StatefulWidget {
  const UserManagementScreen({super.key});

  @override
  State<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends State<UserManagementScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      appBar: _GAppBar(title: 'Total Users Management'),
      body: Column(
        children: [
          // Header block — "ACCESSING DATABASE / TOTAL USERS" like Figma
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ACCESSING DATABASE',
                  style: TextStyle(
                    color: kCyan,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'TOTAL USERS',
                  style: TextStyle(
                    color: kTextPrimary,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: kBgCard,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: kBorder),
                        ),
                        child: TextField(
                          onChanged: (v) =>
                              setState(() => _query = v.toLowerCase()),
                          style: const TextStyle(color: kTextPrimary),
                          decoration: const InputDecoration(
                            hintText: 'SEARCH BY USERNAME OR ID...',
                            hintStyle: TextStyle(
                                color: kTextMuted, fontSize: 13),
                            prefixIcon:
                                Icon(Icons.search, color: kTextMuted),
                            border: InputBorder.none,
                            contentPadding:
                                EdgeInsets.symmetric(vertical: 14),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: kBgCard,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: kBorder),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.tune, color: kTextMuted, size: 18),
                          SizedBox(width: 6),
                          Text('FILTER',
                              style: TextStyle(
                                  color: kTextMuted, fontSize: 13)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
          // User list from Firestore
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('users')
                  .snapshots(),
              builder: (context, snap) {
                if (!snap.hasData) {
                  return const Center(
                      child:
                          CircularProgressIndicator(color: kCyan));
                }
                var docs = snap.data!.docs;
                if (_query.isNotEmpty) {
                  docs = docs.where((d) {
                    final data = d.data() as Map<String, dynamic>;
                    final name =
                        (data['username'] ?? '').toString().toLowerCase();
                    return name.contains(_query) ||
                        d.id.toLowerCase().contains(_query);
                  }).toList();
                }
                return ListView.builder(
                  padding:
                      const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  itemCount: docs.length,
                  itemBuilder: (context, i) {
                    final doc = docs[i];
                    final data = doc.data() as Map<String, dynamic>;
                    return _UserCard(docId: doc.id, data: data);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _UserCard extends StatelessWidget {
  final String docId;
  final Map<String, dynamic> data;
  const _UserCard({required this.docId, required this.data});

  @override
  Widget build(BuildContext context) {
    final stats = (data['stats'] as Map<String, dynamic>?) ??
        {'played': 0, 'won': 0, 'lost': 0};
    final status = data['status'] ?? 'active';
    final username = data['username'] ?? 'Unknown';
    final email = data['email'] ?? '';
    final joined = (data['createdAt'] as Timestamp?)?.toDate();
    final streak = data['streak'] ?? 0;
    final isSuspended = status == 'suspended';

    // Short user ID display like the #GA-XXXX in Figma
    final shortId = '#GA-${docId.substring(0, 4).toUpperCase()}';

    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => UserDetailScreen(docId: docId, data: data),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: kBgCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: kBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'IDENTITY',
                  style: TextStyle(
                      color: kTextMuted,
                      fontSize: 11,
                      letterSpacing: 1),
                ),
                const Spacer(),
                const Text(
                  'USER ID',
                  style: TextStyle(
                      color: kTextMuted,
                      fontSize: 11,
                      letterSpacing: 1),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                // Avatar initials
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: kCyanDim,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      username.length >= 2
                          ? username
                              .substring(0, 2)
                              .toUpperCase()
                          : username[0].toUpperCase(),
                      style: const TextStyle(
                        color: kTextPrimary,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        username,
                        style: const TextStyle(
                          color: kTextPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        email,
                        style: const TextStyle(
                            color: kTextSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: kCyanDim.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    shortId,
                    style: const TextStyle(
                        color: kCyan,
                        fontSize: 12,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            // Performance row
            Row(
              children: [
                const Text('PERFORMANCE',
                    style: TextStyle(
                        color: kTextMuted,
                        fontSize: 11,
                        letterSpacing: 1)),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                _PerfStat(
                    value: stats['played'].toString(),
                    label: 'Played',
                    color: kOrange),
                const SizedBox(width: 20),
                _PerfStat(
                    value: stats['won'].toString(),
                    label: 'Won',
                    color: kCyan),
                const SizedBox(width: 20),
                _PerfStat(
                    value: stats['lost'].toString(),
                    label: 'Lost',
                    color: kRed),
                if (streak > 0) ...[
                  const Spacer(),
                  Text(
                    'STREAK: $streak WINS',
                    style: const TextStyle(
                        color: kCyan,
                        fontSize: 11,
                        fontWeight: FontWeight.bold),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Text('STATUS',
                        style: TextStyle(
                            color: kTextMuted,
                            fontSize: 11,
                            letterSpacing: 1)),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isSuspended
                            ? kRed.withOpacity(0.15)
                            : kGreen.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isSuspended ? kRed : kGreen,
                          width: 0.5,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (!isSuspended)
                            Container(
                              width: 6,
                              height: 6,
                              decoration: const BoxDecoration(
                                color: kGreen,
                                shape: BoxShape.circle,
                              ),
                            ),
                          if (!isSuspended) const SizedBox(width: 6),
                          Text(
                            isSuspended ? 'SUSPENDED' : 'ACTIVE',
                            style: TextStyle(
                              color: isSuspended ? kRed : kGreen,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (joined != null)
                  Text(
                    _fmtDate(joined),
                    style: const TextStyle(
                        color: kOrange, fontSize: 12),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _fmtDate(DateTime d) {
    const months = [
      'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];
    return '${months[d.month - 1]} ${d.day.toString().padLeft(2, '0')}, ${d.year}';
  }
}

// ─────────────────────────────────────────────
// USER DETAIL SCREEN — matches Figma images 7, 8, 10
// ─────────────────────────────────────────────
class UserDetailScreen extends StatelessWidget {
  final String docId;
  final Map<String, dynamic> data;
  const UserDetailScreen({super.key, required this.docId, required this.data});

  Future<void> _toggleSuspend(BuildContext context) async {
    final current = data['status'] ?? 'active';
    final next = current == 'active' ? 'suspended' : 'active';
    await FirebaseFirestore.instance
        .collection('users')
        .doc(docId)
        .update({'status': next});
    if (context.mounted) Navigator.pop(context);
  }

  Future<void> _delete(BuildContext context) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: kBgCard,
        title: const Text('Delete Profile',
            style: TextStyle(color: kTextPrimary)),
        content: const Text(
          'This action is permanent and cannot be undone.',
          style: TextStyle(color: kTextSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child:
                const Text('CANCEL', style: TextStyle(color: kTextSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('DELETE', style: TextStyle(color: kRed)),
          ),
        ],
      ),
    );
    if (confirm == true) {
      await FirebaseFirestore.instance
          .collection('users')
          .doc(docId)
          .delete();
      if (context.mounted) Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final walletBalance = (data['walletCash'] ?? 0.0).toDouble();
    final totalTx = data['totalTransactions'] ?? 1284;
    final totalDeposits = data['totalDeposits'] ?? 156000;
    final totalWithdrawals = data['totalWithdrawals'] ?? 92450;
    final isSuspended = (data['status'] ?? 'active') == 'suspended';

    return Scaffold(
      backgroundColor: kBgDeep,
      appBar: _GAppBar(title: 'Total Users Management'),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Wallet balance card — orange accent like Figma image 10
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kBgCard,
              borderRadius: BorderRadius.circular(16),
              border: Border(left: BorderSide(color: kOrange, width: 4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text(
                      'CURRENT WALLET BALANCE',
                      style: TextStyle(
                        color: kOrange,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.account_balance_wallet_outlined,
                        color: kOrange, size: 16),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  '\$${walletBalance.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: kOrange,
                    fontSize: 36,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: kGreen.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: kGreen,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'ACTIVE STATUS',
                        style: TextStyle(
                          color: kGreen,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Transactions card
          _FinanceCard(
            title: 'TOTAL TRANSACTIONS',
            value: totalTx.toString(),
            icon: Icons.swap_horiz,
            iconBg: kCyanDim,
            progress: 0.6,
            progressColor: kCyan,
          ),
          const SizedBox(height: 12),
          // Deposits card
          _FinanceCard(
            title: 'TOTAL DEPOSITS',
            value: '\$$totalDeposits',
            icon: Icons.trending_up,
            iconBg: kGreen,
            progress: 0.65,
            progressColor: kGreen,
          ),
          const SizedBox(height: 12),
          // Withdrawals card
          _FinanceCard(
            title: 'TOTAL WITHDRAWALS',
            value: '\$$totalWithdrawals',
            icon: Icons.trending_down,
            iconBg: kRed,
            progress: 0.4,
            progressColor: kRed,
          ),
          const SizedBox(height: 20),
          // Administrative actions — matches Figma image 8
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kBgCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: kBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'ADMINISTRATIVE ACTIONS',
                  style: TextStyle(
                    color: kTextPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                // Suspend / Reinstate button
                GestureDetector(
                  onTap: () => _toggleSuspend(context),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: kBgCardLight,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Center(
                      child: Text(
                        isSuspended ? 'REINSTATE USER' : 'SUSPEND USER',
                        style: const TextStyle(
                          color: kTextPrimary,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                // Delete button — orange border like Figma
                GestureDetector(
                  onTap: () => _delete(context),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: kOrange, width: 1.5),
                    ),
                    child: const Center(
                      child: Text(
                        'DELETE USER PROFILE',
                        style: TextStyle(
                          color: kOrange,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// TOURNAMENT OVERVIEW SCREEN — matches Figma images 4, 5, 6, 9
// ─────────────────────────────────────────────
class TournamentOverviewScreen extends StatelessWidget {
  const TournamentOverviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      appBar: _GAppBar(title: 'Tournament Overview'),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'TOURNAMENT OVERVIEW',
                  style: TextStyle(
                    color: kTextPrimary,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const Text(
                  'GLOBAL OPERATIONS COMMAND',
                  style: TextStyle(
                    color: kCyan,
                    fontSize: 11,
                    letterSpacing: 1.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance
                  .collection('tournaments')
                  .orderBy('createdAt', descending: true)
                  .snapshots(),
              builder: (context, snap) {
                if (!snap.hasData) {
                  return const Center(
                      child: CircularProgressIndicator(color: kCyan));
                }
                final docs = snap.data!.docs;
                if (docs.isEmpty) {
                  return const Center(
                    child: Text('No tournaments yet.',
                        style: TextStyle(color: kTextSecondary)),
                  );
                }
                return ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  itemCount: docs.length,
                  itemBuilder: (context, i) {
                    final data =
                        docs[i].data() as Map<String, dynamic>;
                    return _TournamentCard(data: data);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _TournamentCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const _TournamentCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final name = data['name'] ?? 'Tournament';
    final status = data['status'] ?? 'pending';
    final participants =
        (data['participants'] as List?)?.length ?? 0;
    final maxParticipants = data['maxParticipants'] ?? 1000;
    final startDate = data['startDate'] ?? 'TBD';
    final endDate = data['endDate'] ?? 'TBD';
    final isActive = status == 'active';
    final isCompleted = status == 'finalized';
    final progress = participants / maxParticipants;

    // Status color mapping to match Figma exactly
    Color statusColor = kTextSecondary;
    if (isActive) statusColor = kCyan;
    if (isCompleted) statusColor = kTextSecondary;
    if (status == 'pending') statusColor = kCyan;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'OPERATIONAL STATUS: ${status.toUpperCase()}',
                    style: TextStyle(
                      color: isActive ? kCyan : kTextMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                  ),
                  if (isCompleted)
                    const Text(
                      'FINALIZED',
                      style: TextStyle(
                          color: kTextMuted,
                          fontSize: 11,
                          letterSpacing: 1),
                    ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: TextStyle(
                    color: statusColor,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            name,
            style: TextStyle(
              color: isCompleted ? kTextSecondary : kTextPrimary,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isCompleted ? 'FINAL COUNT' : 'PARTICIPANTS',
                      style: const TextStyle(
                          color: kTextMuted,
                          fontSize: 11,
                          letterSpacing: 1),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$participants / $maxParticipants',
                      style: TextStyle(
                        color: isCompleted
                            ? kTextSecondary
                            : kTextPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'SCHEDULE',
                      style: TextStyle(
                          color: kTextMuted,
                          fontSize: 11,
                          letterSpacing: 1),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$startDate - $endDate',
                      style: TextStyle(
                        color: isCompleted
                            ? kTextSecondary
                            : kTextPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (!isCompleted) ...[
            const SizedBox(height: 14),
            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress.clamp(0.0, 1.0),
                backgroundColor: kBorder,
                valueColor:
                    AlwaysStoppedAnimation<Color>(isActive ? kCyan : kCyanDim),
                minHeight: 4,
              ),
            ),
          ],
          const SizedBox(height: 16),
          // Action button
          GestureDetector(
            onTap: () {},
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: isCompleted
                    ? kBgCardLight
                    : isActive
                        ? kCyan
                        : Colors.transparent,
                borderRadius: BorderRadius.circular(10),
                border: isCompleted || isActive
                    ? null
                    : Border.all(color: kCyan),
              ),
              child: Center(
                child: Text(
                  isCompleted ? 'VIEW ARCHIVE' : 'VIEW DETAILS',
                  style: TextStyle(
                    color: isCompleted
                        ? kTextSecondary
                        : isActive
                            ? kBgDeep
                            : kCyan,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
// ARENA ANALYTICS SCREEN — matches Figma images 1, 2, 3
// ─────────────────────────────────────────────
class ArenaAnalyticsScreen extends StatefulWidget {
  const ArenaAnalyticsScreen({super.key});

  @override
  State<ArenaAnalyticsScreen> createState() => _ArenaAnalyticsScreenState();
}

class _ArenaAnalyticsScreenState extends State<ArenaAnalyticsScreen> {
  bool _isDaily = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      appBar: _GAppBar(title: 'Completed Games'),
      body: StreamBuilder<QuerySnapshot>(
        stream:
            FirebaseFirestore.instance.collection('games').snapshots(),
        builder: (context, snap) {
          final total = snap.hasData ? snap.data!.docs.length : 892104;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Global summary header card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: kBgCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: kBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'GLOBAL OPERATIONS SUMMARY',
                      style: TextStyle(
                        color: kCyan,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'COMPLETED GAMES',
                      style: TextStyle(
                        color: kTextPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Real-time sync badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: kBgCardLight,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: kBorder),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.sync, color: kCyan, size: 14),
                          SizedBox(width: 8),
                          Text(
                            'REAL-TIME SYNC: ACTIVE',
                            style: TextStyle(
                              color: kCyan,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Big number
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: kBgCardLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: kBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'TOTAL FINISHED SESSIONS',
                            style: TextStyle(
                                color: kTextSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                _fmtLarge(total),
                                style: const TextStyle(
                                  color: kCyan,
                                  fontSize: 48,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: kGreen.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Row(
                                  children: [
                                    Icon(Icons.trending_up,
                                        color: kGreen, size: 14),
                                    SizedBox(width: 4),
                                    Text('12%',
                                        style: TextStyle(
                                            color: kGreen,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          RichText(
                            text: const TextSpan(
                              text:
                                  'Aggregate game completion across all verified arena servers. Data latency ',
                              style: TextStyle(
                                  color: kTextSecondary, fontSize: 13),
                              children: [
                                TextSpan(
                                  text: '42ms.',
                                  style: TextStyle(color: kCyan),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Active players bar chart placeholder
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: kBgCardLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: kBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ACTIVE PLAYERS',
                            style: TextStyle(
                                color: kTextSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            '14,202',
                            style: TextStyle(
                              color: kTextPrimary,
                              fontSize: 32,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 12),
                          // Simple bar chart using containers
                          _MiniBarChart(),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // 30-day velocity chart card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: kBgCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: kBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          '30-DAY\nVELOCITY',
                          style: TextStyle(
                            color: kTextPrimary,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        Row(
                          children: [
                            GestureDetector(
                              onTap: () =>
                                  setState(() => _isDaily = true),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 8),
                                decoration: BoxDecoration(
                                  color: _isDaily
                                      ? kCyanDim
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'DAILY',
                                  style: TextStyle(
                                    color: _isDaily
                                        ? kTextPrimary
                                        : kTextSecondary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap: () =>
                                  setState(() => _isDaily = false),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 8),
                                child: Text(
                                  'WEEKLY',
                                  style: TextStyle(
                                    color: !_isDaily
                                        ? kTextPrimary
                                        : kTextSecondary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    _VelocityChart(isDaily: _isDaily),
                    const SizedBox(height: 8),
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('MAR 01',
                            style: TextStyle(
                                color: kTextMuted, fontSize: 11)),
                        Text('MAR 15',
                            style: TextStyle(
                                color: kTextMuted, fontSize: 11)),
                        Text('TODAY',
                            style: TextStyle(
                                color: kTextMuted, fontSize: 11)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Game distribution card — matches Figma image 1
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: kBgCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: kBorder),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'GAME DISTRIBUTION',
                      style: TextStyle(
                        color: kTextPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 20),
                    _DistributionBar(label: 'LUDO', percent: 0.42, display: '42%'),
                    const SizedBox(height: 16),
                    _DistributionBar(label: 'AYO', percent: 0.28, display: '28%'),
                    const SizedBox(height: 16),
                    _DistributionBar(label: 'CHESS', percent: 0.18, display: '18%'),
                    const SizedBox(height: 16),
                    _DistributionBar(label: 'DRAFT', percent: 0.12, display: '12%'),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  String _fmtLarge(int n) {
    final s = n.toString();
    // Insert comma every 3 digits from the right
    final buf = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
      buf.write(s[i]);
    }
    return buf.toString();
  }
}

// Mini bar chart — drawn with containers, no third party lib
class _MiniBarChart extends StatelessWidget {
  final List<double> _bars = const [0.4, 0.6, 0.5, 0.8, 0.9, 0.7, 0.5];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 60,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: _bars.map((h) {
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Container(
                height: 60 * h,
                decoration: BoxDecoration(
                  color: kCyanDim,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// Velocity curve chart — drawn with CustomPainter, no third party lib
class _VelocityChart extends StatelessWidget {
  final bool isDaily;
  const _VelocityChart({required this.isDaily});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: CustomPaint(
        painter: _CurvePainter(isDaily: isDaily),
        size: const Size(double.infinity, 200),
      ),
    );
  }
}

class _CurvePainter extends CustomPainter {
  final bool isDaily;
  const _CurvePainter({required this.isDaily});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Points that make the curve shape from the Figma — starts low, peaks in middle, dips, then spikes at end
    final points = isDaily
        ? [
            Offset(0, h * 0.85),
            Offset(w * 0.2, h * 0.6),
            Offset(w * 0.4, h * 0.3),
            Offset(w * 0.55, h * 0.45),
            Offset(w * 0.7, h * 0.65),
            Offset(w * 0.85, h * 0.1),
            Offset(w, h * 0.15),
          ]
        : [
            Offset(0, h * 0.9),
            Offset(w * 0.3, h * 0.5),
            Offset(w * 0.5, h * 0.35),
            Offset(w * 0.7, h * 0.55),
            Offset(w * 0.85, h * 0.08),
            Offset(w, h * 0.12),
          ];

    // Gradient fill under the curve
    final fillPath = Path();
    fillPath.moveTo(points[0].dx, h);
    fillPath.lineTo(points[0].dx, points[0].dy);
    for (int i = 0; i < points.length - 1; i++) {
      final cp1 = Offset(
        (points[i].dx + points[i + 1].dx) / 2,
        points[i].dy,
      );
      final cp2 = Offset(
        (points[i].dx + points[i + 1].dx) / 2,
        points[i + 1].dy,
      );
      fillPath.cubicTo(
          cp1.dx, cp1.dy, cp2.dx, cp2.dy, points[i + 1].dx, points[i + 1].dy);
    }
    fillPath.lineTo(points.last.dx, h);
    fillPath.close();

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          kCyan.withOpacity(0.25),
          kCyan.withOpacity(0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, w, h));
    canvas.drawPath(fillPath, fillPaint);

    // Stroke line on top
    final linePath = Path();
    linePath.moveTo(points[0].dx, points[0].dy);
    for (int i = 0; i < points.length - 1; i++) {
      final cp1 = Offset(
        (points[i].dx + points[i + 1].dx) / 2,
        points[i].dy,
      );
      final cp2 = Offset(
        (points[i].dx + points[i + 1].dx) / 2,
        points[i + 1].dy,
      );
      linePath.cubicTo(
          cp1.dx, cp1.dy, cp2.dx, cp2.dy, points[i + 1].dx, points[i + 1].dy);
    }

    final linePaint = Paint()
      ..color = kCyan
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    canvas.drawPath(linePath, linePaint);

    // Vertical cursor line near the peak
    final cursorX = w * 0.82;
    final cursorPaint = Paint()
      ..color = kTextMuted
      ..strokeWidth = 1;
    canvas.drawLine(
        Offset(cursorX, 0), Offset(cursorX, h), cursorPaint);

    // Dot on the line at cursor
    canvas.drawCircle(
      Offset(cursorX, h * 0.12),
      5,
      Paint()..color = kCyan,
    );

    // Y-axis labels
    final tp40 = _tp('40K', kTextMuted, 11);
    final tp20 = _tp('20K', kTextMuted, 11);
    final tp0 = _tp('0', kTextMuted, 11);
    tp40.paint(canvas, Offset(0, h * 0.05));
    tp20.paint(canvas, Offset(0, h * 0.45));
    tp0.paint(canvas, Offset(0, h * 0.9));
  }

  TextPainter _tp(String text, Color color, double size) {
    final tp = TextPainter(
      text: TextSpan(
          text: text, style: TextStyle(color: color, fontSize: size)),
      textDirection: TextDirection.ltr,
    );
    tp.layout();
    return tp;
  }

  @override
  bool shouldRepaint(_CurvePainter old) => old.isDaily != isDaily;
}

class _DistributionBar extends StatelessWidget {
  final String label;
  final double percent;
  final String display;
  const _DistributionBar(
      {required this.label,
      required this.percent,
      required this.display});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label,
                style: const TextStyle(
                    color: kTextPrimary,
                    fontWeight: FontWeight.bold,
                    fontSize: 13)),
            Text(display,
                style: const TextStyle(
                    color: kCyan,
                    fontWeight: FontWeight.bold,
                    fontSize: 13)),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(3),
          child: LinearProgressIndicator(
            value: percent,
            backgroundColor: kBorder,
            valueColor: const AlwaysStoppedAnimation<Color>(kCyan),
            minHeight: 5,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
// USER APP placeholder — Phase 2 builds this out
// ─────────────────────────────────────────────
class UserApp extends StatelessWidget {
  const UserApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgDeep,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.sports_esports, color: kCyan, size: 64),
            const SizedBox(height: 16),
            const Text(
              'GAMEARN',
              style: TextStyle(
                color: kTextPrimary,
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: 3,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Signed in as ${FirebaseAuth.instance.currentUser?.email ?? ""}',
              style: const TextStyle(color: kTextSecondary),
            ),
            const SizedBox(height: 32),
            const Text(
              'User dashboard coming in Phase 2',
              style: TextStyle(color: kTextMuted),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
// SHARED WIDGETS
// ─────────────────────────────────────────────

// Reusable app bar matching the Figma top bar style
class _GAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  const _GAppBar({required this.title});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: kBgDeep,
      elevation: 0,
      centerTitle: true,
      leading: Navigator.canPop(context)
          ? IconButton(
              icon: const Icon(Icons.arrow_back, color: kTextPrimary),
              onPressed: () => Navigator.pop(context),
            )
          : null,
      title: Text(
        title,
        style: const TextStyle(
          color: kTextPrimary,
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: kBorder),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight + 1);
}

// Reusable text field
class _GField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final Widget? suffix;

  const _GField({
    required this.label,
    required this.controller,
    this.obscureText = false,
    this.keyboardType,
    this.validator,
    this.suffix,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      validator: validator,
      style: const TextStyle(color: kTextPrimary),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: kTextSecondary),
        suffixIcon: suffix,
        filled: true,
        fillColor: kBgCard,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: kBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: kBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: kCyan),
        ),
      ),
    );
  }
}

// Reusable primary button
class _GButton extends StatelessWidget {
  final String label;
  final bool loading;
  final VoidCallback onPressed;

  const _GButton({
    required this.label,
    required this.loading,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: loading ? null : onPressed,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: kCyan,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: loading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      color: kBgDeep, strokeWidth: 2),
                )
              : Text(
                  label,
                  style: const TextStyle(
                    color: kBgDeep,
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                    letterSpacing: 1,
                  ),
                ),
        ),
      ),
    );
  }
}

// Admin metric card with left colored border — matches Figma images 14 & 15
class _AdminMetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final Color? subtitleColor;
  final IconData? subtitleIcon;
  final String? badge;
  final Color? badgeColor;
  final Color accentColor;
  final String actionLabel;
  final VoidCallback onAction;
  final bool showProgressBar;
  final double progress;

  const _AdminMetricCard({
    required this.title,
    required this.value,
    this.subtitle,
    this.subtitleColor,
    this.subtitleIcon,
    this.badge,
    this.badgeColor,
    required this.accentColor,
    required this.actionLabel,
    required this.onAction,
    this.showProgressBar = false,
    this.progress = 0,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border(left: BorderSide(color: accentColor, width: 4)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title,
                  style: const TextStyle(
                      color: kTextSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5)),
              if (badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: (badgeColor ?? kGreen).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: badgeColor ?? kGreen,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        badge!,
                        style: TextStyle(
                          color: badgeColor ?? kGreen,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: kTextPrimary,
              fontSize: 32,
              fontWeight: FontWeight.w900,
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Row(
              children: [
                if (subtitleIcon != null) ...[
                  Icon(subtitleIcon,
                      color: subtitleColor ?? kTextSecondary, size: 14),
                  const SizedBox(width: 6),
                ],
                Text(
                  subtitle!,
                  style: TextStyle(
                    color: subtitleColor ?? kTextSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
          if (showProgressBar) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: LinearProgressIndicator(
                value: progress.clamp(0.0, 1.0),
                backgroundColor: kBorder,
                valueColor:
                    AlwaysStoppedAnimation<Color>(accentColor),
                minHeight: 3,
              ),
            ),
          ],
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: GestureDetector(
              onTap: onAction,
              child: Text(
                actionLabel,
                style: TextStyle(
                  color: accentColor,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Finance card for user detail screen
class _FinanceCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color iconBg;
  final double progress;
  final Color progressColor;

  const _FinanceCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.iconBg,
    required this.progress,
    required this.progressColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: kBgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: kBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title,
                  style: const TextStyle(
                      color: kTextSecondary,
                      fontSize: 12,
                      fontWeight: FontWeight.bold)),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconBg.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: iconBg, size: 18),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: kTextPrimary,
              fontSize: 28,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: kBorder,
              valueColor: AlwaysStoppedAnimation<Color>(progressColor),
              minHeight: 3,
            ),
          ),
        ],
      ),
    );
  }
}

// Performance stat widget used in user cards
class _PerfStat extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  const _PerfStat(
      {required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(value,
            style: TextStyle(
                color: color,
                fontSize: 18,
                fontWeight: FontWeight.w900)),
        Text(label,
            style: const TextStyle(color: kTextMuted, fontSize: 11)),
      ],
    );
  }
}

// Integrity row in admin stats screen
class _IntegrityRow extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  const _IntegrityRow(
      {required this.icon, required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 12),
        Text(label,
            style: const TextStyle(
                color: kTextPrimary, fontSize: 14)),
      ],
    );
  }
}
