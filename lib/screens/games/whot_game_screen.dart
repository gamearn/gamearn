import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/sound_service.dart';
import 'package:http/http.dart' as http;

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:gamearn/config/api_config.dart';
import '../../theme.dart';
import '../../utils/error_utils.dart';

// ── Palette ───────────────────────────────────────────────────────────────────
const _bgDark = Color(0xFF0B0E1A);
const _navyDark = Color(0xFF0D1B4B);
const _cyan = Color(0xFF22D1EE);
const _orange = Color(0xFFFF5E00);
const _white = Color(0xFFFFFFFF);
const _cardBg = Color(0xFFF4F6FF);
const _shapeCol = Color(0xFF0D1B4B);
const _txtPriDark = Color(0xFFF1F5F9);
const _txtSubDark = Color(0xFF94A3B8);
const _timerBg = Color(0xFF3D2B1F);

Color _bgFor(BuildContext c) => c.isDark ? _bgDark : kLightBg;
Color _navyFor(BuildContext c) => c.isDark ? _navyDark : kLightCard;
Color _txtPriFor(BuildContext c) => c.isDark ? _txtPriDark : kLightText;
Color _txtSubFor(BuildContext c) => c.isDark ? _txtSubDark : kLightSub;

// ── Shapes ────────────────────────────────────────────────────────────────────
enum WhotShape { cross, square, circle, triangle, star, whot }

extension WhotShapeExt on WhotShape {
  String get label {
    switch (this) {
      case WhotShape.cross:
        return '✛';
      case WhotShape.square:
        return '■';
      case WhotShape.circle:
        return '●';
      case WhotShape.triangle:
        return '▲';
      case WhotShape.star:
        return '★';
      case WhotShape.whot:
        return '*';
    }
  }

  String get name {
    switch (this) {
      case WhotShape.cross:
        return 'cross';
      case WhotShape.square:
        return 'square';
      case WhotShape.circle:
        return 'circle';
      case WhotShape.triangle:
        return 'triangle';
      case WhotShape.star:
        return 'star';
      case WhotShape.whot:
        return 'whot';
    }
  }
}

// ── Card model ────────────────────────────────────────────────────────────────
class WhotCard {
  final WhotShape shape;
  final int number;
  final bool isFaceDown;
  final String? id;

  const WhotCard({
    required this.shape,
    required this.number,
    this.isFaceDown = false,
    this.id,
  });

  factory WhotCard.faceDown() =>
      const WhotCard(shape: WhotShape.circle, number: 0, isFaceDown: true);

  factory WhotCard.fromJson(Map<String, dynamic> j) {
    const m = {
      'cross': WhotShape.cross,
      'square': WhotShape.square,
      'circle': WhotShape.circle,
      'triangle': WhotShape.triangle,
      'star': WhotShape.star,
      'whot': WhotShape.whot,
    };
    final shapeStr = j['shape'] as String? ?? '';
    final shape = m[shapeStr];
    if (shape == null) {
      debugPrint('⚠️ WhotCard.fromJson: unrecognized shape "$shapeStr" in $j');
    }
    return WhotCard(
      shape: shape ?? WhotShape.circle,
      number: (j['number'] as num).toInt(),
      id: j['id']?.toString(),
    );
  }

  Map<String, dynamic> toJson() =>
      {'id': id, 'shape': shape.name, 'number': number};

  bool get isWhot => shape == WhotShape.whot || number == 20;
}

// ── OpenSpiel deck (mirrors whot.cc kDeck exactly) ────────────────────────────
const _kDeck = <(WhotShape, int)>[
  (WhotShape.circle, 1),
  (WhotShape.circle, 2),
  (WhotShape.circle, 3),
  (WhotShape.circle, 4),
  (WhotShape.circle, 5),
  (WhotShape.circle, 7),
  (WhotShape.circle, 8),
  (WhotShape.circle, 10),
  (WhotShape.circle, 11),
  (WhotShape.circle, 12),
  (WhotShape.circle, 13),
  (WhotShape.circle, 14),
  (WhotShape.triangle, 1),
  (WhotShape.triangle, 2),
  (WhotShape.triangle, 3),
  (WhotShape.triangle, 4),
  (WhotShape.triangle, 5),
  (WhotShape.triangle, 7),
  (WhotShape.triangle, 8),
  (WhotShape.triangle, 10),
  (WhotShape.triangle, 11),
  (WhotShape.triangle, 12),
  (WhotShape.triangle, 13),
  (WhotShape.triangle, 14),
  (WhotShape.cross, 1),
  (WhotShape.cross, 2),
  (WhotShape.cross, 3),
  (WhotShape.cross, 5),
  (WhotShape.cross, 7),
  (WhotShape.cross, 10),
  (WhotShape.cross, 11),
  (WhotShape.cross, 13),
  (WhotShape.cross, 14),
  (WhotShape.square, 1),
  (WhotShape.square, 2),
  (WhotShape.square, 3),
  (WhotShape.square, 5),
  (WhotShape.square, 7),
  (WhotShape.square, 10),
  (WhotShape.square, 11),
  (WhotShape.square, 13),
  (WhotShape.square, 14),
  (WhotShape.star, 1),
  (WhotShape.star, 2),
  (WhotShape.star, 3),
  (WhotShape.star, 4),
  (WhotShape.star, 5),
  (WhotShape.star, 7),
  (WhotShape.star, 8),
  (WhotShape.whot, 20),
  (WhotShape.whot, 20),
  (WhotShape.whot, 20),
  (WhotShape.whot, 20),
  (WhotShape.whot, 20),
];
const _kDraw = 54;
const _kNomBase = 55; // 55=circle … 59=star

WhotCard _deckCard(int action) {
  if (action < 0 || action >= _kDeck.length) {
    return const WhotCard(shape: WhotShape.circle, number: 1, id: '0');
  }
  final (s, n) = _kDeck[action];
  return WhotCard(shape: s, number: n, id: action.toString());
}

int _deckAction(WhotCard c) {
  final id = int.tryParse(c.id ?? '');
  if (id != null && id >= 0 && id < _kDeck.length) return id;
  for (var i = 0; i < _kDeck.length; i++) {
    final (s, n) = _kDeck[i];
    if (s == c.shape && n == c.number) return i;
  }
  return 0;
}

WhotShape _shapeFromSuit(int suit) {
  const map = [
    WhotShape.circle,
    WhotShape.triangle,
    WhotShape.cross,
    WhotShape.square,
    WhotShape.star
  ];
  return suit >= 0 && suit < map.length ? map[suit] : WhotShape.circle;
}

int _suitFromShape(WhotShape s) {
  switch (s) {
    case WhotShape.circle:
      return 0;
    case WhotShape.triangle:
      return 1;
    case WhotShape.cross:
      return 2;
    case WhotShape.square:
      return 3;
    case WhotShape.star:
      return 4;
    case WhotShape.whot:
      return 0;
  }
}

WhotShape? _shapeFromName(String n) => WhotShape.values
    .where((s) => s != WhotShape.whot)
    .cast<WhotShape?>()
    .firstWhere((s) => s!.name == n, orElse: () => null);

// ── Socket interface ──────────────────────────────────────────────────────────
abstract class WhotSocketService {
  void connect(
      {required String roomId,
      required String playerId,
      required WhotGameEventHandler handler});
  void emitPlayCard(String roomId, String playerId, WhotCard card,
      {WhotShape? chosenShape});
  void emitDrawCard(String roomId, String playerId);
  void emitCallCard(String roomId, String playerId);
  void disconnect();
}

abstract class WhotGameEventHandler {
  void onGameState(Map<String, dynamic> state);
  void onCardPlayed(Map<String, dynamic> data);
  void onCardDrawn(Map<String, dynamic> data);
  void onYourTurn();
  void onOpponentTurn();
  void onMarket(int count);
  void onSuspension();
  void onGeneralMarket();
  void onChooseShape();
  void onCallCard(String playerId);
  void onGameOver(Map<String, dynamic> data);
  void onTimerTick(int seconds);
  void onError(String message);
}

class _DummySocket extends WhotSocketService {
  @override
  void connect({required roomId, required playerId, required handler}) {}
  @override
  void emitPlayCard(roomId, playerId, card, {chosenShape}) {}
  @override
  void emitDrawCard(roomId, playerId) {}
  @override
  void emitCallCard(roomId, playerId) {}
  @override
  void disconnect() {}
}

