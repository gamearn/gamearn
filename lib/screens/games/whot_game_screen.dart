import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../theme.dart';
import 'whot_card_widget.dart';

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
    if (calledShape != null) return shape == calledShape;
    return shape == top.shape || number == top.number;
  }

  bool get isSpecial => [1, 2, 5, 8, 14, 20].contains(number);
  String get specialLabel {
    switch (number) {
      case 1:
        return 'Hold On';
      case 2:
        return 'Pick Two';
      case 5:
        return 'Pick Three';
      case 8:
        return 'Suspension';
      case 14:
        return 'General Market';
      case 20:
        return 'WHOT';
      default:
        return '';
    }
  }

  String get shapeLabel => shape.name;
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME STATE ENGINE
// ─────────────────────────────────────────────────────────────────────────────

enum GamePhase { playing, whotCall, gameOver }

class WhotGameState {
  final List<WhotCard> deck;
  final List<WhotCard> playerHand;
  final List<WhotCard> botHand;
  final List<WhotCard> pile;
  final bool playerTurn;
  final WhotShape? calledShape;
  final int pickUpPending;
  final GamePhase phase;
  final String? statusMessage;
  final String? winner;

  WhotGameState({
    required this.deck,
    required this.playerHand,
    required this.botHand,
    required this.pile,
    this.playerTurn = true,
    this.calledShape,
    this.pickUpPending = 0,
    this.phase = GamePhase.playing,
    this.statusMessage,
    this.winner,
  });

  WhotCard get topCard => pile.last;

