import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

import 'package:gamearn/config/api_config.dart';

// ─────────────────────────────────────────────────────────────────────────────
//  WHOT GAME SCREEN  –  Gamearn
//
//  Matches Figma exactly:
//    • Dark navy #0B0E1A bg with coin bokeh
//    • White cards, navy shapes, double-border outline style
//    • Face-down cards: navy bg with mirrored "Wọt" text
//    • Arc-fan hand layout
//    • Timer widget (avatar + countdown, cyan glow)
//    • Tournament header (title + prize pool)
//    • Orange DRAW / DISCARD PILE labelled button-cards
//    • End Game (orange) + Rotate (teal) bottom bar
//    • Landscape rotate mode (players on left/right sides)
//
//  Socket.io integration:
//    • Plug in your socket_io_client package and call WhotGameScreen
//      with a live [WhotSocketService] to go online.
//    • All state changes that should be emitted are marked  // ← EMIT
//    • All incoming event handlers are marked               // ← LISTEN
// ─────────────────────────────────────────────────────────────────────────────

// ── Palette ──────────────────────────────────────────────────────────────────
const _bg = Color(0xFF0A0D1C);
const _navy = Color(0xFF0D1B4B);
const _navyDeep = Color(0xFF060D2E);
const _cyan = Color(0xFF22D1EE);
const _orange = Color(0xFFFF5E00);
const _white = Color(0xFFFFFFFF);
const _cardBg = Color(0xFFF4F6FF);
const _shapeColor = Color(0xFF0D1B4B);
const _textPrimary = Color(0xFFF1F5F9);
const _textSub = Color(0xFF94A3B8);
const _green = Color(0xFF00E676);
const _timerBg = Color(0xFF3D2B1F);

// ── Whot shapes ───────────────────────────────────────────────────────────────
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
  final int number; // 1–14 normal, 20 = Whot
  final bool isFaceDown;
  final String? id; // server-assigned card id

  const WhotCard({
    required this.shape,
    required this.number,
    this.isFaceDown = false,
    this.id,
  });

  factory WhotCard.faceDown() =>
      const WhotCard(shape: WhotShape.circle, number: 0, isFaceDown: true);

  /// Deserialize from server JSON: {"id":"c42","shape":"triangle","number":14}
  factory WhotCard.fromJson(Map<String, dynamic> json) {
    final shapeMap = {
      'cross': WhotShape.cross,
      'square': WhotShape.square,
      'circle': WhotShape.circle,
      'triangle': WhotShape.triangle,
      'star': WhotShape.star,
      'whot': WhotShape.whot,
    };
    return WhotCard(
      shape: shapeMap[json['shape']] ?? WhotShape.circle,
      number: (json['number'] as num).toInt(),
      id: json['id']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'shape': shape.name,
        'number': number,
      };

  bool get isWhot => shape == WhotShape.whot || number == 20;
}

// OpenSpiel whot.cc kDeck order (action index = card id from /start_game).
const _kOpenSpielDeck = <(WhotShape, int)>[
  (WhotShape.circle, 1), (WhotShape.circle, 2), (WhotShape.circle, 3),
  (WhotShape.circle, 4), (WhotShape.circle, 5), (WhotShape.circle, 7),
  (WhotShape.circle, 8), (WhotShape.circle, 10), (WhotShape.circle, 11),
  (WhotShape.circle, 12), (WhotShape.circle, 13), (WhotShape.circle, 14),
  (WhotShape.triangle, 1), (WhotShape.triangle, 2), (WhotShape.triangle, 3),
  (WhotShape.triangle, 4), (WhotShape.triangle, 5), (WhotShape.triangle, 7),
  (WhotShape.triangle, 8), (WhotShape.triangle, 10), (WhotShape.triangle, 11),
  (WhotShape.triangle, 12), (WhotShape.triangle, 13), (WhotShape.triangle, 14),
  (WhotShape.cross, 1), (WhotShape.cross, 2), (WhotShape.cross, 3),
  (WhotShape.cross, 5), (WhotShape.cross, 7), (WhotShape.cross, 10),
  (WhotShape.cross, 11), (WhotShape.cross, 13), (WhotShape.cross, 14),
  (WhotShape.square, 1), (WhotShape.square, 2), (WhotShape.square, 3),
  (WhotShape.square, 5), (WhotShape.square, 7), (WhotShape.square, 10),
  (WhotShape.square, 11), (WhotShape.square, 13), (WhotShape.square, 14),
  (WhotShape.star, 1), (WhotShape.star, 2), (WhotShape.star, 3),
  (WhotShape.star, 4), (WhotShape.star, 5), (WhotShape.star, 7),
  (WhotShape.star, 8),
  (WhotShape.whot, 20), (WhotShape.whot, 20), (WhotShape.whot, 20),
  (WhotShape.whot, 20), (WhotShape.whot, 20),
];

const _kOpenSpielDraw = 54;
const _kOpenSpielNominateBase = 55;

WhotCard _cardFromOpenSpielAction(int action) {
  if (action < 0 || action >= _kOpenSpielDeck.length) {
    return const WhotCard(shape: WhotShape.circle, number: 1, id: '0');
  }
  final (shape, number) = _kOpenSpielDeck[action];
  return WhotCard(shape: shape, number: number, id: action.toString());
}

WhotShape? _shapeFromSuitName(String name) {
  switch (name) {
    case 'circle':
      return WhotShape.circle;
    case 'triangle':
      return WhotShape.triangle;
    case 'cross':
      return WhotShape.cross;
    case 'square':
      return WhotShape.square;
    case 'star':
      return WhotShape.star;
    default:
      return null;
  }
}

WhotShape _shapeFromOpenSpielSuit(int suit) {
  switch (suit) {
    case 0:
      return WhotShape.circle;
    case 1:
      return WhotShape.triangle;
    case 2:
      return WhotShape.cross;
    case 3:
      return WhotShape.square;
    case 4:
      return WhotShape.star;
    default:
      return WhotShape.circle;
  }
}