// ── Bot service  — calls Backend_manager /practice/* endpoints ──────────────
// Bot hand never leaves the server.
class _BotService {
  static String get _nodeBase => ApiConfig.nodeBaseUrl;
  String? sessionId;

  static Future<Map<String, String>> _authHeaders() async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return {'Content-Type': 'application/json'};
    final token = await user.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Warm up the Node backend (like we did for Python)
  Future<void> _warmUp() async {
    try {
      await http
          .get(Uri.parse('$_nodeBase/health'))
          .timeout(const Duration(seconds: 4));
    } catch (_) {}
  }

  /// Start a server-side practice session.
  /// Returns { sessionId, playerHand, topCard, botCardCount, currentPlayerUid, pendingShape, deckSize }
  Future<Map<String, dynamic>?> startGame(
      {int playerRating = 1200, int startCards = 6}) async {
    for (int attempt = 1; attempt <= 3; attempt++) {
      try {
        debugPrint('practice/whot/start attempt $attempt');
        final res = await http
            .post(
              Uri.parse('$_nodeBase/api/v1/practice/whot/start'),
              headers: await _authHeaders(),
              body: jsonEncode({
                'playerRating': playerRating,
                'startCards': startCards,
              }),
            )
            .timeout(Duration(seconds: attempt == 1 ? 60 : 25));
        if (res.statusCode == 200) {
          final body = jsonDecode(res.body) as Map<String, dynamic>;
          if (body['success'] == true) {
            final data = body['data'] as Map<String, dynamic>;
            sessionId = data['sessionId'] as String;
            debugPrint('practice/whot/start OK sessionId=$sessionId');
            return data;
          }
          debugPrint('practice/whot/start failed: ${body['error']}');
        } else {
          debugPrint('practice/whot/start HTTP ${res.statusCode}: ${res.body}');
        }
      } catch (e) {
        debugPrint('practice/whot/start attempt $attempt error: $e');
      }
      if (attempt < 3) await Future.delayed(Duration(seconds: attempt * 2));
    }
    return null;
  }

  /// Send the player's move; server validates, applies it, plays the bot's
  /// turn(s), and returns the updated state + botActions.
  ///
  /// [move] shape: { "card": {"number":N,"shape":"S"}, "declaredShape": "S" }
  ///   or: { "pickFromMarket": true }
  Future<Map<String, dynamic>?> sendMove(Map<String, dynamic> move) async {
    if (sessionId == null) {
      debugPrint('sendMove: no sessionId');
      return null;
    }
    try {
      debugPrint('practice/whot/move sessionId=$sessionId move=$move');
      final res = await http
          .post(
            Uri.parse('$_nodeBase/api/v1/practice/whot/move'),
            headers: await _authHeaders(),
            body: jsonEncode({
              'sessionId': sessionId,
              'move': move,
            }),
          )
          .timeout(const Duration(seconds: 20));
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        if (body['success'] == true) {
          final data = body['data'] as Map<String, dynamic>;
          debugPrint('practice/whot/move OK gameOver=${data['gameOver']} '
              'botActions=${(data['botActions'] as List?)?.length ?? 0}');
          return data;
        }
        debugPrint('practice/whot/move failed: ${body['error']}');
      } else {
        debugPrint('practice/whot/move HTTP ${res.statusCode}: ${res.body}');
      }
    } catch (e) {
      debugPrint('practice/whot/move error: $e');
    }
    return null;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  WHOT GAME SCREEN
// ═════════════════════════════════════════════════════════════════════════════
class WhotGameScreen extends StatefulWidget {
  final String roomId;
  final String playerId;
  final String playerName;
  final String playerAvatar;
  final String opponentName;
  final String opponentAvatar;
  final String tournamentTitle;
  final String prizePool;
  final int playerRating;
  final int startingCards;
  final WhotSocketService? socketService;
  final VoidCallback? onBack;

  const WhotGameScreen({
    super.key,
    required this.roomId,
    required this.playerId,
    this.playerName = 'You',
    this.playerAvatar = '',
    this.opponentName = 'Gamearn Bot',
    this.opponentAvatar = '',
    this.tournamentTitle = 'Wọt TOURNAMENT',
    this.prizePool = '₦70,000',
    this.playerRating = 1200,
    this.startingCards = 6,
    this.socketService,
    this.onBack,
  });

  @override
  State<WhotGameScreen> createState() => _WhotGameScreenState();
}

class _WhotGameScreenState extends State<WhotGameScreen>
    with TickerProviderStateMixin
    implements WhotGameEventHandler {
  // ── Animations ────────────────────────────────────────────────────────────
  late AnimationController _bokehCtrl;
  late AnimationController _glowCtrl;
  late Animation<double> _glowAnim;
  late AnimationController _sidebarCtrl;
  late Animation<Offset> _sidebarAnim;

  // ── Game state ────────────────────────────────────────────────────────────
  List<WhotCard> _hand = [];
  int _oppCount = 4;
  WhotCard _topCard = WhotCard(shape: WhotShape.triangle, number: 14, id: '23');
  bool _isMyTurn = false;
  int _timerSec = 15;
  int _selectedIdx = -1;
  bool _showShapeChooser = false;
  bool _showCallOverlay = false;
  bool _isLandscape = false;
  bool _isDealing = true;
  bool _dealFailed = false;
  bool _calledCard = false;

  // ── Bot / history ─────────────────────────────────────────────────────────
  final _BotService _bot = _BotService();
  List<int> _dealHistory = [];
  List<int> _moveHistory = [];
  bool _botBusy = false;
  int _dealerAction = 54;

  // ── Heuristic legal state (used when /legal_actions not called) ───────────
  WhotShape _effectiveSuit = WhotShape.triangle;
  int _effectiveRank = 14;
  int _pendingDraw = 0;

  // ── Bokeh ─────────────────────────────────────────────────────────────────
  late List<_Bokeh> _bokeh;
  final _rng = Random();

  Timer? _timer;

  @override
  void initState() {
    super.initState();

    _bokehCtrl =
        AnimationController(vsync: this, duration: const Duration(seconds: 6))
          ..repeat(reverse: true);
    _bokeh = List.generate(
        18,
        (_) => _Bokeh(
              x: _rng.nextDouble(),
              y: _rng.nextDouble(),
              r: _rng.nextDouble() * 28 + 8,
              o: _rng.nextDouble() * 0.18 + 0.04,
              p: _rng.nextDouble() * 2 * pi,
            ));
    _glowCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900))
      ..repeat(reverse: true);
    _glowAnim = Tween(begin: 0.5, end: 1.0)
        .animate(CurvedAnimation(parent: _glowCtrl, curve: Curves.easeInOut));

