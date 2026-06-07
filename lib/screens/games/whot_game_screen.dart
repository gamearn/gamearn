import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

import 'package:gamearn/config/api_config.dart';

// ── Palette ───────────────────────────────────────────────────────────────────
const _bg = Color(0xFF0A0D1C);
const _navy = Color(0xFF0D1B4B);
const _navyDeep = Color(0xFF060D2E);
const _cyan = Color(0xFF22D1EE);
const _orange = Color(0xFFFF5E00);
const _white = Color(0xFFFFFFFF);
const _cardBg = Color(0xFFF4F6FF);
const _shapeCol = Color(0xFF0D1B4B);
const _txtPri = Color(0xFFF1F5F9);
const _txtSub = Color(0xFF94A3B8);
const _timerBg = Color(0xFF3D2B1F);

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

// ── Bot service  (only 2 endpoints: /start_game + /get_move) ─────────────────
//  /legal_actions is NO LONGER called on every move — too slow, causes deadlocks.
//  Heuristic playability is used during the game; legal_actions only on deal.
class _BotService {
  static String get _base => ApiConfig.botBaseUrl;

  Future<Map<String, dynamic>?> startGame() async {
    // Warm up Render first (fire-and-forget, short timeout)
    try {
      await http.get(Uri.parse('$_base/')).timeout(const Duration(seconds: 4));
    } catch (_) {}

    for (int attempt = 1; attempt <= 3; attempt++) {
      try {
        final timeout = attempt == 1
            ? const Duration(seconds: 60)
            : const Duration(seconds: 25);
        debugPrint('startGame attempt $attempt');
        final res = await http
            .post(
              Uri.parse('$_base/start_game'),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode({'game_name': 'whot', 'num_players': 2}),
            )
            .timeout(timeout);
        if (res.statusCode == 200) {
          debugPrint('startGame OK');
          return jsonDecode(res.body) as Map<String, dynamic>;
        }
      } catch (e) {
        debugPrint('startGame attempt $attempt error: $e');
      }
      if (attempt < 3) await Future.delayed(Duration(seconds: attempt * 2));
    }
    return null;
  }