  WhotGameState copyWith({
    List<WhotCard>? deck,
    List<WhotCard>? playerHand,
    List<WhotCard>? botHand,
    List<WhotCard>? pile,
    bool? playerTurn,
    WhotShape? calledShape,
    int? pickUpPending,
    GamePhase? phase,
    String? statusMessage,
    String? winner,
  }) {
    return WhotGameState(
      deck: deck ?? this.deck,
      playerHand: playerHand ?? this.playerHand,
      botHand: botHand ?? this.botHand,
      pile: pile ?? this.pile,
      playerTurn: playerTurn ?? this.playerTurn,
      calledShape: calledShape ?? this.calledShape,
      pickUpPending: pickUpPending ?? this.pickUpPending,
      phase: phase ?? this.phase,
      statusMessage: statusMessage ?? this.statusMessage,
      winner: winner ?? this.winner,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GAME SCREEN
// ─────────────────────────────────────────────────────────────────────────────

class WhotGameScreen extends StatefulWidget {
  final String gameId;
  final Map<String, dynamic> gameConfig;

  const WhotGameScreen(
      {super.key, required this.gameId, required this.gameConfig});

  @override
  State<WhotGameScreen> createState() => _WhotGameScreenState();
}

class _WhotGameScreenState extends State<WhotGameScreen>
    with TickerProviderStateMixin {
  late WhotGameState _gs;
  late AnimationController _dealAnim;
  late AnimationController _pulseAnim;
  bool _botThinking = false;
  Timer? _botTimer;
  int _selectedCardIdx = -1;

  int get _startingCards => widget.gameConfig['startingCards'] ?? 6;

  @override
  void initState() {
    super.initState();
    _gs = _initGame(_startingCards);
    _dealAnim = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800))
      ..forward();
    _pulseAnim =
        AnimationController(vsync: this, duration: const Duration(seconds: 2))
          ..repeat(reverse: true);
    _syncToFirestore();
  }

  @override
  void dispose() {
    _botTimer?.cancel();
    _dealAnim.dispose();
    _pulseAnim.dispose();
    super.dispose();
  }

  WhotGameState _initGame(int count) {
    final fullDeck = _buildDeck();
    fullDeck.shuffle();
    final playerHand = fullDeck.sublist(0, count);
    final botHand = fullDeck.sublist(count, count * 2);
    final deck = fullDeck.sublist(count * 2);

    // Pile must start with a non-special card if possible
    int pileIdx = 0;
    while (pileIdx < deck.length && deck[pileIdx].isSpecial) {
      pileIdx++;
    }
    if (pileIdx >= deck.length) pileIdx = 0;

    final startCard = deck.removeAt(pileIdx);
    return WhotGameState(
      deck: deck,
      playerHand: playerHand,
      botHand: botHand,
      pile: [startCard],
      statusMessage: "Game started! Your turn.",
    );
  }

  List<WhotCard> _buildDeck() {
    final List<WhotCard> d = [];
    final shapes = [
      WhotShape.circle,
      WhotShape.triangle,
      WhotShape.cross,
      WhotShape.square,
      WhotShape.star
    ];
    for (final s in shapes) {
      final numbers = s == WhotShape.star
          ? [1, 2, 3, 4, 5, 7, 8]
          : [1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 14];
      for (final n in numbers) {
        if (!(widget.gameConfig['removedSpecials'] as List? ?? [])
            .contains(n)) {
          d.add(WhotCard(s, n));
        }
      }
    }
    // WHOT cards
    if (!(widget.gameConfig['removedSpecials'] as List? ?? []).contains(20)) {
      for (int i = 0; i < 4; i++) d.add(const WhotCard(WhotShape.whot, 20));
    }
    return d;
  }

  void _syncToFirestore() {
    FirebaseFirestore.instance
        .collection('game_sessions')
        .doc(widget.gameId)
        .set({
      'playerHandCount': _gs.playerHand.length,
      'botHandCount': _gs.botHand.length,
      'topCard': {
        'shape': _gs.topCard.shape.name,
        'number': _gs.topCard.number
      },
      'phase': _gs.phase.name,
      'winner': _gs.winner,
      'lastUpdate': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  void _playerPickUp() {
    if (!_gs.playerTurn || _gs.phase != GamePhase.playing) return;
    _performPickUp(true);
  }

  void _performPickUp(bool isPlayer) {
    setState(() {
      final cardsToTake = max(1, _gs.pickUpPending);
      final List<WhotCard> drawn = [];
      var currentDeck = List<WhotCard>.from(_gs.deck);

      if (currentDeck.length < cardsToTake) {
        final oldPile = _gs.pile.sublist(0, _gs.pile.length - 1);
        currentDeck.addAll(oldPile..shuffle());
        _gs = _gs.copyWith(pile: [_gs.pile.last]);
      }

      for (int i = 0; i < cardsToTake; i++) {
        if (currentDeck.isNotEmpty) drawn.add(currentDeck.removeAt(0));
      }

      if (isPlayer) {
        _gs = _gs.copyWith(
          deck: currentDeck,
          playerHand: [..._gs.playerHand, ...drawn],
          pickUpPending: 0,
          playerTurn: false,
          statusMessage: "You picked up ${drawn.length} cards. Bot's turn.",
        );
      } else {
        _gs = _gs.copyWith(
          deck: currentDeck,
          botHand: [..._gs.botHand, ...drawn],
          pickUpPending: 0,
          playerTurn: true,
          statusMessage: "Bot picked up ${drawn.length} cards. Your turn.",
        );
      }
    });
    _syncToFirestore();
    if (!_gs.playerTurn) _triggerBot();
  }

  void _playCard(int index) {
    if (!_gs.playerTurn || _gs.phase != GamePhase.playing) return;
    final card = _gs.playerHand[index];
    if (!card.matches(_gs.topCard, calledShape: _gs.calledShape)) {
      setState(() => _selectedCardIdx = index);
      Future.delayed(const Duration(milliseconds: 500),
          () => setState(() => _selectedCardIdx = -1));
      return;
    }

    setState(() {
      final newHand = List<WhotCard>.from(_gs.playerHand)..removeAt(index);
      _handleCardPlacement(card, newHand, true);
    });
  }

  void _handleCardPlacement(
      WhotCard card, List<WhotCard> newHand, bool isPlayer) {
    int newPending = _gs.pickUpPending;
    if (card.number == 2) newPending += 2;
    if (card.number == 5) newPending += 3;

    bool nextTurnIsSame = (card.number == 1); // Hold On
    bool skipNext = (card.number == 8); // Suspension

    String msg = isPlayer
        ? "You played ${card.shapeLabel} ${card.number}"
        : "Bot played ${card.shapeLabel} ${card.number}";

    WhotGameState nextState = _gs.copyWith(
      pile: [..._gs.pile, card],
      playerHand: isPlayer ? newHand : _gs.playerHand,
      botHand: isPlayer ? _gs.botHand : newHand,
      pickUpPending: newPending,
      calledShape: null,
      statusMessage: msg,
    );

    if (newHand.isEmpty) {
      _gs = nextState.copyWith(
          phase: GamePhase.gameOver, winner: isPlayer ? 'player' : 'bot');
      _syncToFirestore();
      return;
    }

    if (card.number == 20) {
      _gs = nextState.copyWith(
          phase: isPlayer ? GamePhase.whotCall : GamePhase.playing);
      if (!isPlayer) {
        // Bot auto-calls most frequent shape
        final shapes =
            WhotShape.values.where((s) => s != WhotShape.whot).toList();
        final counts = {
          for (var s in shapes) s: _gs.botHand.where((c) => c.shape == s).length
        };
        final bestShape =
            shapes.reduce((a, b) => counts[a]! >= counts[b]! ? a : b);
        _gs = _gs.copyWith(
            calledShape: bestShape,
            playerTurn: true,
            statusMessage: "Bot called ${bestShape.name.toUpperCase()}");
      }
    } else if (card.number == 14) {
      // General Market
      _gs =
          nextState.copyWith(statusMessage: "GENERAL MARKET! Everyone picks 1");
      _syncToFirestore();
      Future.delayed(
          const Duration(seconds: 1), () => _handleGeneralMarket(isPlayer));
      return;
    } else {
      bool nextTurn = isPlayer ? nextTurnIsSame : !nextTurnIsSame;
      if (skipNext)
        nextTurn =
            isPlayer; // If player plays suspension, it's player turn again (bot skips)
      _gs = nextState.copyWith(playerTurn: nextTurn);
    }

    _syncToFirestore();
    if (!_gs.playerTurn) _triggerBot();
  }

  void _handleGeneralMarket(bool activePlayerWasPlayer) {
    setState(() {
      var deck = List<WhotCard>.from(_gs.deck);
      final pCard = deck.removeAt(0);
      final bCard = deck.removeAt(0);
      _gs = _gs.copyWith(
        deck: deck,
        playerHand: [..._gs.playerHand, pCard],
        botHand: [..._gs.botHand, bCard],
        playerTurn: !activePlayerWasPlayer, // Turn passes to other player
      );
    });
    _syncToFirestore();
    if (!_gs.playerTurn) _triggerBot();
  }

  void _callShape(WhotShape shape) {
    setState(() {
      _gs = _gs.copyWith(
        calledShape: shape,
        phase: GamePhase.playing,
        playerTurn: false,
        statusMessage: "You called ${shape.name.toUpperCase()}. Bot's turn.",
      );
    });
    _syncToFirestore();
    _triggerBot();
  }

  void _triggerBot() {
    if (_gs.phase != GamePhase.playing || _gs.playerTurn) return;
    setState(() => _botThinking = true);
    _botTimer = Timer(const Duration(milliseconds: 1500), () {
      if (!mounted) return;
      setState(() {
        _botThinking = false;
        final playableIndices = <int>[];
        for (int i = 0; i < _gs.botHand.length; i++) {
          if (_gs.botHand[i].matches(_gs.topCard, calledShape: _gs.calledShape))
            playableIndices.add(i);
        }

        if (playableIndices.isEmpty) {
          _performPickUp(false);
        } else {
          // Bot Strategy: play special cards first
          playableIndices.sort((a, b) => _gs.botHand[b].isSpecial ? 1 : -1);
          final idx = playableIndices.first;
          final card = _gs.botHand[idx];
          final newHand = List<WhotCard>.from(_gs.botHand)..removeAt(idx);
          _handleCardPlacement(card, newHand, false);
        }
      });
    });
  }

  void _showStatus(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(msg),
        backgroundColor: kBgCard,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 1),
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))));
  }

  void _restartGame() {
    _botTimer?.cancel();
    setState(() {
      _gs = _initGame(_startingCards);
      _botThinking = false;
    });
    _dealAnim.forward(from: 0);
    _syncToFirestore();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        backgroundColor: const Color(0xFF060D1A),
        body: SafeArea(
            child: Stack(children: [
          CustomPaint(size: Size.infinite, painter: _GridPainter()),
          Column(children: [
            _buildTopBar(),
            _buildBotArea(),
            const SizedBox(height: 8),
            _buildPileAndDeck(),
            const SizedBox(height: 8),
            _buildStatusBar(),
            const SizedBox(height: 8),
            _buildPlayerArea(),
            const SizedBox(height: 12)
          ]),
          if (_gs.phase == GamePhase.whotCall) _buildWhotPicker(),
          if (_gs.phase == GamePhase.gameOver) _buildGameOverOverlay(),
          if (_botThinking)
            Positioned(
                top: 120,
                left: 0,
                right: 0,
                child: Center(
                    child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                            color: kBgCard.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: kBorder)),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: kCyan)),
                          const SizedBox(width: 8),
                          const Text('Bot thinking...',
                              style: TextStyle(color: kCyan, fontSize: 12))
                        ])))),
        ])));
  }

  Widget _buildTopBar() {
    return Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
        child: Row(children: [
          GestureDetector(
              onTap: () => _showQuitDialog(),
              child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                      color: kBgCard,
                      shape: BoxShape.circle,
                      border: Border.all(color: kBorder)),
                  child: const Icon(Icons.arrow_back_ios_new,
                      color: kTextPri, size: 15))),
          const SizedBox(width: 12),
          const Text('WHOT',
              style: TextStyle(
                  color: kTextPri,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 3)),
          const Spacer(),
          Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                  color: kBgCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: kBorder)),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.style, color: kTextSec, size: 13),
                const SizedBox(width: 4),
                Text('${_gs.deck.length}',
                    style: const TextStyle(
                        color: kTextPri,
                        fontWeight: FontWeight.w700,
                        fontSize: 12))
              ]))
        ]));
  }

  Widget _buildBotArea() {
    return Padding(
        padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
        child: Column(children: [
          Row(children: [
            Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: kBgCard,
                    border: Border.all(
                        color: !_gs.playerTurn && _gs.phase == GamePhase.playing
                            ? kOrange
                            : kBorder,
                        width: 2)),
                child: const Center(
                    child: Text('🤖', style: TextStyle(fontSize: 16)))),
            const SizedBox(width: 8),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('BOT',
                  style: TextStyle(
                      color: kTextPri,
                      fontWeight: FontWeight.w800,
                      fontSize: 13)),
              Text('${_gs.botHand.length} cards',
                  style: const TextStyle(color: kTextSec, fontSize: 11))
            ]),
            const Spacer(),
            if (!_gs.playerTurn && _gs.phase == GamePhase.playing)
              AnimatedBuilder(
                  animation: _pulseAnim,
                  builder: (_, __) => Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                          color: kOrange
                              .withOpacity(0.1 + _pulseAnim.value * 0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: kOrange.withOpacity(0.5))),
                      child: const Text("BOT'S TURN",
                          style: TextStyle(
                              color: kOrange,
                              fontSize: 10,
                              fontWeight: FontWeight.w800))))
          ]),
          const SizedBox(height: 10),
          SizedBox(
              height: 60,
              child: Stack(
                  children: List.generate(
                      min(_gs.botHand.length, 10),
                      (i) => Positioned(
                          left: i * 22.0,
                          child: WhotCardBack(
                              highlighted: _gs.botHand.length == 1))))),
          if (_gs.botHand.length == 1)
            Container(
                margin: const EdgeInsets.only(top: 6),
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                    color: Colors.redAccent.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border:
                        Border.all(color: Colors.redAccent.withOpacity(0.4))),
                child: const Text('⚠ BOT HAS 1 CARD LEFT!',
                    style: TextStyle(
                        color: Colors.redAccent,
                        fontSize: 10,
                        fontWeight: FontWeight.w800)))
        ]));
  }

  Widget _buildPileAndDeck() {
    final top = _gs.topCard;
    return Row(mainAxisAlignment: MainAxisAlignment.center, children: [
      GestureDetector(
          onTap: _gs.playerTurn ? _playerPickUp : null,
          child: Column(children: [
            Stack(children: [
              for (int i = 2; i >= 0; i--)
                Transform.translate(
                    offset: Offset(-i * 2.0, -i * 2.0),
                    child: const WhotCardBack())
            ]),
            const SizedBox(height: 4),
            Text(_gs.pickUpPending > 0 ? 'PICK ${_gs.pickUpPending}' : 'DRAW',
                style: TextStyle(
                    color: _gs.pickUpPending > 0 ? Colors.redAccent : kTextSec,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1))
          ])),
      const SizedBox(width: 32),
      Column(children: [
        WhotCardWidget(card: top, size: 90, calledShape: _gs.calledShape),
        const SizedBox(height: 4),
        Text('PILE',
            style: TextStyle(
                color: kTextSec,
                fontSize: 10,
                fontWeight: FontWeight.w800,
                letterSpacing: 1))
      ])
    ]);
  }

  Widget _buildStatusBar() {
    return Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
            color: kBgCard.withOpacity(0.8),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: kBorder)),
        child: Row(children: [
          Icon(_gs.playerTurn ? Icons.person : Icons.smart_toy,
              color: _gs.playerTurn ? kCyan : kOrange, size: 14),
          const SizedBox(width: 8),
          Expanded(
              child: Text(_gs.statusMessage ?? '',
                  style: TextStyle(
                      color: _gs.playerTurn ? kCyan : kOrange,
                      fontSize: 12,
                      fontWeight: FontWeight.w600))),
          if (_gs.calledShape != null)
            Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                    color: kCyan.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20)),
                child: Text('CALLED: ${_gs.calledShape!.name.toUpperCase()}',
                    style: const TextStyle(
                        color: kCyan,
                        fontSize: 9,
                        fontWeight: FontWeight.w800)))
        ]));
  }

  Widget _buildPlayerArea() {
    return Column(children: [
      Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(children: [
            Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: kBgCard,
                    border: Border.all(
                        color: _gs.playerTurn && _gs.phase == GamePhase.playing
                            ? kCyan
                            : kBorder,
                        width: 2)),
                child: const Center(
                    child: Text('😎', style: TextStyle(fontSize: 16)))),
            const SizedBox(width: 8),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('YOU',
                  style: TextStyle(
                      color: kTextPri,
                      fontWeight: FontWeight.w800,
                      fontSize: 13)),
              Text('${_gs.playerHand.length} cards',
                  style: const TextStyle(color: kTextSec, fontSize: 11))
            ]),
            const Spacer(),
            if (_gs.playerTurn && _gs.phase == GamePhase.playing)
              AnimatedBuilder(
                  animation: _pulseAnim,
                  builder: (_, __) => Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                          color:
                              kCyan.withOpacity(0.1 + _pulseAnim.value * 0.15),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: kCyan.withOpacity(0.5))),
                      child: const Text('YOUR TURN',
                          style: TextStyle(
                              color: kCyan,
                              fontSize: 10,
                              fontWeight: FontWeight.w800))))
          ])),
      const SizedBox(height: 10),
      SizedBox(
          height: 110,
          child: _gs.playerHand.isEmpty
              ? const Center(
                  child: Text('No cards!',
                      style: TextStyle(color: kTextSec, fontSize: 13)))
              : ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: _gs.playerHand.length,
                  itemBuilder: (_, i) {
                    final card = _gs.playerHand[i];
                    final canPlay = _gs.playerTurn &&
                        _gs.phase == GamePhase.playing &&
                        card.matches(_gs.topCard, calledShape: _gs.calledShape);
                    return GestureDetector(
                        onTap: _gs.playerTurn ? () => _playCard(i) : null,
                        child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            margin: const EdgeInsets.only(right: 8),
                            transform: Matrix4.translationValues(
                                0,
                                canPlay
                                    ? -12
                                    : (_selectedCardIdx == i ? -8 : 0),
                                0),
                            child: WhotCardWidget(
                                card: card,
                                size: 72,
                                playable: canPlay,
                                selected: _selectedCardIdx == i)));
                  })),
      if (_gs.playerHand.length == 1)
        Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
                decoration: BoxDecoration(
                    color: kGreen.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: kGreen.withOpacity(0.4))),
                child: const Text('🎯 LAST CARD — Play it to win!',
                    style: TextStyle(
                        color: kGreen,
                        fontSize: 11,
                        fontWeight: FontWeight.w800))))
    ]);
  }

  Widget _buildWhotPicker() {
    const shapes = [
      WhotShape.circle,
      WhotShape.triangle,
      WhotShape.cross,
      WhotShape.square,
      WhotShape.star
    ];
    return Container(
        color: Colors.black54,
        child: Center(
            child: Container(
                margin: const EdgeInsets.all(32),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                    color: kBgCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: kBorder)),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Text('WHOT! Choose a shape',
                      style: TextStyle(
                          color: kTextPri,
                          fontWeight: FontWeight.w800,
                          fontSize: 18)),
                  const SizedBox(height: 6),
                  const Text('Pick the shape your opponent must match',
                      style: TextStyle(color: kTextSec, fontSize: 12)),
                  const SizedBox(height: 20),
                  Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: shapes.map((s) {
                        const color =
                            Color(0xFF7B0000); // Maroon matching classic cards
                        return GestureDetector(
                            onTap: () => _callShape(s),
                            child: Container(
                                width: 72,
                                height: 72,
                                decoration: BoxDecoration(
                                    color: color.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                        color: color.withOpacity(0.5),
                                        width: 2)),
                                child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.category,
                                          color: color,
                                          size: 24), // Fallback icon for shape
                                      const SizedBox(height: 4),
                                      Text(s.name.toUpperCase(),
                                          style: TextStyle(
                                              color: color,
                                              fontSize: 9,
                                              fontWeight: FontWeight.w800))
                                    ])));
                      }).toList())
                ]))));
  }

  Widget _buildGameOverOverlay() {
    final won = _gs.winner == 'player';
    return Container(
        color: Colors.black87,
        child: Center(
            child: Container(
                margin: const EdgeInsets.all(32),
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                    color: kBgCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: won
                            ? kGreen.withOpacity(0.5)
                            : Colors.redAccent.withOpacity(0.5),
                        width: 2)),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Text(won ? '🎉' : '😞', style: const TextStyle(fontSize: 56)),
                  const SizedBox(height: 12),
                  Text(won ? 'YOU WIN!' : 'BOT WINS',
                      style: TextStyle(
                          color: won ? kGreen : Colors.redAccent,
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2)),
                  const SizedBox(height: 6),
                  Text(won ? '+50 points earned!' : 'Better luck next time!',
                      style: const TextStyle(color: kTextSec, fontSize: 14)),
                  const SizedBox(height: 24),
                  Row(children: [
                    Expanded(
                        child: OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: kBorder),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12))),
                            child: const Text('EXIT',
                                style: TextStyle(
                                    color: kTextSec,
                                    fontWeight: FontWeight.w700)))),
                    const SizedBox(width: 12),
                    Expanded(
                        child: ElevatedButton(
                            onPressed: _restartGame,
                            style: ElevatedButton.styleFrom(
                                backgroundColor: won ? kGreen : kOrange,
                                foregroundColor: kBgDeep,
                                padding:
                                    const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                elevation: 0),
                            child: const Text('PLAY AGAIN',
                                style: TextStyle(fontWeight: FontWeight.w800))))
                  ])
                ]))));
  }

  void _showQuitDialog() {
    showDialog(
        context: context,
        builder: (_) => AlertDialog(
                backgroundColor: kBgCard,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16)),
                title: const Text('Quit Game?',
                    style: TextStyle(
                        color: kTextPri, fontWeight: FontWeight.w700)),
                content: const Text('Your progress will be lost.',
                    style: TextStyle(color: kTextSec)),
                actions: [
                  TextButton(
                      onPressed: () => Navigator.pop(context),
                      child:
                          const Text('Stay', style: TextStyle(color: kCyan))),
                  TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                        Navigator.pop(context);
                      },
                      child: const Text('Quit',
                          style: TextStyle(color: Colors.redAccent)))
                ]));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GRID BACKGROUND PAINTER
