import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../theme.dart';

// ─────────────────────────────────────────────────────────────────────────────
// WHOT DOMAIN MODEL
// ─────────────────────────────────────────────────────────────────────────────

enum WhotShape { circle, triangle, cross, square, star, whot }

class WhotCard {
  final WhotShape shape;
  final int number; // 1–14 (20 for WHOT)

  const WhotCard(this.shape, this.number);

  bool matches(WhotCard top, {WhotShape? calledShape}) {
    if (shape == WhotShape.whot) return true;
    if (top.shape == WhotShape.whot) {
      return calledShape == null || shape == calledShape;
    }
    return shape == top.shape || number == top.number;
  }

  String get shapeLabel {
    switch (shape) {
      case WhotShape.circle:   return 'Circle';
      case WhotShape.triangle: return 'Triangle';
      case WhotShape.cross:    return 'Cross';
      case WhotShape.square:   return 'Square';
      case WhotShape.star:     return 'Star';
      case WhotShape.whot:     return 'WHOT';
    }
  }

  String get shapeEmoji {
    switch (shape) {
      case WhotShape.circle:   return '⭕';
      case WhotShape.triangle: return '🔺';
      case WhotShape.cross:    return '✚';
      case WhotShape.square:   return '🟦';
      case WhotShape.star:     return '⭐';
      case WhotShape.whot:     return '🃏';
    }
  }

  Color get shapeColor {
    switch (shape) {
      case WhotShape.circle:   return const Color(0xFF00E5FF);
      case WhotShape.triangle: return const Color(0xFFFF6D00);
      case WhotShape.cross:    return const Color(0xFFFF1744);
      case WhotShape.square:   return const Color(0xFF00E676);
      case WhotShape.star:     return const Color(0xFFFFC107);
      case WhotShape.whot:     return const Color(0xFFE040FB);
    }
  }

  bool get isSpecial => [1, 2, 5, 8, 14, 20].contains(number);

  String get specialLabel {
    switch (number) {
      case 1:  return 'Hold On';
      case 2:  return 'Pick 2';
      case 5:  return 'Pick 3';
      case 8:  return 'Suspension';
      case 14: return 'Gen. Market';
      case 20: return 'WHOT!';
      default: return '';
    }
  }

  @override
  String toString() => '$shapeLabel $number';
}

// ─────────────────────────────────────────────────────────────────────────────
// DECK BUILDER
// ─────────────────────────────────────────────────────────────────────────────