    _sidebarCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 280))
      ..value = 1.0;
    _sidebarAnim = Tween(begin: const Offset(1, 0), end: Offset.zero).animate(
        CurvedAnimation(parent: _sidebarCtrl, curve: Curves.easeOutCubic));

    (widget.socketService ?? _DummySocket()).connect(
        roomId: widget.roomId, playerId: widget.playerId, handler: this);

    if (widget.socketService == null) {
      _dealCards();
    } else {
      setState(() => _isDealing = false);
      _startTimer();
    }
  }

  @override
  void dispose() {
    _bokehCtrl.dispose();
    _glowCtrl.dispose();
    _sidebarCtrl.dispose();
    _timer?.cancel();
    widget.socketService?.disconnect();
    super.dispose();
  }

  Future<void> _dealCards() async {
    setState(() {
      _isDealing = true;
      _dealFailed = false;
    });
    final result = await _bot.startGame(
        playerRating: widget.playerRating, startCards: widget.startingCards);
    if (!mounted) return;

    if (result == null) {
      setState(() {
        _isDealing = false;
        _dealFailed = true;
      });
      return;
    }

    final rawHand = result['playerHand'] as List<dynamic>;
    final topJson = result['topCard'] as Map<String, dynamic>;
    final oppCount = (result['botCardCount'] as num).toInt();
    final currentPlayerUid = result['currentPlayerUid'] as String?;

    final topCard = WhotCard.fromJson(topJson);

    setState(() {
      _moveHistory = [];
      _hand = rawHand
          .map((c) => WhotCard.fromJson(c as Map<String, dynamic>))
          .toList();
      _topCard = topCard;
      _oppCount = oppCount;
      _effectiveSuit = topCard.shape;
      _effectiveRank = topCard.number;
      _pendingDraw = 0;
      _isMyTurn = _isMe(currentPlayerUid);
      _isDealing = false;
      _dealFailed = false;
      _botBusy = false;
    });

    if (_isMyTurn) {
      _startTimer();
    } else {
      // Server already determined it's bot's turn — shouldn't happen at start
      // but handle gracefully
      _isMyTurn = true;
      _startTimer();
    }
  }

  void _startTimer() {
    _timer?.cancel();
    if (!mounted) return;
    setState(() => _timerSec = 15);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() {
        if (_timerSec > 0) {
          _timerSec--;
        } else {
          t.cancel();
          if (_isMyTurn && !_botBusy) {
            _forceDrawOnTimeout();
          }
        }
      });
    });
  }

  void _forceDrawOnTimeout() {
    if (!mounted || _botBusy) return;
    _drawCard();
  }

  @override
  void onGameState(Map<String, dynamic> s) {
    if (!mounted) return;
    setState(() {
      _hand = (s['yourHand'] as List)
          .map((c) => WhotCard.fromJson(c as Map<String, dynamic>))
          .toList();
      _oppCount = (s['opponentCardCount'] as num).toInt();
      _topCard = WhotCard.fromJson(s['topCard'] as Map<String, dynamic>);
      _isMyTurn = s['currentTurn'] == widget.playerId;
    });
    if (_isMyTurn) _startTimer();
  }

  @override
  void onCardPlayed(Map<String, dynamic> d) {
    if (!mounted) return;
    final c = WhotCard.fromJson(d['card'] as Map<String, dynamic>);
    setState(() {
      _topCard = c;
      _oppCount = (d['opponentCardCount'] as num).toInt();
      _effectiveSuit = c.shape;
      _effectiveRank = c.number;
      _isMyTurn = true;
    });
    _startTimer();
  }

  @override
  void onCardDrawn(Map<String, dynamic> d) {
    if (!mounted) return;
    setState(() {
      _oppCount = (d['opponentCardCount'] as num).toInt();
      _isMyTurn = true;
    });
    _startTimer();
  }

  @override
  void onYourTurn() {
    if (!mounted) return;
    setState(() => _isMyTurn = true);
    _startTimer();
  }

  @override
  void onOpponentTurn() {
    if (!mounted) return;
    setState(() {
      _isMyTurn = false;
      _selectedIdx = -1;
    });
  }

  @override
  void onMarket(int count) {
    if (!mounted) return;
    _addDrawnCards(count);
    setState(() {});
    _toast('Pick $count! 😬');
  }

  @override
  void onSuspension() {
    if (!mounted) return;
    setState(() => _isMyTurn = false);
    _toast('Suspension! Turn skipped.');
  }

  @override
  void onGeneralMarket() {
    if (!mounted) return;
    _addDrawnCards(1);
    setState(() {});
    _toast('General Market! 😅');
  }

  @override
  void onChooseShape() {
    if (!mounted) return;
    setState(() => _showShapeChooser = true);
    _openSuitChooser();
  }

  @override
  void onCallCard(String pid) {
    _toast(
        '${pid == widget.playerId ? 'You' : widget.opponentName} called card! 🔔');
  }

  @override
  void onGameOver(Map<String, dynamic> d) {
    if (!mounted) return;
    _timer?.cancel();
    final won = d['winnerId'] == widget.playerId;
    SoundService.instance.play(won ? SoundType.gameWin : SoundType.gameLose);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => _GameOverDialog(
        isWinner: d['winnerId'] == widget.playerId,
        prizePool: widget.prizePool,
        onClose: widget.onBack ?? () => Navigator.maybePop(context),
      ),
    );
  }

  @override
  void onTimerTick(int s) {
    if (mounted) setState(() => _timerSec = s);
  }

  @override
  void onError(String m) => showAppError(context, m);

  bool _canPlay(WhotCard c) {
    if (c.isWhot) return true;
    if (_pendingDraw > 0) {
      return c.number == _effectiveRank;
    }
    return c.shape == _effectiveSuit || c.number == _effectiveRank;
  }

  Set<int> _playableIndices() {
    if (!_isMyTurn) return {};
    final out = <int>{};
    for (var i = 0; i < _hand.length; i++) {
      if (_canPlay(_hand[i])) out.add(i);
    }
    return out;
  }

  Future<void> _playCard({WhotShape? chosen, bool nominateOnly = false}) async {
    if (_selectedIdx < 0 || !_isMyTurn || _botBusy) return;
    final card = _hand[_selectedIdx];

    if (!_canPlay(card)) {
      _toast('Not a legal move');
      return;
    }
    if (card.isWhot && chosen == null) {
      setState(() => _showShapeChooser = true);
      _openSuitChooser();
      return;
    }

    _timer?.cancel();
    setState(() {
      _hand.removeAt(_selectedIdx);
      _showShapeChooser = false;
      _selectedIdx = -1;
      _isMyTurn = false;
      _botBusy = true;
    });
    SoundService.instance.play(SoundType.cardPlay);
    HapticFeedback.lightImpact();

    // Build server-side move
    final move = <String, dynamic>{
      'card': {'number': card.number, 'shape': card.shape.name},
    };
    if (card.isWhot && chosen != null) {
      move['declaredShape'] = chosen.name;
    }

    final result = await _bot.sendMove(move);
    if (!mounted) return;

    if (result == null) {
      // Server error — restore card
      setState(() {
        _hand.insert(_selectedIdx < 0 ? _hand.length : _selectedIdx, card);
        _isMyTurn = true;
        _botBusy = false;
      });
      _startTimer();
      return;
    }

    _applyServerState(result);
  }

  Future<void> _drawCard() async {
    if (!_isMyTurn || _botBusy) return;
    _timer?.cancel();
    setState(() {
      _isMyTurn = false;
      _botBusy = true;
      _selectedIdx = -1;
      _calledCard = false;
    });
    SoundService.instance.play(SoundType.drawCard);
    HapticFeedback.selectionClick();

    final result = await _bot.sendMove({'pickFromMarket': true});
    if (!mounted) return;

    if (result == null) {
      setState(() {
        _isMyTurn = true;
        _botBusy = false;
      });
      _startTimer();
      return;
    }

    _applyServerState(result);
  }

  /// Apply full server response (player hand + bot actions).
  void _applyServerState(Map<String, dynamic> data) {
    final rawHand = data['playerHand'] as List<dynamic>? ?? [];
    final topJson = data['topCard'] as Map<String, dynamic>?;
    final oppCount = (data['botCardCount'] as num?)?.toInt() ?? 0;
    final currentPlayerUid = data['currentPlayerUid'] as String?;
    final pendingShape = data['pendingShape'] as String?;
    final gameOver = data['gameOver'] as bool? ?? false;
    final winner = data['winner'] as String?;
    final botActions = (data['botActions'] as List<dynamic>?) ?? [];
    final playerEffects = data['playerEffects'] as String?;

    setState(() {
      _hand = rawHand
          .map((c) => WhotCard.fromJson(c as Map<String, dynamic>))
          .toList();
      _oppCount = oppCount;
      if (topJson != null) {
        _topCard = WhotCard.fromJson(topJson);
        _effectiveSuit = _topCard.shape;
        _effectiveRank = _topCard.number;
      }
      if (pendingShape != null) {
        final ps = _shapeFromName(pendingShape);
        if (ps != null) _effectiveSuit = ps;
      }
    });

    // Process bot actions
    for (final raw in botActions) {
      final ba = raw as Map<String, dynamic>;
      final action = ba['action'] as String?;
      final effect = ba['effect'] as String?;
      final isWin = ba['isWin'] as bool? ?? false;

      if (action == 'play_card') {
        SoundService.instance.play(SoundType.cardPlay);
        if (isWin) {
          _timer?.cancel();
          _botBusy = false;
          SoundService.instance.play(SoundType.gameLose);
          if (mounted) {
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (_) => _GameOverDialog(
                isWinner: false,
                prizePool: widget.prizePool,
                onClose: widget.onBack ?? () => Navigator.maybePop(context),
              ),
            );
          }
          return;
        }
        if (effect == 'hold_on') {
          _toast('Hold On! ${widget.opponentName} plays again.');
        } else if (effect == 'pick_two') {
          _toast('Pick Two on you!');
        } else if (effect == 'pick_three') {
          _toast('Pick Five on you!');
        } else if (effect == 'suspension') {
          _toast('${widget.opponentName} suspends you!');
        } else if (effect == 'general_market') {
          _toast('General Market!');
        } else if (effect == 'whot') {
          final ds = ba['declaredShape'] as String?;
          _toast('${widget.opponentName} called WHOT! Declares $ds.');
        }
      } else if (action == 'pick_market') {
        SoundService.instance.play(SoundType.drawCard);
      }
    }

    // Player effects
    if (playerEffects == 'hold_on') {
      _toast('Hold On! You play again.');
    } else if (playerEffects == 'suspension') {
      _toast('Suspension!');
    }

    if (gameOver) {
      _timer?.cancel();
      _botBusy = false;
      if (_isMe(winner)) {
        SoundService.instance.play(SoundType.gameWin);
        if (mounted) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (_) => _GameOverDialog(
              isWinner: true,
              prizePool: widget.prizePool,
              onClose: widget.onBack ?? () => Navigator.maybePop(context),
            ),
          );
        }
      }
      return;
    }

    final isMyTurn = _isMe(currentPlayerUid);
    setState(() {
      _isMyTurn = isMyTurn;
      _botBusy = false;
    });
    if (isMyTurn) _startTimer();
  }

  void _handlePlayerSpecial(int rank) {}

  // Stub for multiplayer socket handlers (unused in practice mode)
  void _addDrawnCards(int count) {}

  /// True when [uid] refers to this screen's human player.
  /// Practice mode falls back to 'practice_anon' when Firebase can't
  /// verify the token server-side, so treat it as "me".
  bool _isMe(String? uid) {
    if (uid == null) return false;
    if (uid == widget.playerId) return true;
    if (uid == 'practice_anon') return true;
    return false;
  }

  void _callCard() {
    widget.socketService?.emitCallCard(widget.roomId, widget.playerId);
    onCallCard(widget.playerId);
    setState(() {
      _showCallOverlay = false;
      _calledCard = true;
    });
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg,
          style: TextStyle(
              color: _txtPriFor(context), fontWeight: FontWeight.w600)),
      backgroundColor: _navyFor(context),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: const Duration(seconds: 2),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      body: Stack(children: [
        _BokehBg(ctrl: _bokehCtrl, bokeh: _bokeh),
        MediaQuery.of(context).orientation == Orientation.landscape
            ? _landscape(context)
            : _portrait(context),
        if (_isDealing) _loadingOverlay(),
        if (_dealFailed) _errorOverlay(),
        if (_showShapeChooser) _shapeChooser(),
        if (_showCallOverlay) _callCardOverlay(),
      ]),
    );
  }

  Widget _portrait(BuildContext context) => SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            // The supplied React Native artwork is authored on a 1024 x 1536
            // canvas. A fitted reference canvas keeps every control in the
            // same relative place on compact and tall phones.
            final scale = min(constraints.maxWidth / 1024,
                constraints.maxHeight / 1536);
            final canvasWidth = 1024 * scale;
            final canvasHeight = 1536 * scale;
            double x(num value) => value * scale;
            double y(num value) => value * scale;

            return Center(
              child: SizedBox(
                width: canvasWidth,
                height: canvasHeight,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: const BoxDecoration(
                          gradient: RadialGradient(
                            center: Alignment(0, -0.18),
                            radius: 1.08,
                            colors: [
                              Color(0xFF0344C0),
                              Color(0xFF10177B),
                              Color(0xFF210066),
                            ],
                            stops: [0, 0.65, 1],
                          ),
                        ),
                      ),
                    ),
                    for (final left in const [-470.0, -200.0, 650.0, 940.0])
                      Positioned(
                        left: x(left),
                        top: 0,
                        child: Transform.rotate(
                          angle: -0.67,
                          child: Container(
                            width: x(90),
                            height: canvasHeight * 1.35,
                            color: const Color(0xFF7400EB).withOpacity(0.14),
                          ),
                        ),
                      ),

                    // Header controls and WHOT title.
                    Positioned(
                      left: x(24),
                      top: y(24),
                      child: _ReferenceCircleButton(
                        size: x(83),
                        icon: Icons.arrow_back_ios_new_rounded,
                        onTap: widget.onBack ?? () => Navigator.pop(context),
                      ),
                    ),
                    Positioned(
                      left: x(280),
                      top: y(36),
                      width: x(464),
                      child: Column(
                        children: [
                          Text(
                            'WHOT',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: x(76),
                              height: 0.95,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -2,
                              shadows: const [
                                Shadow(color: Color(0xFF427BFF), blurRadius: 4),
                                Shadow(color: Color(0xFF3D03A1), blurRadius: 12),
                              ],
                            ),
                          ),
                          Text(
                            'PLAY • STRATEGIZE • WIN',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: x(18),
                              fontWeight: FontWeight.w800,
                              letterSpacing: x(1.5),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Positioned(
                      right: x(28),
                      top: y(28),
                      child: _TimerBadge(
                        sec: _timerSec,
                        myTurn: _isMyTurn && !_botBusy,
                      ),
                    ),
                    Positioned(
                      left: x(150),
                      top: y(170),
                      width: x(724),
                      child: Column(
                        children: [
                          Text(widget.tournamentTitle,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  color: _orange,
                                  fontSize: x(24),
                                  fontWeight: FontWeight.w900)),
                          Text('Prize Pool: ${widget.prizePool}',
                              style: TextStyle(
                                  color: _cyan,
                                  fontSize: x(18),
                                  fontWeight: FontWeight.w700)),
                        ],
                      ),
                    ),

                    // Real opponent state in the reference's upper panel.
                    Positioned(
                      left: x(326),
                      top: y(248),
                      width: x(372),
                      child: _referencePlayerPanel(
                        context,
                        name: widget.opponentName,
                        avatar: widget.opponentAvatar,
                        count: _oppCount,
                        active: !_isMyTurn && !_botBusy,
                        busy: _botBusy,
                        scale: scale,
                      ),
                    ),

                    // Blue oval table, draw pile and discard pile.
                    Positioned(
                      left: x(116),
                      top: y(405),
                      width: x(792),
                      height: y(610),
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const RadialGradient(
                            colors: [Color(0xFF194DE3), Color(0xFF052CA5)],
                          ),
                          border: Border.all(
                              color: const Color(0xFF8019FF), width: x(6)),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF6F1FFF).withOpacity(0.45),
                              blurRadius: x(24),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              GestureDetector(
                                onTap: (_isMyTurn && !_botBusy)
                                    ? _drawCard
                                    : null,
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    for (int i = 4; i >= 1; i--)
                                      Positioned(
                                        left: x(i * 4),
                                        top: y(-(i * 4)),
                                        child: _CardW(
                                            card: WhotCard.faceDown(),
                                            w: x(126),
                                            h: y(190)),
                                      ),
                                    _CardW(
                                        card: WhotCard.faceDown(),
                                        w: x(126),
                                        h: y(190)),
                                  ],
                                ),
                              ),
                              SizedBox(width: x(86)),
                              Container(
                                padding: EdgeInsets.all(x(8)),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(x(16)),
                                  boxShadow: [
                                    BoxShadow(
                                        color: _cyan.withOpacity(0.45),
                                        blurRadius: x(18)),
                                  ],
                                ),
                                child: _CardW(
                                    card: _topCard, w: x(142), h: y(202)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      left: x(260),
                      top: y(890),
                      width: x(504),
                      child: Container(
                        padding: EdgeInsets.symmetric(
                            horizontal: x(18), vertical: y(10)),
                        decoration: BoxDecoration(
                          color: const Color(0xCC080027),
                          borderRadius: BorderRadius.circular(x(26)),
                          border: Border.all(color: const Color(0xFF7435FF)),
                        ),
                        child: Text(
                          _isMyTurn
                              ? 'Your turn${_botBusy ? '' : ' — choose a card'}'
                              : '${widget.opponentName} is playing…',
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: x(22),
                              fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),

                    // The real hand remains scroll/fan capable for >6 cards.
                    Positioned(
                      left: x(65),
                      top: y(995),
                      width: x(894),
                      height: y(270),
                      child: _FanHand(
                        cards: _hand,
                        selected: _selectedIdx,
                        myTurn: _isMyTurn && !_botBusy,
                        playable: _playableIndices(),
                        onTap: (i) {
                          if (!_isMyTurn || _botBusy) return;
                          if (!_playableIndices().contains(i)) {
                            _toast('That card cannot be played now.');
                            return;
                          }
                          setState(
                              () => _selectedIdx = _selectedIdx == i ? -1 : i);
                        },
                      ),
                    ),
                    Positioned(
                      left: x(35),
                      right: x(35),
                      bottom: y(46),
                      child: _referenceActionBar(scale),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      );

  Widget _referencePlayerPanel(
    BuildContext context, {
    required String name,
    required String avatar,
    required int count,
    required bool active,
    required bool busy,
    required double scale,
  }) =>
      Container(
        height: 92 * scale,
        padding: EdgeInsets.symmetric(horizontal: 12 * scale),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF14126F), Color(0xFF070737)],
          ),
          borderRadius: BorderRadius.circular(28 * scale),
          border: Border.all(
            color: active ? const Color(0xFF57FAFF) : const Color(0xFF7435FF),
            width: 2 * scale,
          ),
        ),
        child: Row(
          children: [
            _AvatarW(
              name: name,
              url: avatar,
              active: active,
              size: 58 * scale,
            ),
            SizedBox(width: 12 * scale),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 24 * scale,
                          fontWeight: FontWeight.w800)),
                  Text(busy ? 'Playing…' : (active ? 'Your opponent' : 'Waiting'),
                      style: TextStyle(
                          color: _cyan,
                          fontSize: 17 * scale,
                          fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            Container(
              width: 46 * scale,
              height: 46 * scale,
              decoration: const BoxDecoration(
                color: Color(0xFF9800EE),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text('$count',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 22 * scale,
                      fontWeight: FontWeight.w900)),
            ),
          ],
        ),
      );

  Widget _referenceActionBar(double scale) {
    final canPlay = _selectedIdx >= 0 &&
        _selectedIdx < _hand.length &&
        _canPlay(_hand[_selectedIdx]) &&
        _isMyTurn &&
        !_botBusy;
    final canDraw = _isMyTurn && !_botBusy;
    final canCall = _hand.length == 1 && !_calledCard;
    return Row(
      children: [
        Expanded(
          child: _ReferencePillButton(
            label: 'Draw',
            icon: Icons.style_rounded,
            enabled: canDraw,
            colors: const [Color(0xFF21C7FF), Color(0xFF002DCE)],
            onTap: _drawCard,
            height: 83 * scale,
          ),
        ),
        SizedBox(width: 18 * scale),
        Expanded(
          child: _ReferencePillButton(
            label: 'Play',
            icon: Icons.play_arrow_rounded,
            enabled: canPlay,
            colors: const [Color(0xFFE74CFF), Color(0xFF4700BC)],
            onTap: () => _playCard(),
            height: 83 * scale,
          ),
        ),
        SizedBox(width: 18 * scale),
        Expanded(
          child: _ReferencePillButton(
            label: 'Call WHOT!',
            icon: Icons.workspace_premium_rounded,
            enabled: canCall,
            colors: const [Color(0xFFFFC12B), Color(0xFFB64200)],
            onTap: _callCard,
            height: 83 * scale,
          ),
        ),
      ],
    );
  }

  Widget _oppSection(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Column(mainAxisSize: MainAxisSize.min, children: [
              _AvatarW(
                name: widget.opponentName,
                url: widget.opponentAvatar,
                active: !_isMyTurn && !_botBusy,
                size: 42,
              ),
              const SizedBox(height: 4),
              Text(widget.opponentName,
                  style: TextStyle(
                      color: _txtPriFor(context),
                      fontSize: 11,
                      fontWeight: FontWeight.w600)),
              if (_botBusy)
                const Text('thinking…',
                    style: TextStyle(color: _cyan, fontSize: 10)),
            ]),
            const SizedBox(width: 12),
            Expanded(
              child: SizedBox(
                height: 80,
                child: _OppFan(count: _oppCount),
              ),
            ),
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: context.card,
                shape: BoxShape.circle,
                border: Border.all(color: _cyan.withOpacity(0.3)),
              ),
              child: Center(
                child: Text('$_oppCount',
                    style: TextStyle(
                        color: _cyan,
                        fontSize: 14,
                        fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
      );

  Widget _centreArea(BuildContext context) => Container(
        width: 230,
        height: 132,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(colors: [
            const Color(0xFF0A4CB5).withOpacity(0.55),
            const Color(0xFF06183E).withOpacity(0.2),
          ]),
          border: Border.all(color: const Color(0xFF087CFF).withOpacity(0.45)),
          boxShadow: [
            BoxShadow(
                color: const Color(0xFF087CFF).withOpacity(0.22),
                blurRadius: 24),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            GestureDetector(
              onTap: (_isMyTurn && !_botBusy) ? _drawCard : null,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  for (int i = 2; i >= 1; i--)
                    Positioned(
                      left: i * 2.0,
                      top: -(i * 2.0),
                      child: Opacity(
                        opacity: 0.5,
                        child: _CardW(card: WhotCard.faceDown(), w: 54, h: 78),
                      ),
                    ),
                  _CardW(card: WhotCard.faceDown(), w: 54, h: 78),
                ],
              ),
            ),
            const SizedBox(width: 24),
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: _cyan,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                      color: _cyan.withOpacity(0.35),
                      blurRadius: 20,
                      spreadRadius: 2)
                ],
              ),
              child: Center(
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: context.card,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: _CardW(card: _topCard, w: 64, h: 80),
                  ),
                ),
              ),
            ),
          ],
        ),
      );

  Widget _actionChips(BuildContext context) {
    final canCallCard = _hand.length == 1 && !_calledCard;
    final canDraw = _isMyTurn && !_botBusy;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          GestureDetector(
            onTap: canCallCard ? _callCard : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 90,
              height: 29,
              decoration: BoxDecoration(
                color: canCallCard ? _orange : _orange.withOpacity(0.3),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(
                child: Text('Last Card!',
                    style: TextStyle(
                        color: canCallCard ? Colors.white : Colors.white54,
                        fontSize: 11,
                        fontWeight: FontWeight.w800)),
              ),
            ),
          ),
          if (_selectedIdx >= 0 &&
              _selectedIdx < _hand.length &&
              _canPlay(_hand[_selectedIdx]))
            GestureDetector(
              onTap: () => _playCard(),
              child: Container(
                height: 29,
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: _cyan,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: Text('Play Card',
                      style: TextStyle(
                          color: Color(0xFF0B0E1A),
                          fontSize: 11,
                          fontWeight: FontWeight.w800)),
                ),
              ),
            ),
          GestureDetector(
            onTap: canDraw ? _drawCard : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 93,
              height: 29,
              decoration: BoxDecoration(
                color: canDraw ? _orange : _orange.withOpacity(0.3),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(
                child: Text('Draw Card',
                    style: TextStyle(
                        color: canDraw ? Colors.white : Colors.white54,
                        fontSize: 11,
                        fontWeight: FontWeight.w800)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _handFan(BuildContext context) {
    final playable = _playableIndices();
    return SizedBox(
      height: 160,
      child: _FanHand(
        cards: _hand,
        selected: _selectedIdx,
        myTurn: _isMyTurn && !_botBusy,
        playable: playable,
        onTap: (i) {
          if (!_isMyTurn || _botBusy) return;
          if (!playable.contains(i)) {
            _toast('Not a legal move');
            return;
          }
          setState(() => _selectedIdx = _selectedIdx == i ? -1 : i);
        },
      ),
    );
  }

  Widget _landscape(BuildContext context) => SafeArea(
        child: Stack(children: [
          Positioned(
            top: 12,
            right: 12,
            child: GestureDetector(
              onTap: () => setState(() => _isLandscape = false),
              child: Container(
                width: 37,
                height: 37,
                decoration: BoxDecoration(
                    color: _orange, borderRadius: BorderRadius.circular(4)),
                child: const Icon(Icons.close_rounded,
                    color: Colors.white, size: 18),
              ),
            ),
          ),
          Center(
            child:
                Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              SizedBox(
                height: 70,
                child: _OppFan(count: _oppCount),
              ),
              const SizedBox(height: 16),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                GestureDetector(
                  onTap: (_isMyTurn && !_botBusy) ? _drawCard : null,
                  child: _CardW(card: WhotCard.faceDown(), w: 44, h: 64),
                ),
                const SizedBox(width: 16),
                Container(
                  width: 74,
                  height: 74,
                  decoration: BoxDecoration(
                      color: _cyan,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(color: _cyan.withOpacity(0.3), blurRadius: 12)
                      ]),
                  child: Center(
                    child: Container(
                      width: 59,
                      height: 59,
                      decoration: BoxDecoration(
                          color: context.card,
                          borderRadius: BorderRadius.circular(11)),
                      child:
                          Center(child: _CardW(card: _topCard, w: 50, h: 62)),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                GestureDetector(
                  onTap: (_hand.length == 1 && !_calledCard) ? _callCard : null,
                  child: Container(
                    width: 50,
                    height: 20,
                    decoration: BoxDecoration(
                      color: (_hand.length == 1 && !_calledCard)
                          ? _orange
                          : _orange.withOpacity(0.35),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Center(
                      child: Text('Last Card',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w800)),
                    ),
                  ),
                ),
              ]),
              const SizedBox(height: 16),
              SizedBox(
                height: 80,
                child: _FanHand(
                  cards: _hand,
                  selected: _selectedIdx,
                  myTurn: _isMyTurn && !_botBusy,
                  playable: _playableIndices(),
                  onTap: (i) {
                    if (!_isMyTurn || _botBusy) return;
                    setState(() => _selectedIdx = _selectedIdx == i ? -1 : i);
                  },
                ),
              ),
            ]),
          ),
        ]),
      );

  Widget _loadingOverlay() => Container(
        color: Colors.black87,
        child: const Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            CircularProgressIndicator(color: _cyan, strokeWidth: 3),
            SizedBox(height: 16),
            Text('Dealing cards…',
                style: TextStyle(
                    color: _cyan, fontSize: 16, fontWeight: FontWeight.w700)),
          ]),
        ),
      );

  Widget _errorOverlay() => Container(
        color: Colors.black87,
        child: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.wifi_off_rounded, color: _orange, size: 48),
            const SizedBox(height: 12),
            const Text('No internet connection',
                style: TextStyle(color: Colors.white, fontSize: 15)),
            const SizedBox(height: 6),
            const Text('Check your network and try again.',
                style: TextStyle(color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 20),
            GestureDetector(
              onTap: _dealCards,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                decoration: BoxDecoration(
                    color: _orange, borderRadius: BorderRadius.circular(12)),
                child: const Text('Retry',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w800)),
              ),
            ),
          ]),
        ),
      );

  Widget _shapeChooser() {
    const suits = [
      (WhotShape.circle, 'Circle'),
      (WhotShape.triangle, 'Triangle'),
      (WhotShape.cross, 'Cross'),
      (WhotShape.square, 'Square'),
      (WhotShape.star, 'Star'),
    ];
    return Stack(children: [
      Positioned.fill(
        child: GestureDetector(
          onTap: () => _closeSuitChooser(),
          child: Container(
            color: Colors.black.withOpacity(0.55),
            child: Align(
              alignment: Alignment.topCenter,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.only(top: 24),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 18, vertical: 12),
                    decoration: BoxDecoration(
                      color: context.card,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: _cyan.withOpacity(0.4)),
                    ),
                    child: const Text('Call a suit',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w800)),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      // Right slide-in sidebar
      Align(
        alignment: Alignment.centerRight,
        child: SlideTransition(
          position: _sidebarAnim,
          child: Container(
            width: 232.w,
            height: double.infinity,
            decoration: BoxDecoration(
              color: context.card,
              border: Border(left: BorderSide(color: _cyan.withOpacity(0.25))),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withOpacity(0.5),
                    blurRadius: 24,
                    offset: const Offset(-4, 0)),
              ],
            ),
            child: SafeArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                    child: Row(children: [
                      const Expanded(
                        child: Text('Choose a suit',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 17,
                                fontWeight: FontWeight.w800)),
                      ),
                      GestureDetector(
                        onTap: _closeSuitChooser,
                        child: Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: context.card,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close_rounded,
                              color: Colors.white, size: 20),
                        ),
                      ),
                    ]),
                  ),
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      children: [
                        ...suits.map((s) => GestureDetector(
                              onTap: () => _playCard(chosen: s.$1),
                              child: Container(
                                width: double.infinity,
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: context.card,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                      color: _cyan.withOpacity(0.22)),
                                ),
                                child: Row(children: [
                                  // Shape-only card (no numbers)
                                  _CardW(
                                    card: WhotCard(shape: s.$1, number: 1),
                                    w: 40,
                                    h: 56,
                                    shapeOnly: true,
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Text(s.$2,
                                        style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 16,
                                            fontWeight: FontWeight.w700)),
                                  ),
                                  const Icon(Icons.chevron_right_rounded,
                                      color: _cyan, size: 20),
                                ]),
                              ),
                            )),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ]);
  }

  void _openSuitChooser() {
    _sidebarCtrl.reset();
    _sidebarCtrl.forward();
  }

  void _closeSuitChooser() {
    _sidebarCtrl.reverse().then((_) {
      if (mounted) setState(() => _showShapeChooser = false);
    });
  }

  Widget _callCardOverlay() => GestureDetector(
        onTap: () => setState(() => _showCallOverlay = false),
        child: Container(
          color: Colors.black.withOpacity(0.6),
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 24),
              decoration: BoxDecoration(
                color: _orange,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text('LAST CARD! 🎴',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w900)),
            ),
          ),
        ),
      );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TIMER BADGE