  Future<int?> getMove(List<int> history) async {
    try {
      debugPrint('getMove history.length=${history.length}');
      final res = await http
          .post(
            Uri.parse('$_base/get_move'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'game_name': 'whot',
              'action_history': history,
              'player_rating': 1500,
            }),
          )
          .timeout(const Duration(seconds: 20));
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        debugPrint('getMove -> action=${body['action']}');
        return body['action'] as int?;
      }
      debugPrint('getMove HTTP ${res.statusCode}: ${res.body}');
    } catch (e) {
      debugPrint('getMove error: $e');
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

  // ── Game state ────────────────────────────────────────────────────────────
  List<WhotCard> _hand = [];
  int _oppCount = 4;
  WhotCard _topCard = WhotCard(shape: WhotShape.triangle, number: 14, id: '23');
  bool _isMyTurn = false; // false until deal confirms who goes first
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
  List<int> _moveHistory = []; // moves AFTER deal
  bool _botBusy = false; // single guard — replaces _isBotThinking
  int _dealerAction = 54;

  // ── Heuristic legal state (used when /legal_actions not called) ───────────
  // Just the top-card state; updated after every move.
  WhotShape _effectiveSuit = WhotShape.triangle;
  int _effectiveRank = 14;
  int _pendingDraw = 0; // pick-2 / pick-3 accumulator

  // ── Bokeh ─────────────────────────────────────────────────────────────────
  late List<_Bokeh> _bokeh;
  final _rng = Random();

  Timer? _timer;

  // ── Init ──────────────────────────────────────────────────────────────────
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
    _timer?.cancel();
    widget.socketService?.disconnect();
    super.dispose();
  }

  // ── Deal ──────────────────────────────────────────────────────────────────
  Future<void> _dealCards() async {
    setState(() {
      _isDealing = true;
      _dealFailed = false;
    });
    final result = await _bot.startGame();
    if (!mounted) return;

    if (result == null) {
      setState(() {
        _isDealing = false;
        _dealFailed = true;
      });
      return;
    }

    final rawHand = result['player_hand'] as List<dynamic>;
    final topJson = result['top_card'] as Map<String, dynamic>;
    final rawDealHist = (result['deal_history'] as List<dynamic>)
      .map((e) => (e as num).toInt())
      .toList();
    final dealHist = rawDealHist.where((a) => a < 54).toList();
    final dealerAction = rawDealHist.firstWhere((a) => a >= 54, orElse: () => 54);
    final oppCount = (result['opponent_hand_count'] as num).toInt();

    // Determine who goes first from the legal field if present
    bool myTurn = true;
    final legalJson = result['legal'] as Map<String, dynamic>?;
    if (legalJson != null) {
      myTurn = (legalJson['current_player'] as num?)?.toInt() == 0;
    }

    final topCard = WhotCard.fromJson(topJson);

    setState(() {
      _dealHistory = dealHist;
      _dealerAction = dealerAction;
      _moveHistory = [];
      _hand = rawHand
          .map((c) => WhotCard.fromJson(c as Map<String, dynamic>))
          .toList();
      _topCard = topCard;
      _oppCount = oppCount;
      _effectiveSuit = topCard.shape;
      _effectiveRank = topCard.number;
      _pendingDraw = 0;
      _isMyTurn = myTurn;
      _isDealing = false;
      _dealFailed = false;
      _botBusy = false;
    });

    if (myTurn) {
      _startTimer();
    } else {
      // Bot goes first immediately
      _runBotTurn();
    }
  }

  // ── Timer ─────────────────────────────────────────────────────────────────
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
          // Timer expired — force draw then bot turn
          if (_isMyTurn && !_botBusy) {
            _forceDrawOnTimeout();
          }
        }
      });
    });
  }

  void _forceDrawOnTimeout() {
    if (!mounted || _botBusy) return;
    // Add a draw action for the human then let bot play
    _moveHistory.add(_kDraw);
    _addDrawnCards(1);
    setState(() => _isMyTurn = false);
    _runBotTurn();
  }

  // ── Socket handlers ───────────────────────────────────────────────────────
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
  void onError(String m) => _toast(m);

  // ── Heuristic: can this card be played? ───────────────────────────────────
  bool _canPlay(WhotCard c) {
    if (c.isWhot) return true;
    if (_pendingDraw > 0) {
      // Must stack same rank or draw — only 2s on 2s, 5s on 5s
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

  // ── Play card ─────────────────────────────────────────────────────────────
  Future<void> _playCard({WhotShape? chosen, bool nominateOnly = false}) async {
    if (nominateOnly) {
      // Called after Whot card was already removed from hand
      final nomAction = _kNomBase + _suitFromShape(chosen!);
      _moveHistory.add(nomAction);
      widget.socketService?.emitPlayCard(
          widget.roomId, widget.playerId, _topCard,
          chosenShape: chosen);
      setState(() {
        _effectiveSuit = chosen;
        _topCard =
            WhotCard(shape: chosen, number: _topCard.number, id: _topCard.id);
        _showShapeChooser = false;
        _isMyTurn = false;
      });
      HapticFeedback.lightImpact();
      _runBotTurn();
      return;
    }

    if (_selectedIdx < 0 || !_isMyTurn || _botBusy) return;
    final card = _hand[_selectedIdx];

    if (!_canPlay(card)) {
      _toast('Not a legal move');
      return;
    }
    if (card.isWhot && chosen == null) {
      setState(() => _showShapeChooser = true);
      return;
    }

    _timer?.cancel();

    final actionId = _deckAction(card);
    _moveHistory.add(actionId);

    if (card.isWhot && chosen != null) {
      _moveHistory.add(_kNomBase + _suitFromShape(chosen));
    }

    widget.socketService?.emitPlayCard(widget.roomId, widget.playerId, card,
        chosenShape: chosen);

    final newSuit = chosen ?? card.shape;
    final newRank = card.number;

    setState(() {
      _topCard = WhotCard(shape: newSuit, number: newRank, id: card.id);
      _effectiveSuit = newSuit;
      _effectiveRank = newRank;
      _hand.removeAt(_selectedIdx);
      _selectedIdx = -1;
      _showShapeChooser = false;
      _isMyTurn = false;
    });
    HapticFeedback.lightImpact();

    // Special cards that the PLAYER just played
    _handlePlayerSpecial(newRank);

    // If Whot and no chosen shape yet, show picker before bot goes
    if (card.isWhot && chosen == null) {
      setState(() => _showShapeChooser = true);
      return;
    }

    _runBotTurn();
  }

  void _handlePlayerSpecial(int rank) {
    switch (rank) {
      case 1:
        _toast('Hold On! You play again.');
        break;
      case 2:
        _toast('Pick Two on opponent!');
        _oppCount += 2;
        break;
      case 5:
        _toast('Pick Three on opponent!');
        _oppCount += 3;
        break;
      case 8:
        _toast('Suspension!');
        break;
      case 14:
        _toast('General Market!');
        _addDrawnCards(1);
        break;
      case 20:
        _toast('Whot! Choose a shape.');
        break;
    }
  }

  // ── Draw card ─────────────────────────────────────────────────────────────
  Future<void> _drawCard() async {
    if (!_isMyTurn || _botBusy) return;
    _timer?.cancel();

    final count = _pendingDraw > 0 ? _pendingDraw : 1;
    _moveHistory.add(_kDraw);
    _addDrawnCards(count);

    widget.socketService?.emitDrawCard(widget.roomId, widget.playerId);

    setState(() {
      _isMyTurn = false;
      _pendingDraw = 0;
      _selectedIdx = -1;
      _calledCard = false;
    });
    HapticFeedback.selectionClick();

    _runBotTurn();
  }

  // ── Draw cards helper (uses real deck) ────────────────────────────────────
  void _addDrawnCards(int count) {
    final used = <int>{};
    for (final c in _hand) {
      final id = int.tryParse(c.id ?? '');
      if (id != null) used.add(id);
    }
    final available = List.generate(_kDeck.length, (i) => i)
        .where((i) => !used.contains(i))
        .toList()
      ..shuffle(_rng);
    for (var i = 0; i < count; i++) {
      if (i < available.length) {
        final idx = available[i];
        final (s, n) = _kDeck[idx];
        _hand.add(WhotCard(shape: s, number: n, id: idx.toString()));
      } else {
        _hand.add(WhotCard.faceDown());
      }
    }
  }

  // ── Bot turn ──────────────────────────────────────────────────────────────
  //  ONE HTTP call per turn. No /legal_actions. No recursive loops.
  Future<void> _runBotTurn() async {
    if (!mounted) return;
    if (_botBusy) {
      debugPrint('runBotTurn: already busy, skipping');
      return;
    }
    _botBusy = true;

    try {
      await Future.delayed(const Duration(milliseconds: 400)); // small UX pause

      final fullHistory = [_dealerAction, ..._dealHistory, ..._moveHistory];
      final action = await _bot.getMove(fullHistory);

      if (!mounted) return;

      if (action == null) {
        // Network failure — give turn back, player can still play
        debugPrint('runBotTurn: getMove returned null, giving turn back');
        setState(() => _isMyTurn = true);
        _startTimer();
        return;
      }

      _moveHistory.add(action);

      // ── Suit nomination ──────────────────────────────────────────────────
      if (action >= _kNomBase && action < _kNomBase + 5) {
        final shape = _shapeFromSuit(action - _kNomBase);
        setState(() {
          _effectiveSuit = shape;
          _topCard =
              WhotCard(shape: shape, number: _topCard.number, id: _topCard.id);
        });
        _toast('${widget.opponentName} chose ${shape.name}');
        _botBusy = false;
        _runBotTurn();
        return;
      }

      // ── Bot drew ─────────────────────────────────────────────────────────
      if (action == _kDraw) {
        setState(() {
          _oppCount++;
          _pendingDraw = 0;
          _isMyTurn = true;
        });
        _startTimer();
        return;
      }

      // ── Bot played a card ─────────────────────────────────────────────────
      final played = _deckCard(action);
      setState(() {
        _topCard = played;
        _effectiveSuit = played.shape;
        _effectiveRank = played.number;
        if (_oppCount > 0) _oppCount--;
      });

      // Handle special effects of bot's card on the human
      final humanContinues = _handleBotSpecial(played.number);

      if (!humanContinues) {
        // Bot plays again (Hold On / Suspension on human / Whot card needs nomination)
        // Wait briefly then recurse for next bot action
        await Future.delayed(const Duration(milliseconds: 600));
        _botBusy = false; // release so _runBotTurn can run again
        _runBotTurn();
        return;
      }

      setState(() => _isMyTurn = true);
      _startTimer();
    } catch (e) {
      debugPrint('runBotTurn error: $e');
      if (mounted) {
        setState(() => _isMyTurn = true);
        _startTimer();
      }
    } finally {
      _botBusy = false;
      if (mounted) setState(() {});
    }
  }

  /// Returns true if it's now the human's turn.
  bool _handleBotSpecial(int rank) {
    switch (rank) {
      case 1:
        _toast('Hold On! ${widget.opponentName} plays again.');
        return false; // bot plays again
      case 2:
        _pendingDraw = (_pendingDraw > 0 ? _pendingDraw : 0) + 2;
        _toast('Pick Two! You must pick $_pendingDraw or stack.');
        return true;
      case 5:
        _pendingDraw = (_pendingDraw > 0 ? _pendingDraw : 0) + 3;
        _toast('Pick Three! You must pick $_pendingDraw or stack.');
        return true;
      case 8:
        _toast('Suspension! Your turn is skipped.');
        return false; // bot plays again (skip human)
      case 14:
        _addDrawnCards(1);
        setState(() {});
        _toast('General Market! You picked 1.');
        return true;
      case 20:
        _toast('Whot! ${widget.opponentName} is choosing a shape…');
        return false; // bot will nominate on next action
      default:
        return true;
    }
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
          style: const TextStyle(color: _txtPri, fontWeight: FontWeight.w600)),
      backgroundColor: _navy,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: const Duration(seconds: 2),
    ));
  }

  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B0E1A),
      body: Stack(children: [
        _BokehBg(ctrl: _bokehCtrl, bokeh: _bokeh),
        _portrait(),
        if (_isDealing)  _loadingOverlay(),
        if (_dealFailed) _errorOverlay(),
        if (_showShapeChooser) _shapeChooser(),
        if (_showCallOverlay)  _callCardOverlay(),
      ]),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PORTRAIT  (Figma: Section 3 — 390×844)
  // ─────────────────────────────────────────────────────────────────────────
  Widget _portrait() => SafeArea(
    child: Column(children: [

      // ── HEADER ─────────────────────────────────────────────────────────
      // Figma: title + prize at top, back arrow left
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: Row(children: [
          GestureDetector(
            onTap: widget.onBack ?? () => Navigator.maybePop(context),
            child: Container(
              width: 37, height: 37,
              decoration: BoxDecoration(
                // Figma section-5 exit btn: #FF5E00, rx=4
                color: _orange,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Icon(Icons.arrow_back_ios_new_rounded,
                  color: Colors.white, size: 16),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.tournamentTitle,
                    style: const TextStyle(
                        color: _orange,
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.8)),
                Text('Prize Pool: ${widget.prizePool}',
                    style: const TextStyle(
                        color: _cyan, fontSize: 11,
                        fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          // Timer badge
          _TimerBadge(sec: _timerSec, myTurn: _isMyTurn && !_botBusy),
        ]),
      ),

      // ── MAIN TABLE — Figma: y=99 x=25 w=340 h=662 rx=11 ───────────────
      Expanded(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(11),
              border: Border.all(color: Colors.white.withOpacity(0.06)),
            ),
            child: Column(children: [
              const SizedBox(height: 12),

              // ── BOT SECTION ──────────────────────────────────────────────
              // Figma: opponent avatar + name + fanned face-down cards at top
              _oppSection(),

              const Spacer(),

              // ── TOP CARD + DRAW PILE — centre ────────────────────────────
              // Figma: big top-card display 100×100 #22D1EE rx=16
              //        inner 80×80 #1E293B rx=16
              //        draw pile left, discard right
              _centreArea(),

              const Spacer(),

              // ── ACTION CHIPS ─────────────────────────────────────────────
              // Figma: "Last Card" x=32 w=72 h=29 #FF5E00 rx=14
              //        "Draw Card" x=266 w=93 h=29 #FF5E00 rx=14
              _actionChips(),

              const SizedBox(height: 10),

              // ── HUMAN HAND ───────────────────────────────────────────────
              // Figma: cards fanned at bottom, stagger right+slight-down
              _handFan(),

              const SizedBox(height: 12),
            ]),
          ),
        ),
      ),
    ]),
  );

  // ── OPPONENT SECTION ──────────────────────────────────────────────────────
  Widget _oppSection() => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Avatar + name
        Column(mainAxisSize: MainAxisSize.min, children: [
          _AvatarW(
            name: widget.opponentName,
            url: widget.opponentAvatar,
            active: !_isMyTurn && !_botBusy,
            size: 42,
          ),
          const SizedBox(height: 4),
          Text(widget.opponentName,
              style: const TextStyle(
                  color: _txtPri, fontSize: 11,
                  fontWeight: FontWeight.w600)),
          if (_botBusy)
            const Text('thinking…',
                style: TextStyle(color: _cyan, fontSize: 10)),
        ]),
        const SizedBox(width: 12),
        // Bot hand — fanned face-down
        // Figma: 5 cards ~64×93 stagger x+28 y+13
        Expanded(
          child: SizedBox(
            height: 80,
            child: _OppFan(count: _oppCount),
          ),
        ),
        // Card count badge
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            shape: BoxShape.circle,
            border: Border.all(color: _cyan.withOpacity(0.3)),
          ),
          child: Center(
            child: Text('$_oppCount',
                style: const TextStyle(
                    color: _cyan,
                    fontSize: 14, fontWeight: FontWeight.w800)),
          ),
        ),
      ],
    ),
  );

  // ── CENTRE AREA ───────────────────────────────────────────────────────────
  // Figma: draw pile (face-down stack) left, big top-card display right
  Widget _centreArea() => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      // Draw pile — stacked face-down cards
      GestureDetector(
        onTap: (_isMyTurn && !_botBusy) ? _drawCard : null,
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Shadow cards beneath
            for (int i = 2; i >= 1; i--)
              Positioned(
                left: i * 2.0, top: -(i * 2.0),
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
      // Top card display — Figma: 100×100 #22D1EE rx=16, inner 80×80 #1E293B
      Container(
        width: 100, height: 100,
        decoration: BoxDecoration(
          color: _cyan,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
                color: _cyan.withOpacity(0.35),
                blurRadius: 20, spreadRadius: 2)
          ],
        ),
        child: Center(
          child: Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Center(
              child: _CardW(card: _topCard, w: 64, h: 80),
            ),
          ),
        ),
      ),
    ],
  );

  // ── ACTION CHIPS ─────────────────────────────────────────────────────────
  // Figma: "Last Card" 72×29 rx=14 #FF5E00  |  "Draw Card" 93×29 rx=14 #FF5E00
  Widget _actionChips() {
    final canCallCard = _hand.length == 1 && !_calledCard;
    final canDraw     = _isMyTurn && !_botBusy;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Last Card chip
          GestureDetector(
            onTap: canCallCard ? _callCard : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 90, height: 29,
              decoration: BoxDecoration(
                color: canCallCard ? _orange : _orange.withOpacity(0.3),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(
                child: Text('Last Card!',
                    style: TextStyle(
                        color: canCallCard ? Colors.white : Colors.white54,
                        fontSize: 11, fontWeight: FontWeight.w800)),
              ),
            ),
          ),
          // Play selected card
          if (_selectedIdx >= 0 && _selectedIdx < _hand.length &&
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
                          fontSize: 11, fontWeight: FontWeight.w800)),
                ),
              ),
            ),
          // Draw card chip
          GestureDetector(
            onTap: canDraw ? _drawCard : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 93, height: 29,
              decoration: BoxDecoration(
                color: canDraw ? _orange : _orange.withOpacity(0.3),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(
                child: Text('Draw Card',
                    style: TextStyle(
                        color: canDraw ? Colors.white : Colors.white54,
                        fontSize: 11, fontWeight: FontWeight.w800)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── HUMAN HAND FAN ────────────────────────────────────────────────────────
  // Figma: cards fanned at bottom, face-up, stagger right+slight-down
  Widget _handFan() {
    final playable = _playableIndices();
    return SizedBox(
      height: 130,
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

  Widget _landscape() => SafeArea(
    child: Stack(children: [
      Positioned(
        top: 12, right: 12,
        child: GestureDetector(
          onTap: () => setState(() => _isLandscape = false),
          child: Container(
            width: 37, height: 37,
            decoration: BoxDecoration(
                color: _orange, borderRadius: BorderRadius.circular(4)),
            child: const Icon(Icons.close_rounded,
                color: Colors.white, size: 18),
          ),
        ),
      ),
      Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          // Bot hand at top (compact)
          SizedBox(
            height: 70,
            child: _OppFan(count: _oppCount),
          ),
          const SizedBox(height: 16),
          // Centre: draw + top card side by side
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            GestureDetector(
              onTap: (_isMyTurn && !_botBusy) ? _drawCard : null,
              child: _CardW(card: WhotCard.faceDown(), w: 44, h: 64),
            ),
            const SizedBox(width: 16),
            // Compact top card: Figma 74×74 #22D1EE rx=12
            Container(
              width: 74, height: 74,
              decoration: BoxDecoration(
                  color: _cyan, borderRadius: BorderRadius.circular(12),
                  boxShadow: [BoxShadow(
                      color: _cyan.withOpacity(0.3), blurRadius: 12)]),
              child: Center(
                child: Container(
                  width: 59, height: 59,
                  decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(11)),
                  child: Center(
                      child: _CardW(card: _topCard, w: 50, h: 62)),
                ),
              ),
            ),
            const SizedBox(width: 16),
            // Last-card badge: Figma 50×20 #FF5E00 rx=10
            GestureDetector(
              onTap: (_hand.length == 1 && !_calledCard) ? _callCard : null,
              child: Container(
                width: 50, height: 20,
                decoration: BoxDecoration(
                  color: (_hand.length == 1 && !_calledCard)
                      ? _orange : _orange.withOpacity(0.35),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Center(
                  child: Text('Last Card',
                      style: TextStyle(color: Colors.white,
                          fontSize: 9, fontWeight: FontWeight.w800)),
                ),
              ),
            ),
          ]),
          const SizedBox(height: 16),
          // Human hand
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
            style: TextStyle(color: _cyan, fontSize: 16,
                fontWeight: FontWeight.w700)),
      ]),
    ),
  );

  Widget _errorOverlay() => Container(
    color: Colors.black87,
    child: Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Icon(Icons.wifi_off_rounded, color: _orange, size: 48),
        const SizedBox(height: 12),
        const Text('Failed to connect to game server',
            style: TextStyle(color: Colors.white, fontSize: 15)),
        const SizedBox(height: 20),
        GestureDetector(
          onTap: _dealCards,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
            decoration: BoxDecoration(
                color: _orange, borderRadius: BorderRadius.circular(12)),
            child: const Text('Retry',
                style: TextStyle(color: Colors.white,
                    fontSize: 15, fontWeight: FontWeight.w800)),
          ),
        ),
      ]),
    ),
  );

  Widget _shapeChooser() {
    const suits = [
      (WhotShape.circle,   '●  Circle'),
      (WhotShape.triangle, '▲  Triangle'),
      (WhotShape.cross,    '✚  Cross'),
      (WhotShape.square,   '■  Square'),
      (WhotShape.star,     '★  Star'),
    ];
    return Container(
      color: Colors.black.withOpacity(0.85),
      child: Center(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 32),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: _cyan.withOpacity(0.3)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Choose a suit',
                  style: TextStyle(color: Colors.white,
                      fontSize: 18, fontWeight: FontWeight.w800)),
              const SizedBox(height: 20),
              ...suits.map((s) => GestureDetector(
                onTap: () => _playCard(chosen: s.$1),
                child: Container(
                  width: double.infinity,
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _cyan.withOpacity(0.2)),
                  ),
                  child: Center(child: Text(s.$2,
                      style: const TextStyle(color: Colors.white,
                          fontSize: 16, fontWeight: FontWeight.w600))),
                ),
              )),
            ],
          ),
        ),
      ),
    );
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
              style: TextStyle(color: Colors.white,
                  fontSize: 24, fontWeight: FontWeight.w900)),
        ),
      ),
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TIMER BADGE — top-right of header
// ─────────────────────────────────────────────────────────────────────────────
class _TimerBadge extends StatelessWidget {
  final int sec;
  final bool myTurn;
  const _TimerBadge({required this.sec, required this.myTurn});