class WhotDeck {
  static List<WhotCard> buildDeck({Set<int> removedSpecials = const {}}) {
    final cards = <WhotCard>[];
    const shapes = [WhotShape.circle, WhotShape.triangle, WhotShape.cross, WhotShape.square, WhotShape.star];
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    for (final shape in shapes) {
      for (final n in numbers) {
        if (removedSpecials.contains(n)) continue;
        cards.add(WhotCard(shape, n));
      }
    }
    for (int i = 0; i < 5; i++) {
      if (!removedSpecials.contains(20)) cards.add(const WhotCard(WhotShape.whot, 20));
    }
    cards.shuffle(Random());
    return cards;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME STATE
// ─────────────────────────────────────────────────────────────────────────────

enum GamePhase { playing, whotCall, pickingUp, gameOver }

class WhotGameState {
  List<WhotCard> deck;
  List<WhotCard> playerHand;
  List<WhotCard> botHand;
  List<WhotCard> pile;
  bool playerTurn;
  GamePhase phase;
  WhotShape? calledShape;
  String? statusMessage;
  int pickUpPending;
  String? winner;
  bool lastCardAnnounced;

  WhotGameState({
    required this.deck,
    required this.playerHand,
    required this.botHand,
    required this.pile,
    this.playerTurn = true,
    this.phase = GamePhase.playing,
    this.calledShape,
    this.statusMessage,
    this.pickUpPending = 0,
    this.winner,
    this.lastCardAnnounced = false,
  });

  WhotCard get topCard => pile.last;

  Map<String, dynamic> toFirestore(String uid, String botId) => {
    'deck': deck.map(_cardToMap).toList(),
    'playerHand': playerHand.map(_cardToMap).toList(),
    'botHand': botHand.map(_cardToMap).toList(),
    'pile': pile.map(_cardToMap).toList(),
    'playerTurn': playerTurn,
    'phase': phase.name,
    'calledShape': calledShape?.name,
    'pickUpPending': pickUpPending,
    'winner': winner,
    'updatedAt': FieldValue.serverTimestamp(),
    'playerUid': uid,
  };

  static Map<String, dynamic> _cardToMap(WhotCard c) =>
      {'shape': c.shape.name, 'number': c.number};
}

WhotGameState _initGame(int startingCards) {
  final deck = WhotDeck.buildDeck();
  final playerHand = deck.sublist(0, startingCards);
  final botHand = deck.sublist(startingCards, startingCards * 2);
  var remaining = deck.sublist(startingCards * 2);
  int starterIdx = remaining.indexWhere((c) => !c.isSpecial && c.shape != WhotShape.whot);
  if (starterIdx == -1) starterIdx = 0;
  final starter = remaining[starterIdx];
  remaining = [...remaining]..removeAt(starterIdx);
  return WhotGameState(
    deck: remaining, playerHand: playerHand, botHand: botHand, pile: [starter],
    playerTurn: true, statusMessage: 'Your turn! Tap a card to play.',
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WHOT GAME SCREEN
// ─────────────────────────────────────────────────────────────────────────────

class WhotGameScreen extends StatefulWidget {
  final String gameId;
  final Map<String, dynamic> gameConfig;
  const WhotGameScreen({super.key, required this.gameId, required this.gameConfig});
  @override
  State<WhotGameScreen> createState() => _WhotGameScreenState();
}

class _WhotGameScreenState extends State<WhotGameScreen> with TickerProviderStateMixin {
  late WhotGameState _gs;
  late AnimationController _cardPlayAnim;
  late AnimationController _dealAnim;
  late AnimationController _pulseAnim;
  bool _botThinking = false;
  int _selectedCardIdx = -1;
  Timer? _botTimer;
  late int _startingCards;
  late DocumentReference _gameRef;
  final _uid = FirebaseAuth.instance.currentUser?.uid ?? 'guest';

  @override
  void initState() {
    super.initState();
    _startingCards = widget.gameConfig['startingCards'] ?? 6;
    _cardPlayAnim = AnimationController(vsync: this, duration: const Duration(milliseconds: 300));
    _dealAnim = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _pulseAnim = AnimationController(vsync: this, duration: const Duration(milliseconds: 800))..repeat(reverse: true);
    _gameRef = FirebaseFirestore.instance.collection('game_sessions').doc(widget.gameId);
    _gs = _initGame(_startingCards);
    _dealAnim.forward();
    _syncToFirestore();
  }

  @override
  void dispose() {
    _cardPlayAnim.dispose();
    _dealAnim.dispose();
    _pulseAnim.dispose();
    _botTimer?.cancel();
    super.dispose();
  }

  Future<void> _syncToFirestore() async {
    try { await _gameRef.set(_gs.toFirestore(_uid, 'bot'), SetOptions(merge: true)); } catch (_) {}
  }

  void _playCard(int idx) {
    if (!_gs.playerTurn || _gs.phase != GamePhase.playing || _botThinking) return;
    final card = _gs.playerHand[idx];
    if (_gs.pickUpPending > 0) {
      final canChain = (card.number == 2 || card.number == 5);
      if (!canChain) { _showStatus('You must pick up ${_gs.pickUpPending} cards first!'); return; }
    }
    if (!card.matches(_gs.topCard, calledShape: _gs.calledShape)) {
      _showStatus("That card doesn't match. Try another!");
      setState(() => _selectedCardIdx = idx);
      Future.delayed(const Duration(milliseconds: 400), () { if (mounted) setState(() => _selectedCardIdx = -1); });
      return;
    }
    setState(() { _gs.playerHand.removeAt(idx); _gs.pile.add(card); _gs.calledShape = null; _selectedCardIdx = -1; });
    _cardPlayAnim.forward(from: 0);
    _applySpecialCard(card, isPlayer: true);
  }

  void _applySpecialCard(WhotCard card, {required bool isPlayer}) {
    if (_gs.phase == GamePhase.gameOver) return;
    final hand = isPlayer ? _gs.playerHand : _gs.botHand;
    if (hand.isEmpty) { _endGame(isPlayer ? 'player' : 'bot'); return; }
    switch (card.number) {
      case 1:
        setState(() { _gs.statusMessage = isPlayer ? 'Hold On! You play again.' : 'Bot played Hold On! Bot plays again.'; });
        if (!isPlayer) _scheduleBotMove();
        break;
      case 2:
        setState(() { _gs.pickUpPending += 2; _gs.playerTurn = !isPlayer;
          _gs.statusMessage = isPlayer ? 'Pick Two! Bot must pick 2 cards.' : 'Bot played Pick Two! Pick up 2 cards.'; });
        if (isPlayer) _scheduleBotMove();
        break;
      case 5:
        setState(() { _gs.pickUpPending += 3; _gs.playerTurn = !isPlayer;
          _gs.statusMessage = isPlayer ? 'Pick Three! Bot must pick 3 cards.' : 'Bot played Pick Three! Pick up 3 cards.'; });
        if (isPlayer) _scheduleBotMove();
        break;
      case 8:
        setState(() { _gs.statusMessage = isPlayer ? "Suspension! Bot's turn is skipped." : "Bot played Suspension! Your turn is skipped."; });
        if (!isPlayer) _scheduleBotMove();
        break;
      case 14:
        setState(() { if (_gs.deck.isNotEmpty) _gs.playerHand.add(_gs.deck.removeLast());
          _gs.playerTurn = !isPlayer; _gs.statusMessage = 'General Market! Everyone picks 1 card.'; });
        if (isPlayer) _scheduleBotMove();
        break;
      case 20:
        if (isPlayer) { setState(() => _gs.phase = GamePhase.whotCall); }
        else { final botShape = _botChooseShape();
          setState(() { _gs.calledShape = botShape; _gs.playerTurn = true;
            _gs.statusMessage = 'Bot called ${botShape.name.toUpperCase()}!'; }); }
        break;
      default:
        setState(() { _gs.playerTurn = !isPlayer;
          _gs.statusMessage = isPlayer ? "Good play! Bot's turn..." : 'Your turn! Tap a card to play.'; });
        if (isPlayer) _scheduleBotMove();
    }
    _syncToFirestore();
  }

  void _playerPickUp() {
    if (!_gs.playerTurn || _gs.phase != GamePhase.playing) return;
    final count = _gs.pickUpPending > 0 ? _gs.pickUpPending : 1;
    setState(() {
      for (int i = 0; i < count && _gs.deck.isNotEmpty; i++) _gs.playerHand.add(_gs.deck.removeLast());
      _gs.pickUpPending = 0; _gs.playerTurn = false;
      _gs.statusMessage = "Picked up $count card${count > 1 ? 's' : ''}. Bot's turn...";
    });
    _scheduleBotMove(); _syncToFirestore();
  }

  void _scheduleBotMove() {
    if (_gs.phase == GamePhase.gameOver) return;
    _botTimer?.cancel(); setState(() => _botThinking = true);
    _botTimer = Timer(const Duration(milliseconds: 1200), _botMove);
  }

  void _botMove() {
    if (!mounted || _gs.phase == GamePhase.gameOver) return;
    if (_gs.pickUpPending > 0) {
      final chainIdx = _gs.botHand.indexWhere((c) => c.number == 2 || c.number == 5);
      if (chainIdx != -1) {
        final card = _gs.botHand[chainIdx];
        setState(() { _gs.botHand.removeAt(chainIdx); _gs.pile.add(card); _botThinking = false; });
        _applySpecialCard(card, isPlayer: false); return;
      } else {
        final count = _gs.pickUpPending;
        setState(() {
          for (int i = 0; i < count && _gs.deck.isNotEmpty; i++) _gs.botHand.add(_gs.deck.removeLast());
          _gs.pickUpPending = 0; _gs.playerTurn = true; _botThinking = false;
          _gs.statusMessage = 'Bot picked up $count card${count > 1 ? 's' : ''}. Your turn!';
        });
        return;
      }
    }
    final playable = _gs.botHand.asMap().entries.where((e) => e.value.matches(_gs.topCard, calledShape: _gs.calledShape)).toList();
    if (playable.isEmpty) {
      setState(() { if (_gs.deck.isNotEmpty) _gs.botHand.add(_gs.deck.removeLast());
        _gs.playerTurn = true; _botThinking = false; _gs.statusMessage = 'Bot picked up. Your turn!'; });
      _syncToFirestore(); return;
    }
    playable.sort((a, b) { if (a.value.isSpecial && !b.value.isSpecial) return -1;
      if (!a.value.isSpecial && b.value.isSpecial) return 1; return 0; });
    final chosen = playable.first;
    setState(() { _gs.botHand.removeAt(chosen.key); _gs.pile.add(chosen.value); _botThinking = false; _gs.calledShape = null; });
    _applySpecialCard(chosen.value, isPlayer: false);
  }

  WhotShape _botChooseShape() {
    final counts = <WhotShape, int>{};
    for (final c in _gs.botHand) { if (c.shape != WhotShape.whot) counts[c.shape] = (counts[c.shape] ?? 0) + 1; }
    if (counts.isEmpty) return WhotShape.circle;
    return counts.entries.reduce((a, b) => a.value >= b.value ? a : b).key;
  }

  void _callShape(WhotShape shape) {
    setState(() { _gs.calledShape = shape; _gs.phase = GamePhase.playing; _gs.playerTurn = false;
      _gs.statusMessage = "You called ${shape.name.toUpperCase()}! Bot's turn..."; });
    _scheduleBotMove(); _syncToFirestore();
  }

  void _endGame(String winner) {
    setState(() { _gs.winner = winner; _gs.phase = GamePhase.gameOver;
      _gs.statusMessage = winner == 'player' ? 'YOU WIN! 🎉' : 'Bot wins! Better luck next time.'; });
    if (winner == 'player') {
      FirebaseFirestore.instance.collection('users').doc(_uid).update({
        'gamesPlayed': FieldValue.increment(1), 'wins': FieldValue.increment(1), 'totalPoints': FieldValue.increment(50),
      }).catchError((_) {});
    }
    _syncToFirestore();
  }

  void _showStatus(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: kBgCard,
      behavior: SnackBarBehavior.floating, duration: const Duration(seconds: 1),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))));
  }