// ─────────────────────────────────────────────────────────────────────────────
class _ReferenceCircleButton extends StatelessWidget {
  final double size;
  final IconData icon;
  final VoidCallback onTap;

  const _ReferenceCircleButton({
    required this.size,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          customBorder: const CircleBorder(),
          child: Ink(
            width: size,
            height: size,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFFE74CFF), Color(0xFF4700BC)],
              ),
            ),
            child: Icon(icon, color: Colors.white, size: size * 0.42),
          ),
        ),
      );
}

class _ReferencePillButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool enabled;
  final List<Color> colors;
  final VoidCallback onTap;
  final double height;

  const _ReferencePillButton({
    required this.label,
    required this.icon,
    required this.enabled,
    required this.colors,
    required this.onTap,
    required this.height,
  });

  @override
  Widget build(BuildContext context) => AnimatedOpacity(
        opacity: enabled ? 1 : 0.38,
        duration: const Duration(milliseconds: 180),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: enabled ? onTap : null,
            borderRadius: BorderRadius.circular(height / 2),
            child: Ink(
              height: height,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: colors,
                ),
                borderRadius: BorderRadius.circular(height / 2),
                border: Border.all(color: Colors.white.withOpacity(0.45)),
                boxShadow: [
                  BoxShadow(
                    color: colors.last.withOpacity(0.4),
                    blurRadius: height * 0.16,
                    offset: Offset(0, height * 0.07),
                  ),
                ],
              ),
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: height * 0.18),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(icon, color: Colors.white, size: height * 0.36),
                      SizedBox(width: height * 0.08),
                      Text(label,
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: height * 0.27,
                              fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
}