  @override
  Widget build(BuildContext context) => Container(
    width: 52, height: 52,
    decoration: BoxDecoration(
      color: const Color(0xFF1E293B),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(
          color: myTurn ? _cyan : Colors.white.withOpacity(0.1), width: 2),
    ),
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Text('$sec',
          style: TextStyle(
              color: sec <= 5 ? Colors.red : _cyan,
              fontSize: 20, fontWeight: FontWeight.w900)),
      const Text('sec',
          style: TextStyle(color: _txtSub, fontSize: 9)),
    ]),
  );
}

class _FanHand extends StatelessWidget {
  final List<WhotCard> cards;
  final int selected;
  final bool myTurn;
  final Set<int> playable;
  final ValueChanged<int> onTap;

  const _FanHand(
      {required this.cards,
      required this.selected,
      required this.myTurn,
      required this.playable,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    final n = cards.length;
    if (n == 0) return const SizedBox.shrink();
    const cardW = 62.0, cardH = 88.0;
    final spread = 40.0 * min(1.0, n / 6);
    final step = n > 1 ? spread / (n - 1) : 0.0;
    const r = 320.0;

    return SizedBox(
      height: 140,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: List.generate(n, (i) {
          final deg = -spread / 2 + i * step;
          final rad = deg * pi / 180;
          final dx = r * sin(rad);
          final dy = -r * (1 - cos(rad)) * 0.35;
          final sel = selected == i;
          final ok = !myTurn || playable.isEmpty || playable.contains(i);

          return Positioned(
            bottom: sel ? 20 : 0,
            child: Transform.translate(
              offset: Offset(dx, dy),
              child: Transform.rotate(
                angle: rad * 0.8,
                child: GestureDetector(
                  onTap: () => onTap(i),
                  child: Opacity(
                      opacity: ok ? 1.0 : 0.38,
                      child: _CardW(
                          card: cards[i],
                          w: cardW,
                          h: cardH,
                          selected: sel,
                          glowOrange: sel && ok)),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
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
  final bool selected, glowCyan, glowOrange;

  const _CardW(
      {required this.card,
      required this.w,
      required this.h,
      this.selected = false,
      this.glowCyan = false,
      this.glowOrange = false});

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
            child:
                CustomPaint(painter: _CardPainter(card: card, sel: selected))),
      );
}

class _CardPainter extends CustomPainter {
  final WhotCard card;
  final bool sel;
  _CardPainter({required this.card, this.sel = false});

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

    _corners(c, w, h, card.number, card.shape);
    final cx = w / 2, cy = h / 2 + 4, r = min(w, h) * 0.28;
    if (card.shape == WhotShape.whot)
      _whotCenter(c, cx, cy, w, h);
    else
      _dbl(c, card.shape, cx, cy, r);
  }

  void _faceDown(Canvas c, double w, double h) {
    c.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(0, 0, w, h), const Radius.circular(10)),
        Paint()..color = _navy);
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
        Paint()..color = _navy);
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

class _ShapeOnly extends CustomPainter {
  final WhotShape shape;
  _ShapeOnly({required this.shape});
  @override
  void paint(Canvas c, Size s) {
    _CardPainter(card: WhotCard(shape: shape, number: 1))._dbl(
        c, shape, s.width / 2, s.height / 2, min(s.width, s.height) * 0.32);
  }

  @override
  bool shouldRepaint(_ShapeOnly o) => o.shape != shape;
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
              style: const TextStyle(
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
            color: active ? _cyan : Colors.white.withOpacity(0.1), width: 2),
        color: _navy,
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
                  color: _navy,
                  shape: BoxShape.circle,
                  border: Border.all(color: _bg, width: 1.5)),
              child:
                  const Icon(Icons.hourglass_empty, color: _txtSub, size: 12))),
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
            color: _navy,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(
                color: isWinner
                    ? _cyan.withOpacity(0.5)
                    : _orange.withOpacity(0.4)),
          ),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(isWinner ? '🏆 You Win!' : '💀 You Lost',
                style: const TextStyle(
                    color: _txtPri, fontSize: 26, fontWeight: FontWeight.w900)),
            const SizedBox(height: 8),
            if (isWinner)
              Text('Prize: $prizePool',
                  style: const TextStyle(
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
          painter: _BokehPainter(bokeh: bokeh, t: ctrl.value),
        ),
      );
}

class _BokehPainter extends CustomPainter {
  final List<_Bokeh> bokeh;
  final double t;
  _BokehPainter({required this.bokeh, required this.t});

  @override
  void paint(Canvas canvas, Size size) {
    canvas.drawRect(
        Rect.fromLTWH(0, 0, size.width, size.height), Paint()..color = _bg);
    for (final b in bokeh) {
      final pulse = (sin(t * 2 * pi + b.p) + 1) / 2;
      canvas.drawCircle(
        Offset(b.x * size.width, b.y * size.height),
        b.r * (0.85 + pulse * 0.3),
        Paint()
          ..color = Colors.white.withOpacity(b.o * (0.6 + pulse * 0.4))
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10),
      );
    }
  }

  @override
  bool shouldRepaint(_BokehPainter o) => o.t != t;
}