  void _restartGame() {
    _botTimer?.cancel();
    setState(() { _gs = _initGame(_startingCards); _botThinking = false; });
    _dealAnim.forward(from: 0); _syncToFirestore();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF060D1A),
      body: SafeArea(child: Stack(children: [
        CustomPaint(size: Size.infinite, painter: _GridPainter()),
        Column(children: [_buildTopBar(), _buildBotArea(), const SizedBox(height: 8),
          _buildPileAndDeck(), const SizedBox(height: 8), _buildStatusBar(), const SizedBox(height: 8),
          _buildPlayerArea(), const SizedBox(height: 12)]),
        if (_gs.phase == GamePhase.whotCall) _buildWhotPicker(),
        if (_gs.phase == GamePhase.gameOver) _buildGameOverOverlay(),
        if (_botThinking) Positioned(top: 120, left: 0, right: 0, child: Center(child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(color: kBgCard.withOpacity(0.9), borderRadius: BorderRadius.circular(20), border: Border.all(color: kBorder)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: kCyan)),
            const SizedBox(width: 8), const Text('Bot thinking...', style: TextStyle(color: kCyan, fontSize: 12))])))),
      ])));
  }

  Widget _buildTopBar() {
    return Padding(padding: const EdgeInsets.fromLTRB(12, 8, 12, 0), child: Row(children: [
      GestureDetector(onTap: () => _showQuitDialog(), child: Container(width: 36, height: 36,
        decoration: BoxDecoration(color: kBgCard, shape: BoxShape.circle, border: Border.all(color: kBorder)),
        child: const Icon(Icons.arrow_back_ios_new, color: kTextPri, size: 15))),
      const SizedBox(width: 12),
      const Text('WHOT', style: TextStyle(color: kTextPri, fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 3)),
      const Spacer(),
      Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: kBgCard, borderRadius: BorderRadius.circular(20), border: Border.all(color: kBorder)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.style, color: kTextSec, size: 13), const SizedBox(width: 4),
          Text('${_gs.deck.length}', style: const TextStyle(color: kTextPri, fontWeight: FontWeight.w700, fontSize: 12))]))
    ]));
  }

  Widget _buildBotArea() {
    return Padding(padding: const EdgeInsets.fromLTRB(12, 12, 12, 0), child: Column(children: [
      Row(children: [
        Container(width: 32, height: 32, decoration: BoxDecoration(shape: BoxShape.circle, color: kBgCard,
          border: Border.all(color: !_gs.playerTurn && _gs.phase == GamePhase.playing ? kOrange : kBorder, width: 2)),
          child: const Center(child: Text('🤖', style: TextStyle(fontSize: 16)))),
        const SizedBox(width: 8),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('BOT', style: TextStyle(color: kTextPri, fontWeight: FontWeight.w800, fontSize: 13)),
          Text('${_gs.botHand.length} cards', style: const TextStyle(color: kTextSec, fontSize: 11))]),
        const Spacer(),
        if (!_gs.playerTurn && _gs.phase == GamePhase.playing)
          AnimatedBuilder(animation: _pulseAnim, builder: (_, __) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: kOrange.withOpacity(0.1 + _pulseAnim.value * 0.15),
              borderRadius: BorderRadius.circular(20), border: Border.all(color: kOrange.withOpacity(0.5))),
            child: const Text("BOT'S TURN", style: TextStyle(color: kOrange, fontSize: 10, fontWeight: FontWeight.w800))))]),
      const SizedBox(height: 10),
      SizedBox(height: 60, child: Stack(children: List.generate(min(_gs.botHand.length, 10),
        (i) => Positioned(left: i * 22.0, child: _CardBack(highlighted: _gs.botHand.length == 1))))),
      if (_gs.botHand.length == 1) Container(margin: const EdgeInsets.only(top: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(color: Colors.redAccent.withOpacity(0.15), borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.redAccent.withOpacity(0.4))),
        child: const Text('⚠ BOT HAS 1 CARD LEFT!', style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.w800)))]));
  }

  Widget _buildPileAndDeck() {
    final top = _gs.topCard;
    return Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      GestureDetector(onTap: _gs.playerTurn ? _playerPickUp : null, child: Column(children: [
        Stack(children: [for (int i = 2; i >= 0; i--)
          Transform.translate(offset: Offset(-i * 2.0, -i * 2.0), child: const _CardBack())]),
        const SizedBox(height: 4),
        Text(_gs.pickUpPending > 0 ? 'PICK ${_gs.pickUpPending}' : 'DRAW',
          style: TextStyle(color: _gs.pickUpPending > 0 ? Colors.redAccent : kTextSec, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1))])),
      const SizedBox(width: 32),
      Column(children: [_WhotCardWidget(card: top, size: 90, calledShape: _gs.calledShape), const SizedBox(height: 4),
        Text('PILE', style: TextStyle(color: kTextSec, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1))])]);
  }

  Widget _buildStatusBar() {
    return Container(margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(color: kBgCard.withOpacity(0.8), borderRadius: BorderRadius.circular(10), border: Border.all(color: kBorder)),
      child: Row(children: [
        Icon(_gs.playerTurn ? Icons.person : Icons.smart_toy, color: _gs.playerTurn ? kCyan : kOrange, size: 14),
        const SizedBox(width: 8),
        Expanded(child: Text(_gs.statusMessage ?? '', style: TextStyle(color: _gs.playerTurn ? kCyan : kOrange, fontSize: 12, fontWeight: FontWeight.w600))),
        if (_gs.calledShape != null) Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(color: kCyan.withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
          child: Text('CALLED: ${_gs.calledShape!.name.toUpperCase()}', style: const TextStyle(color: kCyan, fontSize: 9, fontWeight: FontWeight.w800)))]));
  }

  Widget _buildPlayerArea() {
    return Column(children: [
      Padding(padding: const EdgeInsets.symmetric(horizontal: 16), child: Row(children: [
        Container(width: 32, height: 32, decoration: BoxDecoration(shape: BoxShape.circle, color: kBgCard,
          border: Border.all(color: _gs.playerTurn && _gs.phase == GamePhase.playing ? kCyan : kBorder, width: 2)),
          child: const Center(child: Text('😎', style: TextStyle(fontSize: 16)))),
        const SizedBox(width: 8),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('YOU', style: TextStyle(color: kTextPri, fontWeight: FontWeight.w800, fontSize: 13)),
          Text('${_gs.playerHand.length} cards', style: const TextStyle(color: kTextSec, fontSize: 11))]),
        const Spacer(),
        if (_gs.playerTurn && _gs.phase == GamePhase.playing)
          AnimatedBuilder(animation: _pulseAnim, builder: (_, __) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: kCyan.withOpacity(0.1 + _pulseAnim.value * 0.15),
              borderRadius: BorderRadius.circular(20), border: Border.all(color: kCyan.withOpacity(0.5))),
            child: const Text('YOUR TURN', style: TextStyle(color: kCyan, fontSize: 10, fontWeight: FontWeight.w800))))])),
      const SizedBox(height: 10),
      SizedBox(height: 110, child: _gs.playerHand.isEmpty
        ? const Center(child: Text('No cards!', style: TextStyle(color: kTextSec, fontSize: 13)))
        : ListView.builder(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: _gs.playerHand.length, itemBuilder: (_, i) {
            final card = _gs.playerHand[i];
            final canPlay = _gs.playerTurn && _gs.phase == GamePhase.playing && card.matches(_gs.topCard, calledShape: _gs.calledShape);
            return GestureDetector(onTap: _gs.playerTurn ? () => _playCard(i) : null,
              child: AnimatedContainer(duration: const Duration(milliseconds: 200), margin: const EdgeInsets.only(right: 8),
                transform: Matrix4.translationValues(0, canPlay ? -12 : (_selectedCardIdx == i ? -8 : 0), 0),
                child: _WhotCardWidget(card: card, size: 72, playable: canPlay, selected: _selectedCardIdx == i)));})),
      if (_gs.playerHand.length == 1) Padding(padding: const EdgeInsets.only(top: 6), child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
        decoration: BoxDecoration(color: kGreen.withOpacity(0.15), borderRadius: BorderRadius.circular(20),
          border: Border.all(color: kGreen.withOpacity(0.4))),
        child: const Text('🎯 LAST CARD — Play it to win!', style: TextStyle(color: kGreen, fontSize: 11, fontWeight: FontWeight.w800))))]);
  }

  Widget _buildWhotPicker() {
    const shapes = [WhotShape.circle, WhotShape.triangle, WhotShape.cross, WhotShape.square, WhotShape.star];
    return Container(color: Colors.black54, child: Center(child: Container(
      margin: const EdgeInsets.all(32), padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: kBgCard, borderRadius: BorderRadius.circular(20), border: Border.all(color: kBorder)),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        const Text('WHOT! Choose a shape', style: TextStyle(color: kTextPri, fontWeight: FontWeight.w800, fontSize: 18)),
        const SizedBox(height: 6),
        const Text('Pick the shape your opponent must match', style: TextStyle(color: kTextSec, fontSize: 12)),
        const SizedBox(height: 20),
        Wrap(spacing: 12, runSpacing: 12, children: shapes.map((s) {
          final color = WhotCard(s, 1).shapeColor;
          final emoji = WhotCard(s, 1).shapeEmoji;
          return GestureDetector(onTap: () => _callShape(s), child: Container(width: 72, height: 72,
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12),
              border: Border.all(color: color.withOpacity(0.5), width: 2)),
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text(emoji, style: const TextStyle(fontSize: 24)), const SizedBox(height: 4),
              Text(s.name.toUpperCase(), style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.w800))])));
        }).toList())]))));
  }

  Widget _buildGameOverOverlay() {
    final won = _gs.winner == 'player';
    return Container(color: Colors.black87, child: Center(child: Container(
      margin: const EdgeInsets.all(32), padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(color: kBgCard, borderRadius: BorderRadius.circular(20),
        border: Border.all(color: won ? kGreen.withOpacity(0.5) : Colors.redAccent.withOpacity(0.5), width: 2)),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(won ? '🎉' : '😞', style: const TextStyle(fontSize: 56)), const SizedBox(height: 12),
        Text(won ? 'YOU WIN!' : 'BOT WINS', style: TextStyle(color: won ? kGreen : Colors.redAccent, fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: 2)),
        const SizedBox(height: 6),
        Text(won ? '+50 points earned!' : 'Better luck next time!', style: const TextStyle(color: kTextSec, fontSize: 14)),
        const SizedBox(height: 24),
        Row(children: [
          Expanded(child: OutlinedButton(onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(side: const BorderSide(color: kBorder), padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('EXIT', style: TextStyle(color: kTextSec, fontWeight: FontWeight.w700)))),
          const SizedBox(width: 12),
          Expanded(child: ElevatedButton(onPressed: _restartGame,
            style: ElevatedButton.styleFrom(backgroundColor: won ? kGreen : kOrange, foregroundColor: kBgDeep,
              padding: const EdgeInsets.symmetric(vertical: 14), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0),
            child: const Text('PLAY AGAIN', style: TextStyle(fontWeight: FontWeight.w800))))])]))));
  }

  void _showQuitDialog() {
    showDialog(context: context, builder: (_) => AlertDialog(backgroundColor: kBgCard,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('Quit Game?', style: TextStyle(color: kTextPri, fontWeight: FontWeight.w700)),
      content: const Text('Your progress will be lost.', style: TextStyle(color: kTextSec)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Stay', style: TextStyle(color: kCyan))),
        TextButton(onPressed: () { Navigator.pop(context); Navigator.pop(context); },
          child: const Text('Quit', style: TextStyle(color: Colors.redAccent)))]));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WHOT CARD WIDGET
// ─────────────────────────────────────────────────────────────────────────────

class _WhotCardWidget extends StatelessWidget {
  final WhotCard card; final double size; final bool playable; final bool selected; final WhotShape? calledShape;
  const _WhotCardWidget({required this.card, required this.size, this.playable = false, this.selected = false, this.calledShape});

  @override
  Widget build(BuildContext context) {
    final isWhot = card.shape == WhotShape.whot;
    final color = card.shapeColor;
    return AnimatedContainer(duration: const Duration(milliseconds: 200), width: size, height: size * 1.4,
      decoration: BoxDecoration(color: const Color(0xFF0F1829), borderRadius: BorderRadius.circular(10),
        border: Border.all(color: selected ? Colors.redAccent : playable ? color : kBorder, width: playable ? 2.5 : 1),
        boxShadow: playable ? [BoxShadow(color: color.withOpacity(0.4), blurRadius: 8, spreadRadius: 1)] : []),
      child: Stack(children: [
        Positioned(top: 4, left: 6, child: Text('${card.number}', style: TextStyle(color: color, fontSize: size * 0.18, fontWeight: FontWeight.w900))),
        Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Text(isWhot ? '🃏' : card.shapeEmoji, style: TextStyle(fontSize: size * 0.32)),
          if (size > 70) ...[const SizedBox(height: 2),
            Text(isWhot ? 'WHOT' : card.shapeLabel.toUpperCase(), style: TextStyle(color: color, fontSize: size * 0.11, fontWeight: FontWeight.w800, letterSpacing: 0.5))],
          if (card.isSpecial && size > 70) ...[const SizedBox(height: 1),
            Text(card.specialLabel, style: TextStyle(color: color.withOpacity(0.7), fontSize: size * 0.09, fontWeight: FontWeight.w700))]])),
        Positioned(bottom: 4, right: 6, child: Text('${card.number}', style: TextStyle(color: color, fontSize: size * 0.18, fontWeight: FontWeight.w900)))]));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD BACK WIDGET