class _TimerBadge extends StatelessWidget {
  final int sec;
  final bool myTurn;
  const _TimerBadge({required this.sec, required this.myTurn});

  @override
  Widget build(BuildContext context) => Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          gradient: const RadialGradient(
            colors: [Color(0xFF123A78), Color(0xFF040B20)],
          ),
          shape: BoxShape.circle,
          border: Border.all(
              color: myTurn ? _cyan : const Color(0xFF087CFF), width: 3),
          boxShadow: [
            BoxShadow(
                color: _cyan.withOpacity(myTurn ? 0.35 : 0.12), blurRadius: 12),
          ],
        ),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text('$sec',
              style: TextStyle(
                  color: sec <= 5 ? Colors.red : _cyan,
                  fontSize: 20,
                  fontWeight: FontWeight.w900)),
          Text('sec', style: TextStyle(color: context.txtSec, fontSize: 9)),
        ]),
      );
}

// ── FAN-STYLE HAND (scrollable fan, ~6 visible cards) ───────────────────────
class _FanHand extends StatelessWidget {
  final List<WhotCard> cards;
  final int selected;
  final bool myTurn;
  final Set<int> playable;
  final ValueChanged<int> onTap;

  const _FanHand({
    required this.cards,
    required this.selected,
    required this.myTurn,
    required this.playable,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final n = cards.length;
    if (n == 0) return const SizedBox.shrink();

    const cardW = 62.0, cardH = 88.0;
    // How many cards are fanned out & visible at once (objective: ~5-6)
    final visible = min(n, 6);
    // Cards behind the fan (hidden, reachable by scrolling)
    final stacked = n - visible;

    // Angular spread per fan window
    final spread = 100.0 * min(1.0, visible / 6.0);
    final step = visible > 1 ? spread / (visible - 1) : 0.0;
    const r = 180.0;

    // Horizontal overlap so the fan reads as one curved cluster (~44% overlap)
    final overlap = cardW * 0.56;
    final windowWidth = overlap * (visible - 1) + cardW;

    return SizedBox(
      height: 170,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.symmetric(horizontal: 20.w),
        child: SizedBox(
          width: windowWidth,
          child: Stack(
            alignment: Alignment.bottomCenter,
            children: List.generate(n, (i) {
              // Fan window index (last `visible` cards fan out; earlier stack behind)
              final rel = i - stacked;
              final fanIdx = max(rel, 0);
              final isInFan = rel >= 0;

              double deg = 0, dx = 0, dy = 0;
              if (isInFan) {
                deg = -spread / 2 + fanIdx * step;
                final rad = deg * pi / 180;
                dx = r * sin(rad) + fanIdx * overlap - (windowWidth / 2);
                dy = -r * (1 - cos(rad)) * 0.18;
              } else {
                // Stacked behind — offset left of the fan
                dx =
                    -(stacked - i) * 3.0 - 26.0 - (windowWidth / 2 - cardW / 2);
                dy = 6.0;
              }

              final sel = selected == i;
              final ok = !myTurn || playable.isEmpty || playable.contains(i);

              return Positioned(
                left: windowWidth / 2 + dx - cardW / 2,
                bottom: (sel ? 22 : 0) + dy.abs(),
                child: Transform.rotate(
                  angle: isInFan ? rad(deg) * 0.8 : 0.0,
                  child: GestureDetector(
                    onTap: () => onTap(i),
                    child: Opacity(
                      opacity: ok ? 1.0 : 0.38,
                      child: _CardW(
                        card: cards[i],
                        w: cardW,
                        h: cardH,
                        selected: sel,
                        glowOrange: sel && ok,
                      ),
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }

  double rad(double deg) => deg * pi / 180;
}

class _OppFan extends StatelessWidget {
  final int count;
  const _OppFan({required this.count});

  @override
  Widget build(BuildContext context) {
    final n = min(count, 7);
    const cw = 52.0, ch = 72.0, spread = 36.0, r = 280.0;
    final step = n > 1 ? spread / (n - 1) : 0.0;

    return SizedBox(
      height: 80,
      width: double.infinity,
      child: Stack(
        alignment: Alignment.topCenter,
        children: List.generate(n, (i) {
          final deg = -spread / 2 + i * step;
          final rad = deg * pi / 180;
          return Transform.translate(
            offset: Offset(r * sin(rad), r * (1 - cos(rad)) * 0.25),
            child: Transform.rotate(
                angle: rad * 0.8,
                child: _CardW(card: WhotCard.faceDown(), w: cw, h: ch)),
          );
        }),
      ),
    );
  }
}

class _CardW extends StatelessWidget {
  final WhotCard card;
  final double w, h;
  final bool selected, glowCyan, glowOrange, shapeOnly;

  const _CardW(
      {required this.card,
      required this.w,
      required this.h,
      this.selected = false,
      this.glowCyan = false,
      this.glowOrange = false,
      this.shapeOnly = false});

  @override
  Widget build(BuildContext context) => AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: w,
        height: h,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            if (glowCyan)
              BoxShadow(
                  color: _cyan.withOpacity(0.5),
                  blurRadius: 14,
                  spreadRadius: 2),
            if (glowOrange)
              BoxShadow(
                  color: _orange.withOpacity(0.6),
                  blurRadius: 14,
                  spreadRadius: 2),
            BoxShadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 6,
                offset: const Offset(0, 3)),
          ],
        ),
        child: ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: CustomPaint(
                painter: _CardPainter(
                    card: card, sel: selected, shapeOnly: shapeOnly))),
      );
}

class _CardPainter extends CustomPainter {
  final WhotCard card;
  final bool sel;
  final bool shapeOnly;
  _CardPainter({required this.card, this.sel = false, this.shapeOnly = false});

  @override
  void paint(Canvas c, Size s) {
    final w = s.width, h = s.height;
    if (card.isFaceDown) {
      _faceDown(c, w, h);
      return;
    }

    c.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(0, 0, w, h), const Radius.circular(10)),
        Paint()..color = _cardBg);

    if (sel) {
      c.drawRRect(
          RRect.fromRectAndRadius(
              Rect.fromLTWH(1, 1, w - 2, h - 2), const Radius.circular(9)),
          Paint()
            ..color = _orange
            ..style = PaintingStyle.stroke
            ..strokeWidth = 2.5);
    }

    if (!shapeOnly) _corners(c, w, h, card.number, card.shape);
    final cx = w / 2, cy = h / 2 + (shapeOnly ? 0 : 4), r = min(w, h) * 0.28;
    if (card.shape == WhotShape.whot)
      _whotCenter(c, cx, cy, w, h);
    else
      _dbl(c, card.shape, cx, cy, r);
  }

  void _faceDown(Canvas c, double w, double h) {
    c.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(0, 0, w, h), const Radius.circular(10)),
        Paint()..color = _navyDark);
    _fdText(c, w, h);
    c.save();
    c.translate(w, h);
    c.rotate(pi);
    _fdText(c, w, h);
    c.restore();
  }

  void _fdText(Canvas c, double w, double h) {
    final st = TextStyle(
        color: _white,
        fontSize: h * 0.16,
        fontWeight: FontWeight.w900,
        height: 1.1);
    final t1 = TextPainter(
        text: TextSpan(text: 'Wọt', style: st),
        textDirection: TextDirection.ltr)
      ..layout(maxWidth: w);
    final t2 = TextPainter(
        text: TextSpan(text: 'Ẉọt', style: st),
        textDirection: TextDirection.ltr)
      ..layout(maxWidth: w);
    t1.paint(c, Offset((w - t1.width) / 2, h * 0.12));
    c.save();
    c.translate((w - t2.width) / 2 + t2.width / 2, h * 0.38 + t2.height / 2);
    c.rotate(pi);
    t2.paint(c, Offset(-t2.width / 2, -t2.height / 2));
    c.restore();
  }

  void _corners(Canvas c, double w, double h, int num, WhotShape sh) {
    final ns = TextStyle(
        color: _shapeCol, fontSize: w * 0.22, fontWeight: FontWeight.w900);
    final is_ = TextStyle(color: _shapeCol, fontSize: w * 0.14);
    final nStr = num == 20 ? '20' : '$num';
    final iStr = sh.label;
    _pt(c, nStr, ns, const Offset(3, 1));
    _pt(c, iStr, is_, Offset(4, w * 0.22 + 1));
    c.save();
    c.translate(w, h);
    c.rotate(pi);
    _pt(c, nStr, ns, const Offset(3, 1));
    _pt(c, iStr, is_, Offset(4, w * 0.22 + 1));
    c.restore();
  }

  void _pt(Canvas c, String t, TextStyle st, Offset o) {
    (TextPainter(
            text: TextSpan(text: t, style: st),
            textDirection: TextDirection.ltr)
          ..layout())
        .paint(c, o);
  }

  void _dbl(Canvas c, WhotShape sh, double cx, double cy, double r) {
    final op = Paint()
      ..color = _shapeCol
      ..style = PaintingStyle.stroke
      ..strokeWidth = r * 0.22;
    final ip = Paint()..color = _shapeCol;
    final ri = r * 0.65;
    switch (sh) {
      case WhotShape.circle:
        c.drawCircle(Offset(cx, cy), r, op);
        c.drawCircle(Offset(cx, cy), ri, ip);
        break;
      case WhotShape.square:
        c.drawRect(
            Rect.fromCenter(
                center: Offset(cx, cy), width: r * 2, height: r * 2),
            op);
        c.drawRect(
            Rect.fromCenter(
                center: Offset(cx, cy), width: ri * 2, height: ri * 2),
            ip);
        break;
      case WhotShape.triangle:
        _tri(c, op, cx, cy, r);
        _tri(c, ip, cx, cy, ri);
        break;
      case WhotShape.star:
        _star(c, op, cx, cy, r);
        _star(c, ip, cx, cy, ri);
        break;
      case WhotShape.cross:
        _cross(c, op, cx, cy, r);
        _cross(c, ip, cx, cy, ri);
        break;
      default:
        break;
    }
  }

  void _whotCenter(Canvas c, double cx, double cy, double w, double h) {
    c.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(w * 0.1, h * 0.28, w * 0.8, h * 0.38),
            const Radius.circular(6)),
        Paint()..color = _navyDark);
    final st = TextStyle(
        color: _white, fontSize: w * 0.18, fontWeight: FontWeight.w900);
    _pt(c, 'Wọt', st, Offset(cx - w * 0.18, h * 0.31));
    c.save();
    c.translate(cx, h * 0.55);
    c.rotate(pi);
    _pt(c, 'Wọt', st, Offset(-w * 0.18, -w * 0.2));
    c.restore();
  }

  void _tri(Canvas c, Paint p, double cx, double cy, double r) {
    c.drawPath(
        Path()
          ..moveTo(cx, cy - r)
          ..lineTo(cx + r, cy + r * 0.8)
          ..lineTo(cx - r, cy + r * 0.8)
          ..close(),
        p);
  }

  void _star(Canvas c, Paint p, double cx, double cy, double r) {
    final path = Path();
    final ir = r * 0.42;
    for (int i = 0; i < 10; i++) {
      final a = i * pi / 5 - pi / 2;
      final rad = i.isEven ? r : ir;
      final x = cx + rad * cos(a);
      final y = cy + rad * sin(a);
      i == 0 ? path.moveTo(x, y) : path.lineTo(x, y);
    }
    c.drawPath(path..close(), p);
  }

  void _cross(Canvas c, Paint p, double cx, double cy, double r) {
    final t = r * 0.38;
    c.drawPath(
        Path()
          ..moveTo(cx - t, cy - r)
          ..lineTo(cx + t, cy - r)
          ..lineTo(cx + t, cy - t)
          ..lineTo(cx + r, cy - t)
          ..lineTo(cx + r, cy + t)
          ..lineTo(cx + t, cy + t)
          ..lineTo(cx + t, cy + r)
          ..lineTo(cx - t, cy + r)
          ..lineTo(cx - t, cy + t)
          ..lineTo(cx - r, cy + t)
          ..lineTo(cx - r, cy - t)
          ..lineTo(cx - t, cy - t)
          ..close(),
        p);
  }

  @override
  bool shouldRepaint(_CardPainter o) => o.card != card || o.sel != sel;
}