int _openSpielSuitFromShape(WhotShape shape) {
  switch (shape) {
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

int _cardToOpenSpielAction(WhotCard card) {
  final id = int.tryParse(card.id ?? '');
  if (id != null && id >= 0 && id < _kOpenSpielDeck.length) return id;
  for (var i = 0; i < _kOpenSpielDeck.length; i++) {
    final (s, n) = _kOpenSpielDeck[i];
    if (s == card.shape && n == card.number) return i;
  }
  return 0;
}

// ── Socket service interface (plug in socket_io_client here) ──────────────────
abstract class WhotSocketService {
  /// Called once the screen is mounted. Connect your socket here.
  void connect({
    required String roomId,
    required String playerId,
    required WhotGameEventHandler handler,
  });

  /// Play a card. Server validates + broadcasts.
  // ← EMIT  "play_card"  { roomId, playerId, cardId, chosenShape? }
  void emitPlayCard(String roomId, String playerId, WhotCard card,
      {WhotShape? chosenShape});

  /// Draw a card from the pile.
  // ← EMIT  "draw_card"  { roomId, playerId }
  void emitDrawCard(String roomId, String playerId);

  /// Call card (last card announcement).
  // ← EMIT  "call_card"  { roomId, playerId }
  void emitCallCard(String roomId, String playerId);

  void disconnect();
}

/// Your screen registers one of these with the socket service.
abstract class WhotGameEventHandler {
  // ← LISTEN  "game_state"   – full state sync on join/reconnect
  void onGameState(Map<String, dynamic> state);

  // ← LISTEN  "card_played"  – opponent played a card
  void onCardPlayed(Map<String, dynamic> data);

  // ← LISTEN  "card_drawn"   – opponent drew a card (count only)
  void onCardDrawn(Map<String, dynamic> data);

  // ← LISTEN  "your_turn"    – server says it's your turn now
  void onYourTurn();

  // ← LISTEN  "opponent_turn"
  void onOpponentTurn();

  // ← LISTEN  "market"       – pick-two / pick-three penalty
  void onMarket(int count);

  // ← LISTEN  "suspension"   – suspension card played (skip turn)
  void onSuspension();

  // ← LISTEN  "general_market"  – general market (everyone draws)
  void onGeneralMarket();

  // ← LISTEN  "choose_shape"  – Whot card played, must choose shape
  void onChooseShape();

  // ← LISTEN  "call_card"    – opponent called card
  void onCallCard(String playerId);

  // ← LISTEN  "game_over"    – { winnerId, scores }
  void onGameOver(Map<String, dynamic> data);

  // ← LISTEN  "timer_tick"   – { seconds }
  void onTimerTick(int seconds);

  // ← LISTEN  "error"        – { message }
  void onError(String message);
}

// ── Legal actions from OpenSpiel (source of truth for UI gating) ─────────────
class LegalActionsResult {
  final int currentPlayer;
  final bool isTerminal;
  final List<int> legalActions;
  final List<int> playableCardIds;
  final bool canDraw;
  final List<String> nominateSuits;
  final int pendingDraw;

  const LegalActionsResult({
    required this.currentPlayer,
    required this.isTerminal,
    required this.legalActions,
    required this.playableCardIds,
    required this.canDraw,
    required this.nominateSuits,
    required this.pendingDraw,
  });

  factory LegalActionsResult.fromJson(Map<String, dynamic> json) {
    return LegalActionsResult(
      currentPlayer: (json['current_player'] as num).toInt(),
      isTerminal: json['is_terminal'] as bool? ?? false,
      legalActions: (json['legal_actions'] as List<dynamic>?)
              ?.map((e) => (e as num).toInt())
              .toList() ??
          [],
      playableCardIds: (json['playable_card_ids'] as List<dynamic>?)
              ?.map((e) => (e as num).toInt())
              .toList() ??
          [],
      canDraw: json['can_draw'] as bool? ?? false,
      nominateSuits: (json['nominate_suits'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      pendingDraw: (json['pending_draw'] as num?)?.toInt() ?? 0,
    );
  }

  bool get mustNominateSuit => nominateSuits.isNotEmpty;
}

// ── Gamearn Bot AI Bridge ────────────────────────────────────────────────────
class _GamearnBotService {
  static String get _base => ApiConfig.botBaseUrl;

  /// Called once on game start — deals real cards via OpenSpiel chance phase.
  Future<Map<String, dynamic>?> fetchStartGame() async {
    try {
      final res = await http
          .post(
            Uri.parse('$_base/start_game'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'game_name': 'whot', 'num_players': 2}),
          )
          .timeout(const Duration(seconds: 20));
      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  /// Get bot next move. action_history MUST include deal_history prefix.
  Future<int?> fetchMctsMove(List<int> actionHistory) async {
    try {
      final res = await http
          .post(
            Uri.parse('$_base/get_move'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'game_name': 'whot',
              'action_history': actionHistory,
              'player_rating': 1500,
            }),
          )
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        return body['action'] as int?;
      }
    } catch (_) {}
    return null;
  }

  Future<LegalActionsResult?> fetchLegalActions(List<int> actionHistory) async {
    try {
      final res = await http
          .post(
            Uri.parse('$_base/legal_actions'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'game_name': 'whot',
              'action_history': actionHistory,
            }),
          )
          .timeout(const Duration(seconds: 8));
      if (res.statusCode == 200) {
        return LegalActionsResult.fromJson(
            jsonDecode(res.body) as Map<String, dynamic>);
      }
    } catch (_) {}
    return null;
  }
}

// ── Dummy socket (offline / bot mode) ────────────────────────────────────────
class _DummySocketService extends WhotSocketService {
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

// ═════════════════════════════════════════════════════════════════════════════
//  WHOT GAME SCREEN
// ═════════════════════════════════════════════════════════════════════════════
class WhotGameScreen extends StatefulWidget {
  final String roomId;
  final String playerId;
  final String playerName;
  final String playerAvatar; // network url or ''
  final String opponentName;
  final String opponentAvatar;
  final String tournamentTitle;
  final String prizePool; // e.g. "₦70,000"
  final WhotSocketService? socketService;
  final VoidCallback? onBack;

  const WhotGameScreen({
    super.key,
    required this.roomId,
    required this.playerId,
    this.playerName = 'You',
    this.playerAvatar = '',
    this.opponentName = 'Opponent',
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
  // ── Animation controllers ─────────────────────────────────────────────────
  late AnimationController _bokeCtrl;
  late AnimationController _timerGlowCtrl;
  late Animation<double> _timerGlow;

  // ── Game state ────────────────────────────────────────────────────────────
  List<WhotCard> _playerHand = [
    WhotCard(shape: WhotShape.cross, number: 2, id: 'c1'),
    WhotCard(shape: WhotShape.square, number: 3, id: 'c2'),
    WhotCard(shape: WhotShape.whot, number: 20, id: 'c3'),
    WhotCard(shape: WhotShape.star, number: 8, id: 'c4'),
    WhotCard(shape: WhotShape.circle, number: 10, id: 'c5'),
  ];
  int _opponentCardCount = 5;
  WhotCard _topCard =
      WhotCard(shape: WhotShape.triangle, number: 14, id: 'top');

  bool _isMyTurn = true;
  int _timerSeconds = 15;
  Timer? _countdownTimer;

  int _selectedIndex = -1;
  bool _showShapeChooser = false;
  bool _showCallCardOverlay = false;
  bool _isLandscape = false;

  late WhotSocketService _socket;

  // ── Bot AI bridge (used when socketService == null → offline/bot mode) ────
  final _GamearnBotService _aiEngine = _GamearnBotService();

  // Deal history from /start_game — prepended to every /get_move call so
  // MCTS reconstructs the full game state including the deal phase.
  List<int> _dealHistory = [];

  // OpenSpiel action sequence. Always send _dealHistory + _actionHistory to API.
  List<int> _actionHistory = [];

  LegalActionsResult? _legalState;

  bool _isDealing = true; // true while /start_game is in flight

  // ── Bokeh particles ───────────────────────────────────────────────────────
  late List<_Bokeh> _bokehList;
  final _rng = Random();

  @override
  void initState() {
    super.initState();
    _socket = widget.socketService ?? _DummySocketService();

    // Bokeh
    _bokeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat(reverse: true);

    _bokehList = List.generate(
      18,
      (i) => _Bokeh(
        x: _rng.nextDouble(),
        y: _rng.nextDouble(),
        radius: _rng.nextDouble() * 28 + 8,
        opacity: _rng.nextDouble() * 0.18 + 0.04,
        phase: _rng.nextDouble() * 2 * pi,
      ),
    );

    // Timer glow
    _timerGlowCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _timerGlow = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _timerGlowCtrl, curve: Curves.easeInOut),
    );

    // Connect socket
    _socket.connect(
      roomId: widget.roomId,
      playerId: widget.playerId,
      handler: this,
    );

    // In bot mode: fetch real dealt hand from OpenSpiel via /start_game
    // In socket mode: server sends game_state event which calls onGameState()
    if (widget.socketService == null) {
      _fetchAndApplyDeal();
    } else {
      _startCountdown();
    }
  }

  @override
  void dispose() {
    _bokeCtrl.dispose();
    _timerGlowCtrl.dispose();
    _countdownTimer?.cancel();
    _socket.disconnect();
    super.dispose();
  }

  // ── Deal from OpenSpiel ──────────────────────────────────────────────────────
  Future<void> _fetchAndApplyDeal() async {
    final result = await _aiEngine.fetchStartGame();
    if (!mounted) return;

    if (result != null) {
      final rawHand = result['player_hand'] as List<dynamic>;
      final topCardJson = result['top_card'] as Map<String, dynamic>;
      final dealHist = (result['deal_history'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList();

      final legalJson = result['legal'] as Map<String, dynamic>?;
      setState(() {
        _dealHistory = dealHist;
        _playerHand = rawHand
            .map((c) => WhotCard.fromJson(c as Map<String, dynamic>))
            .toList();
        _topCard = WhotCard.fromJson(topCardJson);
        _opponentCardCount = (result['opponent_hand_count'] as num).toInt();
        _isDealing = false;
        if (legalJson != null) {
          _legalState = LegalActionsResult.fromJson(legalJson);
          _isMyTurn = _legalState!.currentPlayer == 0;
        }
      });
    } else {
      // Render cold-start failed — keep dummy hand, show toast
      setState(() => _isDealing = false);
      _showToast('Could not reach server — using practice cards');
    }
    if (_legalState == null) await _refreshLegalActions();
    _startCountdown();
  }

  // ── Timer ─────────────────────────────────────────────────────────────────
  void _startCountdown() {
    _countdownTimer?.cancel();
    _timerSeconds = 15;
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() {
        if (_timerSeconds > 0) {
          _timerSeconds--;
        } else {
          t.cancel();
          if (_isMyTurn) _autoDrawOnTimeout();
        }
      });
    });
  }

  void _autoDrawOnTimeout() {
    _socket.emitDrawCard(widget.roomId, widget.playerId); // ← EMIT
    // fromServer: false so we don't emit again inside _drawCard
    _drawCard(fromServer: false);
  }

  // ── WhotGameEventHandler impl ─────────────────────────────────────────────

  @override
  void onGameState(Map<String, dynamic> state) {
    if (!mounted) return;
    final hist = state['action_history'] as List<dynamic>?;
    setState(() {
      _playerHand = (state['yourHand'] as List)
          .map((c) => WhotCard.fromJson(c as Map<String, dynamic>))
          .toList();
      _opponentCardCount = (state['opponentCardCount'] as num).toInt();
      _topCard =
          WhotCard.fromJson(state['topCard'] as Map<String, dynamic>);
      _isMyTurn = state['currentTurn'] == widget.playerId;
      if (hist != null && hist.isNotEmpty) {
        final full = hist.map((e) => (e as num).toInt()).toList();
        if (full.length > _dealHistory.length) {
          _actionHistory = full.sublist(_dealHistory.length);
        }
      }
    });
    _refreshLegalActions();
    _startCountdown();
  }

  @override
  void onCardPlayed(Map<String, dynamic> data) {
    if (!mounted) return;
    setState(() {
      _topCard =
          WhotCard.fromJson(data['card'] as Map<String, dynamic>);
      _opponentCardCount = (data['opponentCardCount'] as num).toInt();
      _isMyTurn = true;
    });
    _startCountdown();
  }

  @override
  void onCardDrawn(Map<String, dynamic> data) {
    if (!mounted) return;
    setState(() {
      _opponentCardCount = (data['opponentCardCount'] as num).toInt();
      _isMyTurn = true;
    });
    _startCountdown();
  }

  @override
  void onYourTurn() {
    if (!mounted) return;
    setState(() => _isMyTurn = true);
    _refreshLegalActions();
    _startCountdown();
  }

  @override
  void onOpponentTurn() {
    if (!mounted) return;
    setState(() {
      _isMyTurn = false;
      _selectedIndex = -1;
    });
    _startCountdown();
  }

  @override
  void onMarket(int count) {
    if (!mounted) return;
    // Add `count` face-down placeholders; server will send real cards via game_state
    setState(() {
      for (int i = 0; i < count; i++) {
        _playerHand.add(WhotCard.faceDown());
      }
    });
    _showToast('Pick $count! 😬');
    _refreshLegalActions();
  }

  @override
  void onSuspension() {
    if (!mounted) return;
    setState(() => _isMyTurn = false);
    _showToast('Suspension! Turn skipped.');
  }

  @override
  void onGeneralMarket() {
    if (!mounted) return;
    setState(() {
      _playerHand.add(WhotCard.faceDown());
    });
    _showToast('General Market! 😅');
    _refreshLegalActions();
  }

  @override
  void onChooseShape() {
    if (!mounted) return;
    setState(() => _showShapeChooser = true);
  }

  @override
  void onCallCard(String playerId) {
    final who = playerId == widget.playerId ? 'You' : widget.opponentName;
    _showToast('$who called card! 🔔');
  }

  @override
  void onGameOver(Map<String, dynamic> data) {
    if (!mounted) return;
    final winnerId = data['winnerId'];
    final isWinner = winnerId == widget.playerId;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => _GameOverDialog(
        isWinner: isWinner,
        prizePool: widget.prizePool,
        onClose: widget.onBack ?? () => Navigator.maybePop(context),
      ),
    );
  }

  @override
  void onTimerTick(int seconds) {
    if (!mounted) return;
    setState(() => _timerSeconds = seconds);
  }

  @override
  void onError(String message) => _showToast(message);

  // ── Legal actions (OpenSpiel) ─────────────────────────────────────────────

  List<int> get _fullActionHistory => [..._dealHistory, ..._actionHistory];

  bool get _isHumanTurn =>
      _legalState != null &&
      !_legalState!.isTerminal &&
      _legalState!.currentPlayer == 0;

  Future<void> _refreshLegalActions() async {
    if (_dealHistory.isEmpty) return;
    final result = await _aiEngine.fetchLegalActions(_fullActionHistory);
    if (!mounted || result == null) return;
    setState(() {
      _legalState = result;
      if (!result.isTerminal) {
        _isMyTurn = result.currentPlayer == 0;
      }
      if (result.mustNominateSuit && result.currentPlayer == 0) {
        _showShapeChooser = true;
      }
    });
  }

  bool _isCardPlayable(WhotCard card) {
    if (_legalState != null && _isHumanTurn) {
      return _legalState!.playableCardIds.contains(_cardToOpenSpielAction(card));
    }
    return _canPlayHeuristic(card);
  }

  bool _canPlayHeuristic(WhotCard card) {
    if (card.isWhot) return true;
    if (card.shape == _topCard.shape) return true;
    if (card.number == _topCard.number) return true;
    return false;
  }

  bool get _canDrawNow {
    if (_legalState != null && _isHumanTurn) return _legalState!.canDraw;
    return _isMyTurn;
  }

  bool _isNominateLegal(WhotShape shape) {
    if (_legalState == null) return shape != WhotShape.whot;
    return _legalState!.nominateSuits.contains(shape.name);
  }

  Set<int>? _playableHandIndices() {
    if (!_isMyTurn) return null;
    if (_legalState == null || !_isHumanTurn) return null;
    final ids = _legalState!.playableCardIds.toSet();
    final out = <int>{};
    for (var i = 0; i < _playerHand.length; i++) {
      if (ids.contains(_cardToOpenSpielAction(_playerHand[i]))) out.add(i);
    }
    return out;
  }

  List<WhotShape> _legalNominateShapeOptions() {
    if (_legalState != null && _legalState!.nominateSuits.isNotEmpty) {
      return _legalState!.nominateSuits
          .map(_shapeFromSuitName)
          .whereType<WhotShape>()
          .toList();
    }
    return WhotShape.values.where((s) => s != WhotShape.whot).toList();
  }

  void _toastPlayerSpecial(int rank) {
    switch (rank) {
      case 1:
        _showToast('Hold On! You play again.');
        break;
      case 2:
        _showToast('Pick Two!');
        break;
      case 5:
        _showToast('Pick Three!');
        break;
      case 8:
        _showToast('Suspension!');
        break;
      case 14:
        _showToast('General Market!');
        break;
      case 20:
        _showToast('Whot! Choose a shape.');
        break;
    }
  }

  // ── Game actions ──────────────────────────────────────────────────────────

  Future<void> _playCard({WhotShape? chosenShape, bool nominateOnly = false}) async {
    if (nominateOnly) {
      if (chosenShape == null || !_isNominateLegal(chosenShape)) {
        _showToast('Not a legal shape');
        return;
      }
      _actionHistory.add(_kOpenSpielNominateBase + _openSpielSuitFromShape(chosenShape));
      _socket.emitPlayCard(
        widget.roomId,
        widget.playerId,
        _topCard,
        chosenShape: chosenShape,
      );
      setState(() {
        _topCard = WhotCard(
          shape: chosenShape,
          number: _topCard.number,
          id: _topCard.id,
        );
        _showShapeChooser = false;
        _isMyTurn = false;
      });
      HapticFeedback.lightImpact();
      await _refreshLegalActions();
      if (widget.socketService == null) _triggerBotLoop();
      return;
    }

    if (_selectedIndex < 0 || !_isMyTurn) return;
    final card = _playerHand[_selectedIndex];
    if (!_isCardPlayable(card)) {
      _showToast('Not a legal move');
      return;
    }

    if (card.isWhot && chosenShape == null) {
      setState(() => _showShapeChooser = true);
      return;
    }

    final actionId = _cardToOpenSpielAction(card);
    _actionHistory.add(actionId);

    if (card.isWhot && chosenShape != null) {
      if (!_isNominateLegal(chosenShape)) {
        _actionHistory.removeLast();
        _showToast('Not a legal shape');
        return;
      }
      _actionHistory.add(_kOpenSpielNominateBase + _openSpielSuitFromShape(chosenShape));
    }

    _socket.emitPlayCard(
      widget.roomId,
      widget.playerId,
      card,
      chosenShape: chosenShape,
    );

    final playedRank = card.number;
    setState(() {
      _topCard = chosenShape != null
          ? WhotCard(shape: chosenShape, number: card.number, id: card.id)
          : card;
      _playerHand.removeAt(_selectedIndex);
      _selectedIndex = -1;
      _showShapeChooser = false;
    });
    HapticFeedback.lightImpact();
    _toastPlayerSpecial(playedRank);

    await _refreshLegalActions();

    if (_legalState != null &&
        _legalState!.mustNominateSuit &&
        _legalState!.currentPlayer == 0) {
      setState(() => _showShapeChooser = true);
      return;
    }

    setState(() => _isMyTurn = false);
    if (widget.socketService == null) _triggerBotLoop();
  }

  /// After opponent plays a special card, show UI. Returns true if it's now the
  /// human's turn; false if the bot plays again (Hold On / Suspension).
  bool _handleOpponentSpecial(int rank) {
    final pick = _legalState?.pendingDraw ?? 0;
    switch (rank) {
      case 2:
        onMarket(pick > 0 ? pick : 2);
        return true;
      case 5:
        onMarket(pick > 0 ? pick : 3);
        return true;
      case 8:
        onSuspension();
        return false;
      case 14:
        onGeneralMarket();
        return true;
      case 1:
        _showToast('Hold On! ${widget.opponentName} plays again.');
        return false;
      case 20:
        _showToast('Whot! ${widget.opponentName} picks a shape…');
        return false;
      default:
        return true;
    }
  }

  /// Calls Gamearn Render bot, updates opponent state, hands turn back to player.
  Future<void> _triggerBotLoop() async {
    _startCountdown();

    while (mounted) {
      final botAction = await _aiEngine
          .fetchMctsMove([..._dealHistory, ..._actionHistory]);
      if (!mounted) return;

      if (botAction == null) {
        await _refreshLegalActions();
        _startCountdown();
        return;
      }

      final preLegal = await _aiEngine.fetchLegalActions(_fullActionHistory);
      _actionHistory.add(botAction);
      if (preLegal != null &&
          !preLegal.legalActions.contains(botAction)) {
        debugPrint('Bot played illegal action $botAction');
      }

      // Suit nomination after a Whot card
      if (botAction >= _kOpenSpielNominateBase &&
          botAction < _kOpenSpielNominateBase + 5) {
        final shape = _shapeFromOpenSpielSuit(botAction - _kOpenSpielNominateBase);
        setState(() {
          _topCard = WhotCard(
            shape: shape,
            number: _topCard.number,
            id: _topCard.id,
          );
        });
        _showToast('${widget.opponentName} chose ${shape.name}');
        await _refreshLegalActions();
        _startCountdown();
        return;
      }

      if (botAction == _kOpenSpielDraw) {
        setState(() {
          _opponentCardCount++;
        });
        await _refreshLegalActions();
        _startCountdown();
        return;
      }

      // Bot played a card
      final played = _cardFromOpenSpielAction(botAction);
      setState(() {
        _topCard = played;
        if (_opponentCardCount > 0) _opponentCardCount--;
      });

      await _refreshLegalActions();

      final humanTurn = _handleOpponentSpecial(played.number);
      if (!humanTurn) {
        await Future.delayed(const Duration(milliseconds: 600));
        continue;
      }

      await _refreshLegalActions();
      _startCountdown();
      return;
    }
  }

  void _addDrawnCards(int count) {
    final rng = Random();
    for (var i = 0; i < count; i++) {
      _playerHand.add(WhotCard(
        shape: WhotShape.values[rng.nextInt(5)],
        number: rng.nextInt(13) + 1,
      ));
    }
  }

  Future<void> _drawCard({bool fromServer = true}) async {
    if (!_isMyTurn && fromServer) return;
    if (!_canDrawNow) {
      _showToast('Draw is not allowed right now');
      return;
    }
    if (fromServer) {
      _socket.emitDrawCard(widget.roomId, widget.playerId); // ← EMIT
    }

    final penalty = _legalState?.pendingDraw ?? 0;
    final drawCount = penalty > 0 ? penalty : 1;

    _actionHistory.add(_kOpenSpielDraw);

    setState(() {
      _addDrawnCards(drawCount);
      _selectedIndex = -1;
      _isMyTurn = false;
    });
    HapticFeedback.selectionClick();

    await _refreshLegalActions();

    if (widget.socketService == null) _triggerBotLoop();
  }

  void _callCard() {
    _socket.emitCallCard(widget.roomId, widget.playerId); // ← EMIT
    onCallCard(widget.playerId);
    setState(() => _showCallCardOverlay = false);
  }

  void _showToast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg,
          style: const TextStyle(
              color: _textPrimary, fontWeight: FontWeight.w600)),
      backgroundColor: _navy,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: const Duration(seconds: 2),
    ));
  }

  // ── Build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: _bg,
        body: Stack(
          children: [
            // Bokeh background
            _BokehBackground(ctrl: _bokeCtrl, bokeh: _bokehList),

            // Main portrait layout
            if (!_isLandscape) _buildPortrait(),

            // Landscape layout
            if (_isLandscape) _buildLandscape(),

            // Shape chooser overlay
            if (_showShapeChooser) _buildShapeChooser(),

            // Call card overlay
            if (_showCallCardOverlay) _buildCallCardOverlay(),
          ],
        ),
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PORTRAIT LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildPortrait() {
    return SafeArea(
      child: Column(
        children: [
          // Tournament header
          _buildTournamentHeader(),

          // Game arena (glass card)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  border:
                      Border.all(color: Colors.white.withOpacity(0.08)),
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.white.withOpacity(0.04),
                      Colors.white.withOpacity(0.01),
                    ],
                  ),
                ),
                child: Column(
                  children: [
                    const SizedBox(height: 16),
                    // Opponent info + face-down hand
                    _buildOpponentSection(),
                    const Spacer(),
                    // Draw + Discard pile centre
                    _buildCentreArea(),
                    const Spacer(),
                    // Player hand fan
                    _buildPlayerHandFan(),
                    const SizedBox(height: 8),
                    // Timer + player info
                    _buildPlayerTimerRow(),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
          ),

          // Bottom bar
          _buildBottomBar(),
        ],
      ),
    );
  }

  // ── Tournament header ─────────────────────────────────────────────────────
  Widget _buildTournamentHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
      child: Column(
        children: [
          Text(
            widget.tournamentTitle,
            style: const TextStyle(
              color: _orange,
              fontSize: 18,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'Prize Pool: ${widget.prizePool}',
            style: const TextStyle(
              color: _orange,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  // ── Opponent section ──────────────────────────────────────────────────────
  Widget _buildOpponentSection() {
    return Column(
      children: [
        // Avatar + name
        _AvatarWidget(
          name: widget.opponentName,
          avatarUrl: widget.opponentAvatar,
          isActive: !_isMyTurn,
          size: 56,
          showTimer: false,
        ),
        const SizedBox(height: 4),
        Text(
          widget.opponentName,
          style: const TextStyle(
              color: _textPrimary,
              fontSize: 13,
              fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 10),
        // Opponent face-down fan
        _OpponentHandFan(count: _opponentCardCount),
      ],
    );
  }

  // ── Centre area: Draw pile + Discard pile ─────────────────────────────────
  Widget _buildCentreArea() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Draw pile
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            GestureDetector(
              onTap: _canDrawNow ? () => _drawCard() : null,
              child: _WhotCardWidget(
                card: WhotCard.faceDown(),
                width: 90,
                height: 118,
              ),
            ),
            const SizedBox(height: 6),
            _PileLabel(
                label: 'DRAW', onTap: _canDrawNow ? () => _drawCard() : null),
          ],
        ),
        const SizedBox(width: 32),
        // Discard pile
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _WhotCardWidget(
              card: _topCard,
              width: 90,
              height: 118,
              glowCyan: true,
            ),
            const SizedBox(height: 6),
            const _PileLabel(label: 'DISCARD PILE'),
          ],
        ),
      ],
    );
  }

  // ── Player hand arc fan ───────────────────────────────────────────────────
  Widget _buildPlayerHandFan() {
    return SizedBox(
      height: 140,
      child: _ArcFanHand(
        cards: _playerHand,
        selectedIndex: _selectedIndex,
        isMyTurn: _isMyTurn,
        playableIndices: _playableHandIndices(),
        onCardTap: (i) {
          if (!_isMyTurn) return;
          final playable = _playableHandIndices();
          if (playable != null && !playable.contains(i)) {
            _showToast('Not a legal move');
            return;
          }
          setState(() => _selectedIndex = _selectedIndex == i ? -1 : i);
        },
      ),
    );
  }

  // ── Player timer row ──────────────────────────────────────────────────────
  Widget _buildPlayerTimerRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Timer widget
          AnimatedBuilder(
            animation: _timerGlow,
            builder: (_, child) => Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: _isMyTurn
                    ? [
                        BoxShadow(
                          color:
                              _cyan.withOpacity(_timerGlow.value * 0.6),
                          blurRadius: 20,
                          spreadRadius: 4,
                        )
                      ]
                    : [],
              ),
              child: child,
            ),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                // Timer box
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: _timerBg,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: _isMyTurn
                          ? _cyan
                          : Colors.white.withOpacity(0.1),
                      width: 2,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$_timerSeconds',
                        style: TextStyle(
                          color: _timerSeconds <= 5 ? Colors.red : _cyan,
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const Text(
                        'Seconds',
                        style: TextStyle(
                            color: _textSub,
                            fontSize: 9,
                            fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                ),
                // Play button badge
                Positioned(
                  bottom: -6,
                  right: -6,
                  child: GestureDetector(
                    onTap: _selectedIndex >= 0 &&
                            _isCardPlayable(_playerHand[_selectedIndex])
                        ? () => _playCard()
                        : null,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: _selectedIndex >= 0 &&
                                _isCardPlayable(_playerHand[_selectedIndex])
                            ? _cyan
                            : _textSub,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.play_arrow,
                          color: _navyDeep, size: 16),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Text(
            'YOU (${widget.playerName})',
            style: const TextStyle(
              color: _cyan,
              fontSize: 13,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  // ── Bottom bar ────────────────────────────────────────────────────────────
  Widget _buildBottomBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Row(
        children: [
          // End Game
          Expanded(
            child: GestureDetector(
              onTap: widget.onBack ?? () => Navigator.maybePop(context),
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  color: _orange,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Center(
                  child: Text(
                    'End Game',
                    style: TextStyle(
                      color: _white,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          // Rotate
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _isLandscape = !_isLandscape),
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  color: const Color(0xFF1A3A4A),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: _cyan.withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.screen_rotation, color: _cyan, size: 18),
                    SizedBox(width: 6),
                    Text(
                      'Rotate',
                      style: TextStyle(
                        color: _cyan,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  LANDSCAPE LAYOUT  (players on left / right sides)
  // ══════════════════════════════════════════════════════════════════════════
  Widget _buildLandscape() {
    return SafeArea(
      child: Stack(
        children: [
          // Close button
          Positioned(
            top: 12,
            right: 12,
            child: GestureDetector(
              onTap: () => setState(() => _isLandscape = false),
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _orange,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.close, color: _white),
              ),
            ),
          ),

          // Rotate buttons (right side)
          Positioned(
            right: 12,
            bottom: 80,
            child: Column(
              children: [
                _RotateIconBtn(
                  icon: Icons.screen_rotation,
                  onTap: () => setState(() => _isLandscape = false),
                ),
                const SizedBox(height: 10),
                _RotateIconBtn(
                  icon: Icons.refresh,
                  onTap: () => setState(() {}),
                ),
              ],
            ),
          ),

          // Opponent top (rotated)
          Positioned(
            top: 8,
            left: 0,
            right: 60,
            child: Column(
              children: [
                _AvatarWidget(
                  name: widget.opponentName,
                  avatarUrl: widget.opponentAvatar,
                  isActive: !_isMyTurn,
                  size: 44,
                  rotated: true,
                  showTimer: false,
                ),
                Transform.rotate(
                  angle: pi,
                  child: Text(widget.opponentName,
                      style: const TextStyle(
                          color: _textPrimary,
                          fontSize: 11,
                          fontWeight: FontWeight.w600)),
                ),
                const SizedBox(height: 4),
                _OpponentHandFan(count: _opponentCardCount),
              ],
            ),
          ),

          // Draw + Discard centre
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _PileLabel(
                        label: 'DRAW',
                        onTap: _canDrawNow ? () => _drawCard() : null),
                    const SizedBox(width: 8),
                    _WhotCardWidget(
                        card: WhotCard.faceDown(), width: 64, height: 86),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const _PileLabel(label: 'DISCARD PILE'),
                    const SizedBox(width: 8),
                    _WhotCardWidget(
                        card: _topCard,
                        width: 64,
                        height: 86,
                        glowCyan: true),
                  ],
                ),
              ],
            ),
          ),

          // Player left side (rotated 90°)
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            child: RotatedBox(
              quarterTurns: 3,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _AvatarWidget(
                        name: widget.playerName,
                        avatarUrl: widget.playerAvatar,
                        isActive: _isMyTurn,
                        size: 40,
                        showTimer: true,
                        timerSeconds: _timerSeconds,
                        timerGlow: _timerGlow,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'YOU (${widget.playerName})',
                        style: const TextStyle(
                            color: _cyan,
                            fontSize: 11,
                            fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  _ArcFanHand(
                    cards: _playerHand,
                    selectedIndex: _selectedIndex,
                    isMyTurn: _isMyTurn,
                    playableIndices: _playableHandIndices(),
                    onCardTap: (i) {
                      if (!_isMyTurn) return;
                      final playable = _playableHandIndices();
                      if (playable != null && !playable.contains(i)) {
                        _showToast('Not a legal move');
                        return;
                      }
                      setState(
                          () => _selectedIndex = _selectedIndex == i ? -1 : i);
                    },
                  ),
                ],
              ),
            ),
          ),

          // Opponent right side (rotated)
          Positioned(
            right: 60,
            top: 0,
            bottom: 0,
            child: RotatedBox(
              quarterTurns: 1,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _AvatarWidget(
                        name: widget.opponentName,
                        avatarUrl: widget.opponentAvatar,
                        isActive: !_isMyTurn,
                        size: 40,
                        showTimer: false,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        widget.opponentName,
                        style: const TextStyle(
                            color: _textPrimary,
                            fontSize: 11,
                            fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  _OpponentHandFan(count: _opponentCardCount),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Shape chooser overlay ─────────────────────────────────────────────────
  Widget _buildShapeChooser() {
    return GestureDetector(
      onTap: () => setState(() => _showShapeChooser = false),
      child: Container(
        color: Colors.black.withOpacity(0.7),
        child: Center(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 32),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: _navy,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: _cyan.withOpacity(0.3)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Choose a Shape',
                  style: TextStyle(
                    color: _textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  alignment: WrapAlignment.center,
                  children: _legalNominateShapeOptions()
                      .map((s) => GestureDetector(
                            onTap: () {
                              if (_legalState?.mustNominateSuit == true &&
                                  _selectedIndex < 0) {
                                _playCard(chosenShape: s, nominateOnly: true);
                              } else {
                                _playCard(chosenShape: s);
                              }
                            },
                            child: Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: _cardBg,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                    color: _shapeColor.withOpacity(0.4)),
                              ),
                              child: CustomPaint(
                                painter: _ShapeOnlyPainter(shape: s),
                              ),
                            ),
                          ))
                      .toList(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Call card overlay ─────────────────────────────────────────────────────
  Widget _buildCallCardOverlay() {
    return GestureDetector(
      onTap: () => setState(() => _showCallCardOverlay = false),
      child: Container(
        color: Colors.black.withOpacity(0.6),
        child: Center(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 32),
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: _navy,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: _cyan.withOpacity(0.3)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Call Card',
                    style: TextStyle(
                        color: _textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                const Text(
                  'Announce when you have 1 card left or get penalised!',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: _textSub, fontSize: 13),
                ),
                const SizedBox(height: 20),
                GestureDetector(
                  onTap: _callCard,
                  child: Container(
                    height: 50,
                    decoration: BoxDecoration(
                      color: _orange,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Center(
                      child: Text(
                        'CALL CARD! 🔔',
                        style: TextStyle(
                          color: _white,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
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

// ═════════════════════════════════════════════════════════════════════════════
//  ARC FAN HAND  –  player hand curved like Figma
// ═════════════════════════════════════════════════════════════════════════════
class _ArcFanHand extends StatelessWidget {
  final List<WhotCard> cards;
  final int selectedIndex;
  final bool isMyTurn;
  final Set<int>? playableIndices;
  final ValueChanged<int> onCardTap;

  const _ArcFanHand({
    required this.cards,
    required this.selectedIndex,
    required this.isMyTurn,
    this.playableIndices,
    required this.onCardTap,
  });

  @override
  Widget build(BuildContext context) {
    final n = cards.length;
    if (n == 0) return const SizedBox.shrink();

    const cardW = 62.0;
    const cardH = 88.0;
    const fanSpreadDeg = 40.0; // total arc degrees
    const maxCards = 9; // clamp fan spread for large hands

    final effectiveN = min(n, maxCards);
    final spreadDeg = fanSpreadDeg * min(1.0, n / 6);
    final stepDeg = n > 1 ? spreadDeg / (n - 1) : 0.0;
    final radius = 320.0;

    return SizedBox(
      height: 140,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: List.generate(n, (i) {
          final angleDeg = -spreadDeg / 2 + i * stepDeg;
          final angleRad = angleDeg * pi / 180;
          // Arc position
          final dx = radius * sin(angleRad);
          final dy = -radius * (1 - cos(angleRad)) * 0.35;
          final isSelected = selectedIndex == i;
          final isPlayable = playableIndices == null ||
              playableIndices!.contains(i) ||
              !isMyTurn;

          return Positioned(
            bottom: isSelected ? 20 : 0,
            left: null,
            child: Transform.translate(
              offset: Offset(dx, dy),
              child: Transform.rotate(
                angle: angleRad * 0.8,
                child: GestureDetector(
                  onTap: () => onCardTap(i),
                  child: Opacity(
                    opacity: isPlayable ? 1.0 : 0.38,
                    child: _WhotCardWidget(
                      card: cards[i],
                      width: cardW,
                      height: cardH,
                      isSelected: isSelected,
                      glowOrange: isSelected && isPlayable,
                    ),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  OPPONENT HAND FAN  (face-down arc)
// ═════════════════════════════════════════════════════════════════════════════
class _OpponentHandFan extends StatelessWidget {
  final int count;
  const _OpponentHandFan({required this.count});

  @override
  Widget build(BuildContext context) {
    final n = min(count, 7);
    const cardW = 52.0;
    const cardH = 72.0;
    const spreadDeg = 36.0;
    final stepDeg = n > 1 ? spreadDeg / (n - 1) : 0.0;
    const radius = 280.0;

    return SizedBox(
      height: 80,
      width: double.infinity,
      child: Stack(
        alignment: Alignment.topCenter,
        children: List.generate(n, (i) {
          final angleDeg = -spreadDeg / 2 + i * stepDeg;
          final angleRad = angleDeg * pi / 180;
          final dx = radius * sin(angleRad);
          final dy = radius * (1 - cos(angleRad)) * 0.25;

          return Transform.translate(
            offset: Offset(dx, dy),
            child: Transform.rotate(
              angle: angleRad * 0.8,
              child: _WhotCardWidget(
                card: WhotCard.faceDown(),
                width: cardW,
                height: cardH,
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  WHOT CARD WIDGET
// ═════════════════════════════════════════════════════════════════════════════
class _WhotCardWidget extends StatelessWidget {
  final WhotCard card;
  final double width;
  final double height;
  final bool isSelected;
  final bool glowCyan;
  final bool glowOrange;

  const _WhotCardWidget({
    required this.card,
    required this.width,
    required this.height,
    this.isSelected = false,
    this.glowCyan = false,
    this.glowOrange = false,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      width: width,
      height: height,
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
          painter: _CardFacePainter(card: card, isSelected: isSelected),
        ),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  CARD FACE PAINTER  –  white bg, navy shapes, double-border style
// ═════════════════════════════════════════════════════════════════════════════
class _CardFacePainter extends CustomPainter {
  final WhotCard card;
  final bool isSelected;
  _CardFacePainter({required this.card, this.isSelected = false});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    if (card.isFaceDown) {
      _paintFaceDown(canvas, w, h);
      return;
    }

    // White card background
    final bg = Paint()..color = _cardBg;
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, w, h),
          const Radius.circular(10)),
      bg,
    );

    // Orange selection border
    if (isSelected) {
      final sel = Paint()
        ..color = _orange
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5;
      canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(1, 1, w - 2, h - 2), const Radius.circular(9)),
        sel,
      );
    }

    final shape = card.shape;
    final number = card.number;

    // ── Corner number + shape icon (top-left, bottom-right rotated) ──
    _drawCorner(canvas, w, h, number, shape);

    // ── Centre shape (large, double-border style) ──
    final cx = w / 2;
    final cy = h / 2 + 4;
    final r = min(w, h) * 0.28;

    if (shape == WhotShape.whot) {
      _drawWhotCenter(canvas, cx, cy, w, h);
    } else {
      _drawShapeDoubleBorder(canvas, shape, cx, cy, r);
    }
  }

  void _paintFaceDown(Canvas canvas, double w, double h) {
    // Navy background
    final bg = Paint()..color = _navy;
    canvas.drawRRect(
      RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, w, h),
          const Radius.circular(10)),
      bg,
    );

    // Mirrored "Wọt" text (top-right side up, bottom-left upside down)
    // Top
    _drawFaceDownText(canvas, w, h, rotated: false);
    // Bottom (rotated 180)
    canvas.save();
    canvas.translate(w, h);
    canvas.rotate(pi);
    _drawFaceDownText(canvas, w, h, rotated: false);
    canvas.restore();
  }

  void _drawFaceDownText(
      Canvas canvas, double w, double h, {required bool rotated}) {
    final style = TextStyle(
      color: _white,
      fontSize: h * 0.16,
      fontWeight: FontWeight.w900,
      height: 1.1,
    );
    // "Wọt" on top line
    final tp1 = TextPainter(
      text: TextSpan(text: 'Wọt', style: style),
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: w);
    // "Wọt" mirrored on bottom line (upside-down effect via rotation at paint time)
    final tp2 = TextPainter(
      text: TextSpan(text: 'Ẉọt', style: style),
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: w);

    final left = (w - tp1.width) / 2;
    tp1.paint(canvas, Offset(left, h * 0.12));
    // Rotate bottom text 180 in place
    canvas.save();
    final x2 = (w - tp2.width) / 2;
    final y2 = h * 0.38;
    canvas.translate(x2 + tp2.width / 2, y2 + tp2.height / 2);
    canvas.rotate(pi);
    tp2.paint(canvas, Offset(-tp2.width / 2, -tp2.height / 2));
    canvas.restore();
  }

  void _drawCorner(
      Canvas canvas, double w, double h, int number, WhotShape shape) {
    final numStr = number == 20 ? '20' : '$number';
    final iconStr = shape.label;

    final numStyle = TextStyle(
      color: _shapeColor,
      fontSize: w * 0.22,
      fontWeight: FontWeight.w900,
    );
    final iconStyle = TextStyle(
      color: _shapeColor,
      fontSize: w * 0.14,
    );

    // Top-left
    _paintText(canvas, numStr, numStyle, Offset(3, 1));
    _paintText(canvas, iconStr, iconStyle, Offset(4, w * 0.22 + 1));

    // Bottom-right (rotated 180)
    canvas.save();
    canvas.translate(w, h);
    canvas.rotate(pi);
    _paintText(canvas, numStr, numStyle, Offset(3, 1));
    _paintText(canvas, iconStr, iconStyle, Offset(4, w * 0.22 + 1));
    canvas.restore();
  }

  void _paintText(Canvas canvas, String text, TextStyle style, Offset offset) {
    final tp = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, offset);
  }

  /// Double-border style: outer stroke → gap → filled inner shape
  void _drawShapeDoubleBorder(
      Canvas canvas, WhotShape shape, double cx, double cy, double r) {
    // Outer stroke (navy, thick)
    final outerPaint = Paint()
      ..color = _shapeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = r * 0.22;

    // Inner fill (navy solid)
    final innerPaint = Paint()
      ..color = _shapeColor
      ..style = PaintingStyle.fill;

    // We draw the shape slightly smaller for inner fill
    final rInner = r * 0.65;

    switch (shape) {
      case WhotShape.circle:
        canvas.drawCircle(Offset(cx, cy), r, outerPaint);
        canvas.drawCircle(Offset(cx, cy), rInner, innerPaint);
        break;
      case WhotShape.square:
        final outer =
            Rect.fromCenter(center: Offset(cx, cy), width: r * 2, height: r * 2);
        final inner = Rect.fromCenter(
            center: Offset(cx, cy),
            width: rInner * 2,
            height: rInner * 2);
        canvas.drawRect(outer, outerPaint);
        canvas.drawRect(inner, innerPaint);
        break;
      case WhotShape.triangle:
        _drawTriangle(canvas, outerPaint, cx, cy, r);
        _drawTriangle(canvas, innerPaint, cx, cy, rInner);
        break;
      case WhotShape.star:
        _drawStar(canvas, outerPaint, cx, cy, r);
        _drawStar(canvas, innerPaint, cx, cy, rInner);
        break;
      case WhotShape.cross:
        _drawCross(canvas, outerPaint, cx, cy, r);
        _drawCross(canvas, innerPaint, cx, cy, rInner);
        break;
      default:
        break;
    }
  }

  void _drawWhotCenter(Canvas canvas, double cx, double cy, double w, double h) {
    final bg = Paint()..color = _navy;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(w * 0.1, h * 0.28, w * 0.8, h * 0.38),
        const Radius.circular(6),
      ),
      bg,
    );
    // "Wọt" top
    final style = TextStyle(
      color: _white,
      fontSize: w * 0.18,
      fontWeight: FontWeight.w900,
    );
    _paintText(canvas, 'Wọt', style, Offset(cx - w * 0.18, h * 0.31));
    // upside-down "Wọt" below
    canvas.save();
    canvas.translate(cx, h * 0.55);
    canvas.rotate(pi);
    _paintText(canvas, 'Wọt', style, Offset(-w * 0.18, -w * 0.2));
    canvas.restore();
  }

  void _drawTriangle(Canvas canvas, Paint paint, double cx, double cy, double r) {
    final path = Path()
      ..moveTo(cx, cy - r)
      ..lineTo(cx + r, cy + r * 0.8)
      ..lineTo(cx - r, cy + r * 0.8)
      ..close();
    if (paint.style == PaintingStyle.fill) {
      canvas.drawPath(path, paint);
    } else {
      canvas.drawPath(path, paint);
    }
  }

  void _drawStar(Canvas canvas, Paint paint, double cx, double cy, double r) {
    final path = Path();
    final inner = r * 0.42;
    for (int i = 0; i < 14; i++) {
      final angle = (i * pi / 7) - pi / 2;
      final rad = i.isEven ? r : inner;
      final x = cx + rad * cos(angle);
      final y = cy + rad * sin(angle);
      if (i == 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    path.close();
    canvas.drawPath(path, paint);
  }

  void _drawCross(Canvas canvas, Paint paint, double cx, double cy, double r) {
    final t = r * 0.38; // arm thickness
    // Stepped cross (like Figma design – notched corners)
    final path = Path()
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
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_CardFacePainter old) =>
      old.card != card || old.isSelected != isSelected;
}

// ═════════════════════════════════════════════════════════════════════════════
//  SHAPE-ONLY PAINTER  (for shape chooser buttons)
// ═════════════════════════════════════════════════════════════════════════════
class _ShapeOnlyPainter extends CustomPainter {
  final WhotShape shape;
  _ShapeOnlyPainter({required this.shape});

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = min(size.width, size.height) * 0.32;
    final p = _CardFacePainter(card: WhotCard(shape: shape, number: 1));
    p._drawShapeDoubleBorder(
        canvas, shape, cx, cy, r);
  }

  @override
  bool shouldRepaint(_ShapeOnlyPainter o) => o.shape != shape;
}

// ═════════════════════════════════════════════════════════════════════════════
//  PILE LABEL BUTTON
// ═════════════════════════════════════════════════════════════════════════════
class _PileLabel extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  const _PileLabel({required this.label, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: _orange,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: _white,
            fontSize: 11,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
          ),
        ),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  AVATAR WIDGET
// ═════════════════════════════════════════════════════════════════════════════
class _AvatarWidget extends StatelessWidget {
  final String name;
  final String avatarUrl;
  final bool isActive;
  final double size;
  final bool rotated;
  final bool showTimer;
  final int timerSeconds;
  final Animation<double>? timerGlow;

  const _AvatarWidget({
    required this.name,
    required this.avatarUrl,
    required this.isActive,
    this.size = 56,
    this.rotated = false,
    this.showTimer = false,
    this.timerSeconds = 15,
    this.timerGlow,
  });

  @override
  Widget build(BuildContext context) {
    Widget avatar = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.22),
        border: Border.all(
          color: isActive ? _cyan : Colors.white.withOpacity(0.1),
          width: 2,
        ),
        color: _navy,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(size * 0.2),
        child: avatarUrl.isNotEmpty
            ? Image.network(avatarUrl, fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _initials())
            : _initials(),
      ),
    );

    if (rotated) {
      avatar = Transform.rotate(angle: pi, child: avatar);
    }

    // Hourglass badge
    Widget withBadge = Stack(
      clipBehavior: Clip.none,
      children: [
        avatar,
        Positioned(
          bottom: -4,
          right: -4,
          child: Container(
            width: 20,
            height: 20,
            decoration: BoxDecoration(
              color: _navy,
              shape: BoxShape.circle,
              border: Border.all(color: _bg, width: 1.5),
            ),
            child: const Icon(Icons.hourglass_empty,
                color: _textSub, size: 12),
          ),
        ),
      ],
    );

    return withBadge;
  }

  Widget _initials() => Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : '?',
          style: TextStyle(
              color: _cyan,
              fontSize: size * 0.38,
              fontWeight: FontWeight.w900),
        ),
      );
}

// ═════════════════════════════════════════════════════════════════════════════
//  BOKEH BACKGROUND
// ═════════════════════════════════════════════════════════════════════════════
class _Bokeh {
  final double x, y, radius, opacity, phase;
  const _Bokeh(
      {required this.x,
      required this.y,
      required this.radius,
      required this.opacity,
      required this.phase});
}

class _BokehBackground extends StatelessWidget {
  final AnimationController ctrl;
  final List<_Bokeh> bokeh;
  const _BokehBackground({required this.ctrl, required this.bokeh});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: ctrl,
      builder: (_, __) => CustomPaint(
        size: MediaQuery.of(context).size,
        painter: _BokehPainter(bokeh: bokeh, t: ctrl.value),
      ),
    );
  }
}

class _BokehPainter extends CustomPainter {
  final List<_Bokeh> bokeh;
  final double t;
  _BokehPainter({required this.bokeh, required this.t});

  @override
  void paint(Canvas canvas, Size size) {
    // Background
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = _bg,
    );

    for (final b in bokeh) {
      final pulse = (sin(t * 2 * pi + b.phase) + 1) / 2;
      final r = b.radius * (0.85 + pulse * 0.3);
      final opacity = b.opacity * (0.6 + pulse * 0.4);
      final paint = Paint()
        ..color = Colors.white.withOpacity(opacity)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 10);
      canvas.drawCircle(
        Offset(b.x * size.width, b.y * size.height),
        r,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_BokehPainter old) => old.t != t;
}

// ═════════════════════════════════════════════════════════════════════════════
//  ROTATE ICON BUTTON
// ═════════════════════════════════════════════════════════════════════════════
class _RotateIconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _RotateIconBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: _orange,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(icon, color: _white, size: 22),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  GAME OVER DIALOG
// ═════════════════════════════════════════════════════════════════════════════
class _GameOverDialog extends StatelessWidget {
  final bool isWinner;
  final String prizePool;
  final VoidCallback onClose;
  const _GameOverDialog(
      {required this.isWinner,
      required this.prizePool,
      required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Dialog(
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              isWinner ? '🏆 You Win!' : '💀 You Lost',
              style: const TextStyle(
                color: _textPrimary,
                fontSize: 26,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            if (isWinner)
              Text(
                'Prize: $prizePool',
                style: const TextStyle(
                    color: _orange,
                    fontSize: 18,
                    fontWeight: FontWeight.w700),
              ),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: onClose,
              child: Container(
                height: 50,
                decoration: BoxDecoration(
                  color: _orange,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(
                  child: Text(
                    'Back to Lobby',
                    style: TextStyle(
                      color: _white,
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  USAGE
//
//  // Offline / bot mode (no socket needed):
//  WhotGameScreen(
//    roomId: 'room_123',
//    playerId: 'player_abc',
//    playerName: 'Tolu',
//    opponentName: 'Uche_Vibe',
//    tournamentTitle: 'Wọt TOURNAMENT',
//    prizePool: '₦70,000',
//  )
//
//  // Online with socket.io:
//  WhotGameScreen(
//    roomId: roomId,
//    playerId: myId,
//    playerName: myName,
//    opponentName: opponentName,
//    socketService: MySocketService(), // implements WhotSocketService
//    tournamentTitle: 'Wọt TOURNAMENT',
//    prizePool: '₦70,000',
//  )
//
//  // MySocketService example (using socket_io_client):
//  //
//  // class MySocketService extends WhotSocketService {
//  //   late IO.Socket _socket;
//  //
//  //   @override
//  //   void connect({required roomId, required playerId, required handler}) {
//  //     _socket = IO.io('https://gamearn-bot.onrender.com', <String, dynamic>{
//  //       'transports': ['websocket'],
//  //       'autoConnect': false,
//  //     });
//  //     _socket.connect();
//  //     _socket.emit('join_room', {'roomId': roomId, 'playerId': playerId});
//  //
//  //     _socket.on('game_state',    (d) => handler.onGameState(d));
//  //     _socket.on('card_played',   (d) => handler.onCardPlayed(d));
//  //     _socket.on('card_drawn',    (d) => handler.onCardDrawn(d));
//  //     _socket.on('your_turn',     (_) => handler.onYourTurn());
//  //     _socket.on('opponent_turn', (_) => handler.onOpponentTurn());
//  //     _socket.on('market',        (d) => handler.onMarket(d['count']));
//  //     _socket.on('suspension',    (_) => handler.onSuspension());
//  //     _socket.on('general_market',(_) => handler.onGeneralMarket());
//  //     _socket.on('choose_shape',  (_) => handler.onChooseShape());
//  //     _socket.on('call_card',     (d) => handler.onCallCard(d['playerId']));
//  //     _socket.on('game_over',     (d) => handler.onGameOver(d));
//  //     _socket.on('timer_tick',    (d) => handler.onTimerTick(d['seconds']));
//  //     _socket.on('error',         (d) => handler.onError(d['message']));
//  //   }
//  //
//  //   @override
//  //   void emitPlayCard(roomId, playerId, card, {chosenShape}) =>
//  //     _socket.emit('play_card', {
//  //       'roomId': roomId, 'playerId': playerId,
//  //       'cardId': card.id, 'chosenShape': chosenShape?.name,
//  //     });
//  //
//  //   @override
//  //   void emitDrawCard(roomId, playerId) =>
//  //     _socket.emit('draw_card', {'roomId': roomId, 'playerId': playerId});
//  //
//  //   @override
//  //   void emitCallCard(roomId, playerId) =>
//  //     _socket.emit('call_card', {'roomId': roomId, 'playerId': playerId});
//  //
//  //   @override
//  //   void disconnect() => _socket.disconnect();
//  // }
// ─────────────────────────────────────────────────────────────────────────────