// ─────────────────────────────────────────────────────────────────────────────

class _CardBack extends StatelessWidget {
  final bool highlighted;
  const _CardBack({this.highlighted = false});
  @override
  Widget build(BuildContext context) {
    return Container(width: 44, height: 62,
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF1A2744), Color(0xFF0D1829)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(7),
        border: Border.all(color: highlighted ? kOrange : kBorder, width: highlighted ? 2 : 1)),
      child: Center(child: Text('G', style: TextStyle(color: (highlighted ? kOrange : kCyan).withOpacity(0.4), fontSize: 20, fontWeight: FontWeight.w900))));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GRID BACKGROUND PAINTER
// ─────────────────────────────────────────────────────────────────────────────

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = const Color(0xFF1A2744).withOpacity(0.3)..strokeWidth = 0.5;
    const step = 32.0;
    for (double x = 0; x < size.width; x += step) canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    for (double y = 0; y < size.height; y += step) canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
  }
  @override
  bool shouldRepaint(_) => false;
}

// ─────────────────────────────────────────────────────────────────────────────
// WHOT SETUP SCREEN
// ─────────────────────────────────────────────────────────────────────────────

class WhotSetupScreen extends StatefulWidget {
  const WhotSetupScreen({super.key});
  @override
  State<WhotSetupScreen> createState() => _WhotSetupScreenState();
}

