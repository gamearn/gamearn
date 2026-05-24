import 'dart:async';
import 'dart:math';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

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

enum WhotShape { cross, square, circle, triangle, star, whot }

extension WhotShapeExt on WhotShape {
  String get label {
    switch (this) {
      case WhotShape.cross: return '✛';
      case WhotShape.square: return '■';
      case WhotShape.circle: return '●';
      case WhotShape.triangle: return '▲';
      case WhotShape.star: return '★';
      case WhotShape.whot: return '*';
    }
  }

  String get name {
    switch (this) {
      case WhotShape.cross: return 'cross';
      case WhotShape.square: return 'square';
      case WhotShape.circle: return 'circle';
      case WhotShape.triangle: return 'triangle';
      case WhotShape.star: return 'star';
      case WhotShape.whot: return 'whot';
    }
  }
}

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

abstract class WhotSocketService {
  void connect({
    required String roomId,
    required String playerId,
    required WhotGameEventHandler handler,
  });
  void emitPlayCard(String roomId, String playerId, WhotCard card, {WhotShape? chosenShape});
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

// ── Live Gamearn Engine AI Client Bridge ──────────────────────────────────────
class _GamearnBotService {
  final String apiEndpoint = 'https://gamearn-bot.onrender.com/get_move';

  Future<int?> fetchMctsMove(List<int> actionHistory) async {
    try {
      final res = await http.post(
        Uri.parse(apiEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'game_name': 'whot',
          'action_history': actionHistory,
          'player_rating': 1500,
        }),
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(res.body);
        return body['action'] as int;
      }
    } catch (_) {
      // Fallback local choice if network breaks down during demonstrations
    }
    return null;
  }
}

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
  
  late AnimationController _bokeCtrl;
  late AnimationController _timerGlowCtrl;
  late Animation<double> _timerGlow;

  List<WhotCard> _playerHand = [
    WhotCard(shape: WhotShape.cross, number: 2, id: 'c1'),
    WhotCard(shape: WhotShape.square, number: 3, id: 'c2'),
    WhotCard(shape: WhotShape.whot, number: 20, id: 'c3'),
    WhotCard(shape: WhotShape.star, number: 8, id: 'c4'),
    WhotCard(shape: WhotShape.circle, number: 10, id: 'c5'),
  ];
  int _opponentCardCount = 5;
  WhotCard _topCard = WhotCard(shape: WhotShape.triangle, number: 14, id: 'top');

  bool _isMyTurn = true;
  int _timerSeconds = 15;
  Timer? _countdownTimer;

  int _selectedIndex = -1;
  bool _showShapeChooser = false;
  bool _showCallCardOverlay = false;
  bool _isLandscape = false;

  late WhotSocketService _socket;
  final _GamearnBotService _aiEngine = _GamearnBotService();
  final List<int> _actionHistorySequence = [];

  @override
  void initState() {
    super.initState();
    _socket = widget.socketService ?? _DummySocketService();

    _bokeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat(reverse: true);

    _timerGlowCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat(reverse: true);
    _timerGlow = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _timerGlowCtrl, curve: Curves.easeInOut),
    );

    _socket.connect(
      roomId: widget.roomId,
      playerId: widget.playerId,
      handler: this,
    );

    _startCountdown();
  }

  @override
  void dispose() {
    _bokeCtrl.dispose();
    _timerGlowCtrl.dispose();
    _countdownTimer?.cancel();
    _socket.disconnect();
    super.dispose();
  }

  void _startCountdown() {
    _countdownTimer?.cancel();
    _timerSeconds = 15;
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) { t.cancel(); return; }
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
    _socket.emitDrawCard(widget.roomId, widget.playerId);
    _drawCard(fromServer: false);
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  @override void onGameState(Map<String, dynamic> state) {}
  @override void onCardPlayed(Map<String, dynamic> data) {}
  @override void onCardDrawn(Map<String, dynamic> data) {}
  @override void onYourTurn() { setState(() => _isMyTurn = true); _startCountdown(); }
  @override void onOpponentTurn() { setState(() => _isMyTurn = false); _startCountdown(); }
  @override void onMarket(int count) {}
  @override void onSuspension() {}
  @override void onGeneralMarket() {}
  @override void onChooseShape() {}
  @override void onCallCard(String playerId) {}
  @override void onGameOver(Map<String, dynamic> data) {}
  @override void onTimerTick(int seconds) { setState(() => _timerSeconds = seconds); }
  @override void onError(String message) => _showToast(message);

  bool _canPlay(WhotCard card) {
    if (card.isWhot) return true;
    if (card.shape == _topCard.shape) return true;
    if (card.number == _topCard.number) return true;
    return false;
  }

  void _playCard({WhotShape? chosenShape}) {
    if (_selectedIndex < 0 || !_isMyTurn) return;
    final card = _playerHand[_selectedIndex];
    if (!_canPlay(card)) {
      _showToast('Invalid card! Match shape or number.');
      return;
    }
    if (card.isWhot && chosenShape == null) {
      setState(() => _showShapeChooser = true);
      return;
    }

    // Append internal move integer identification sequence mapping to OpenSpiel array structure
    _actionHistorySequence.add(card.number + card.shape.index * 20);

    _socket.emitPlayCard(widget.roomId, widget.playerId, card, chosenShape: chosenShape);
    
    setState(() {
      _topCard = card;
      _playerHand.removeAt(_selectedIndex);
      _selectedIndex = -1;
      _isMyTurn = false;
      _showShapeChooser = false;
    });
    HapticFeedback.lightImpact();

    // Trigger AI compilation response sequence
    if (widget.socketService == null) {
      _triggerAiCalculationLoop();
    }
  }

  void _triggerAiCalculationLoop() async {
    _startCountdown();
    // Fetch optimum play selection from Render instance
    int? botAction = await _aiEngine.fetchMctsMove(_actionHistorySequence);
    
    if (!mounted) return;

    if (botAction != null) {
      _actionHistorySequence.add(botAction);
      // Map sequence structure back down to dummy display cards
      setState(() {
        _topCard = WhotCard(shape: WhotShape.values[botAction % 6], number: (botAction % 14) + 1);
        if (_opponentCardCount > 1) _opponentCardCount--;
        _isMyTurn = true;
      });
    } else {
      // Bot draws card if choice calculation times out or returns skip actions
      setState(() {
        _opponentCardCount++;
        _isMyTurn = true;
      });
    }
    _startCountdown();
  }

  void _drawCard({bool fromServer = true}) {
    if (!_isMyTurn && fromServer) return;
    _socket.emitDrawCard(widget.roomId, widget.playerId);
    
    _actionHistorySequence.add(0); // 0 corresponds to a 'draw' action item sequence entry

    setState(() {
      _playerHand.add(WhotCard(shape: WhotShape.values[Random().nextInt(5)], number: Random().nextInt(13) + 1));
      _isMyTurn = false;
    });
    HapticFeedback.selectionClick();

    if (widget.socketService == null) {
      _triggerAiCalculationLoop();
    }
  }

  void _callCard() {
    _socket.emitCallCard(widget.roomId, widget.playerId);
    setState(() => _showCallCardOverlay = false);
    _showToast('Card called! 🔔');
  }

  void _showToast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(color: _textPrimary, fontWeight: FontWeight.w600)),
      backgroundColor: _navy,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: const Duration(seconds: 2),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Text(widget.tournamentTitle, style: const TextStyle(color: _orange, fontSize: 18, fontWeight: FontWeight.w900)),
            ),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Text('${widget.opponentName} Cards: $_opponentCardCount', style: const TextStyle(color: _textPrimary)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      GestureDetector(
                        onTap: _isMyTurn ? () => _drawCard(fromServer: true) : null,
                        child: Container(width: 80, height: 110, color: _navy, child: const Center(child: Text('DRAW', style: TextStyle(color: _white)))),
                      ),
                      const SizedBox(width: 40),
                      Container(
                        width: 80, height: 110, 
                        color: _white, 
                        child: Center(child: Text('${_topCard.shape.label}\n${_topCard.number}', textAlign: TextAlign.center, style: const TextStyle(color: _navy, fontSize: 18, fontWeight: FontWeight.bold))),
                      ),
                    ],
                  ),
                  SizedBox(
                    height: 80,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      shrinkWrap: true,
                      itemCount: _playerHand.length,
                      itemBuilder: (ctx, idx) {
                        final card = _playerHand[idx];
                        final isSelected = _selectedIndex == idx;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedIndex = isSelected ? -1 : idx),
                          child: Container(
                            width: 60,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            color: isSelected ? _cyan : _cardBg,
                            child: Center(child: Text('${card.shape.label}\n${card.number}', textAlign: TextAlign.center, style: const TextStyle(color: _navyDeep))),
                          ),
                        );
                      },
                    ),
                  ),
                  ElevatedButton(
                    onPressed: _selectedIndex >= 0 && _isMyTurn ? () => _playCard() : null,
                    style: ElevatedButton.styleFrom(backgroundColor: _orange),
                    child: const Text('PLAY SELECTED CARD', style: TextStyle(color: _white)),
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