// ─────────────────────────────────────────────────────────────────────────────

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF1A2744).withOpacity(0.3)
      ..strokeWidth = 0.5;
    const step = 32.0;
    for (double x = 0; x < size.width; x += step)
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    for (double y = 0; y < size.height; y += step)
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
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
    return Scaffold(
        backgroundColor: kBgDeep,
        appBar: AppBar(
            backgroundColor: kBgDeep,
            elevation: 0,
            leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios_new,
                    color: kTextPri, size: 18),
                onPressed: () => Navigator.pop(context)),
            title: const Text('WHOT Setup',
                style:
                    TextStyle(color: kTextPri, fontWeight: FontWeight.w800))),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          Text('STARTING CARDS', style: kLabel.copyWith(color: kCyan)),
          const SizedBox(height: 12),
          Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                  color: kBgCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: kBorder)),
              child: Column(children: [
                Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Cards per player',
                          style: TextStyle(
                              color: kTextPri, fontWeight: FontWeight.w600)),
                      Text('$_startingCards',
                          style: const TextStyle(
                              color: kCyan,
                              fontWeight: FontWeight.w800,
                              fontSize: 18))
                    ]),
                Slider(
                    value: _startingCards.toDouble(),
                    min: 3,
                    max: 10,
                    divisions: 7,
                    activeColor: kCyan,
                    inactiveColor: kBorder,
                    onChanged: (v) =>
                        setState(() => _startingCards = v.round())),
                Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('3', style: kLabel),
                      Text('10', style: kLabel)
                    ])
              ])),
          const SizedBox(height: 24),
          Text('SPECIAL CARDS', style: kLabel.copyWith(color: kCyan)),
          const SizedBox(height: 4),
          const Text('Remove special cards from the deck',
              style: TextStyle(color: kTextSec, fontSize: 12)),
          const SizedBox(height: 12),
          ..._specialCards.map((sc) {
            final n = sc['number'] as int;
            final removed = _removedSpecials.contains(n);
            return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                    color: kBgCard,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: removed ? kBorder : kCyan.withOpacity(0.2))),
                child: Row(children: [
                  Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                          color: removed
                              ? kBorder.withOpacity(0.5)
                              : kCyan.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8)),
                      child: Center(
                          child: Text('$n',
                              style: TextStyle(
                                  color: removed ? kTextMuted : kCyan,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14)))),
                  const SizedBox(width: 12),
                  Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        Text(sc['label'] as String,
                            style: TextStyle(
                                color: removed ? kTextMuted : kTextPri,
                                fontWeight: FontWeight.w600)),
                        Text(sc['desc'] as String,
                            style: TextStyle(
                                color: removed ? kTextMuted : kTextSec,
                                fontSize: 11))
                      ])),
                  Switch(
                      value: !removed,
                      activeColor: kCyan,
                      inactiveThumbColor: kTextMuted,
                      inactiveTrackColor: kBorder,
                      onChanged: (v) => setState(() {
                            if (v)
                              _removedSpecials.remove(n);
                            else
                              _removedSpecials.add(n);
                          }))
                ]));
          }),
          const SizedBox(height: 32),
          SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                  onPressed: () {
                    final gameId = FirebaseFirestore.instance
                        .collection('game_sessions')
                        .doc()
                        .id;
                    Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(
                            builder: (_) =>
                                WhotGameScreen(gameId: gameId, gameConfig: {
                                  'startingCards': _startingCards,
                                  'removedSpecials': _removedSpecials.toList(),
                                  'gameType': 'whot'
                                })));
                  },
                  style: ElevatedButton.styleFrom(
                      backgroundColor: kOrange,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      elevation: 0),
                  child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('START GAME',
                            style: TextStyle(
                                fontWeight: FontWeight.w800, fontSize: 16)),
                        SizedBox(width: 8),
                        Icon(Icons.play_arrow, size: 20)
                      ]))),
          const SizedBox(height: 32)
        ]));
  }
}