class _PileBtn extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  const _PileBtn({required this.label, this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
              color: _orange, borderRadius: BorderRadius.circular(8)),
          child: Text(label,
              style: TextStyle(
                  color: _white,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5)),
        ),
      );
}

class _AvatarW extends StatelessWidget {
  final String name, url;
  final bool active;
  final double size;
  final bool rotated;

  const _AvatarW(
      {required this.name,
      required this.url,
      required this.active,
      this.size = 56,
      this.rotated = false});

  @override
  Widget build(BuildContext context) {
    Widget av = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.22),
        border: Border.all(
            color: active ? _cyan : context.border.withOpacity(0.1), width: 2),
        color: _navyFor(context),
      ),
      child: ClipRRect(
          borderRadius: BorderRadius.circular(size * 0.2),
          child: url.isNotEmpty
              ? Image.network(url,
                  fit: BoxFit.cover, errorBuilder: (_, __, ___) => _ini())
              : _ini()),
    );
    if (rotated) av = Transform.rotate(angle: pi, child: av);
    return Stack(clipBehavior: Clip.none, children: [
      av,
      Positioned(
          bottom: -4,
          right: -4,
          child: Container(
              width: 20,
              height: 20,
              decoration: BoxDecoration(
                  color: _navyFor(context),
                  shape: BoxShape.circle,
                  border: Border.all(color: _bgFor(context), width: 1.5)),
              child: Icon(Icons.hourglass_empty,
                  color: _txtSubFor(context), size: 12))),
    ]);
  }

  Widget _ini() => Center(
      child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: TextStyle(
              color: _cyan,
              fontSize: size * 0.38,
              fontWeight: FontWeight.w900)));
}