class _WhotSetupScreenState extends State<WhotSetupScreen> {
  int _startingCards = 6;
  final Set<int> _removedSpecials = {};
  static const _specialCards = [
    {'number': 1, 'label': 'Hold On', 'desc': 'Next player skips turn'},
    {'number': 2, 'label': 'Pick Two', 'desc': 'Next player picks 2'},
    {'number': 5, 'label': 'Pick Three', 'desc': 'Next player picks 3'},
    {'number': 8, 'label': 'Suspension', 'desc': 'Next player misses turn'},
    {'number': 14, 'label': 'General Market', 'desc': 'Everyone picks 1'},
    {'number': 20, 'label': 'WHOT Card', 'desc': 'Wild — change shape'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(backgroundColor: kBgDeep, appBar: AppBar(backgroundColor: kBgDeep, elevation: 0,
      leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, color: kTextPri, size: 18), onPressed: () => Navigator.pop(context)),
      title: const Text('WHOT Setup', style: TextStyle(color: kTextPri, fontWeight: FontWeight.w800))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        Text('STARTING CARDS', style: kLabel.copyWith(color: kCyan)), const SizedBox(height: 12),
        Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: kBgCard, borderRadius: BorderRadius.circular(14), border: Border.all(color: kBorder)),
          child: Column(children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              const Text('Cards per player', style: TextStyle(color: kTextPri, fontWeight: FontWeight.w600)),
              Text('$_startingCards', style: const TextStyle(color: kCyan, fontWeight: FontWeight.w800, fontSize: 18))]),
            Slider(value: _startingCards.toDouble(), min: 3, max: 10, divisions: 7, activeColor: kCyan, inactiveColor: kBorder,
              onChanged: (v) => setState(() => _startingCards = v.round())),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('3', style: kLabel), Text('10', style: kLabel)])])),
        const SizedBox(height: 24),
        Text('SPECIAL CARDS', style: kLabel.copyWith(color: kCyan)), const SizedBox(height: 4),
        const Text('Remove special cards from the deck', style: TextStyle(color: kTextSec, fontSize: 12)),
        const SizedBox(height: 12),
        ..._specialCards.map((sc) {
          final n = sc['number'] as int; final removed = _removedSpecials.contains(n);
          return Container(margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(color: kBgCard, borderRadius: BorderRadius.circular(12),
              border: Border.all(color: removed ? kBorder : kCyan.withOpacity(0.2))),
            child: Row(children: [
              Container(width: 36, height: 36, decoration: BoxDecoration(color: removed ? kBorder.withOpacity(0.5) : kCyan.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8)),
                child: Center(child: Text('$n', style: TextStyle(color: removed ? kTextMuted : kCyan, fontWeight: FontWeight.w900, fontSize: 14)))),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(sc['label'] as String, style: TextStyle(color: removed ? kTextMuted : kTextPri, fontWeight: FontWeight.w600)),
                Text(sc['desc'] as String, style: TextStyle(color: removed ? kTextMuted : kTextSec, fontSize: 11))])),
              Switch(value: !removed, activeColor: kCyan, inactiveThumbColor: kTextMuted, inactiveTrackColor: kBorder,
                onChanged: (v) => setState(() { if (v) _removedSpecials.remove(n); else _removedSpecials.add(n); }))])); }),
        const SizedBox(height: 32),
        SizedBox(width: double.infinity, height: 54, child: ElevatedButton(
          onPressed: () { final gameId = FirebaseFirestore.instance.collection('game_sessions').doc().id;
            Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => WhotGameScreen(gameId: gameId,
              gameConfig: {'startingCards': _startingCards, 'removedSpecials': _removedSpecials.toList(), 'gameType': 'whot'}))); },
          style: ElevatedButton.styleFrom(backgroundColor: kOrange, foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0),
          child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('START GAME', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            SizedBox(width: 8), Icon(Icons.play_arrow, size: 20)]))),
        const SizedBox(height: 32)]));
  }
}