class _RoundBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _RoundBtn({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
                color: _orange, borderRadius: BorderRadius.circular(14)),
            child: Icon(icon, color: _white, size: 22)),
      );
}

class _GameOverDialog extends StatelessWidget {
  final bool isWinner;
  final String prizePool;
  final VoidCallback onClose;
  const _GameOverDialog(
      {required this.isWinner, required this.prizePool, required this.onClose});

  @override
  Widget build(BuildContext context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: context.card,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
                color: isWinner
                    ? _cyan.withOpacity(0.5)
                    : _orange.withOpacity(0.4)),
          ),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(isWinner ? '🏆 You Win!' : '💀 You Lost',
                style: TextStyle(
                    color: context.txtPri,
                    fontSize: 26,
                    fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            if (isWinner)
              Text('Prize: $prizePool',
                  style: TextStyle(
                      color: _orange,
                      fontSize: 18,
                      fontWeight: FontWeight.w700)),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: onClose,
              child: Container(
                  height: 50,
                  decoration: BoxDecoration(
                      color: _orange, borderRadius: BorderRadius.circular(14)),
                  child: const Center(
                      child: Text('Back to Lobby',
                          style: TextStyle(
                              color: _white,
                              fontSize: 15,
                              fontWeight: FontWeight.w800)))),
            ),
          ]),
        ),
      );
}

// ── Bokeh ──────────────────────────────────────────────────────────────────────
class _Bokeh {
  final double x, y, r, o, p;
  const _Bokeh(
      {required this.x,
      required this.y,
      required this.r,
      required this.o,
      required this.p});
}

class _BokehBg extends StatelessWidget {
  final AnimationController ctrl;
  final List<_Bokeh> bokeh;
  const _BokehBg({required this.ctrl, required this.bokeh});

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: ctrl,
        builder: (_, __) => CustomPaint(
          size: MediaQuery.of(context).size,
          painter: _BokehPainter(
            bokeh: bokeh,
            t: ctrl.value,
            bgColor: _bgFor(context),
            circleColor:
                context.isDark ? Colors.white : const Color(0xFF0D1B4B),
          ),
        ),
      );
}

class _BokehPainter extends CustomPainter {
  final List<_Bokeh> bokeh;
  final double t;
  final Color bgColor;
  final Color circleColor;
  _BokehPainter(
      {required this.bokeh,
      required this.t,
      required this.bgColor,
      required this.circleColor});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    canvas.drawRect(
      rect,
      Paint()
        ..shader = RadialGradient(
          center: const Alignment(0, -0.15),
          radius: 1.05,
          colors: [
            const Color(0xFF073B91),
            bgColor,
            const Color(0xFF010612),
          ],
          stops: const [0, 0.58, 1],
        ).createShader(rect),
    );
    for (final b in bokeh) {
      final pulse = (sin(t * 2 * pi + b.p) + 1) / 2;
      canvas.drawCircle(
        Offset(b.x * size.width, b.y * size.height),
        b.r * (0.85 + pulse * 0.3),
        Paint()
          ..color = circleColor.withOpacity(b.o * (0.6 + pulse * 0.4))
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10),
      );
    }
  }

  @override
  bool shouldRepaint(_BokehPainter o) => o.t != t;
}
