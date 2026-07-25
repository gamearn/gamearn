import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme.dart';

// ---------------------------------------------------------------------------
// LiveTournamentScreen
// Stack: Flutter + Socket.io (real-time bracket + match state)
//        Firestore for persistent bracket data
// Socket events consumed:
//   'bracket_update'  → rebuild bracket
//   'match_start'     → push to active game screen
//   'match_end'       → update scores
//   'tournament_end'  → show winner sheet
//   'chat_message'    → append to chat
// Color system: bg=#0B0E1A  cyan=#22D1EE  orange=#FF5E00
// ---------------------------------------------------------------------------

class LiveTournamentScreen extends StatefulWidget {
  final String tournamentId;
  final String tournamentTitle;

  const LiveTournamentScreen({
    super.key,
    required this.tournamentId,
    required this.tournamentTitle,
  });

  @override
  State<LiveTournamentScreen> createState() => _LiveTournamentScreenState();
}

class _LiveTournamentScreenState extends State<LiveTournamentScreen>
    with SingleTickerProviderStateMixin {
  static const _cyan = Color(0xFF22D1EE);
  static const _orange = Color(0xFFFF5E00);
  static const _border = Color(0xFF1E2438);

  late TabController _tabCtrl;
  final TextEditingController _chatCtrl = TextEditingController();
  final ScrollController _chatScroll = ScrollController();

  // Elapsed timer
  late Timer _timer;
  int _elapsedSeconds = 0;

  // Mock socket state — replace with socket_io_client
  final String _myStatus = 'waiting'; // waiting | playing | eliminated | champion
  final int _currentRound = 1;
  final int _totalRounds = 5;

  // Mock bracket (Round of 32 → QF → SF → F)
  final List<List<_MatchModel>> _bracket = _buildMockBracket();

  // Mock chat
  final List<_ChatMessage> _messages = [
    const _ChatMessage(author: 'Amaka', text: 'Good luck everyone! 🎮', time: '19:58'),
    const _ChatMessage(
        author: 'Emeka', text: 'Whot no be beans 😅', time: '19:59'),
    const _ChatMessage(
        author: 'Fatima', text: 'Greatman has been winning all week lol',
        time: '20:00'),
  ];

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _elapsedSeconds++);
    });

    // TODO: socket = io('https://your-digitalocean-host');
    // socket.emit('join_tournament', {'tournamentId': widget.tournamentId});
    // socket.on('bracket_update', (data) => setState(...));
    // socket.on('match_start', (data) => _onMatchStart(data));
    // socket.on('chat_message', (data) => setState(() => _messages.add(...)));
    // socket.on('tournament_end', (data) => _showWinnerSheet(data));
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _chatCtrl.dispose();
    _chatScroll.dispose();
    _timer.cancel();
    // TODO: socket.disconnect();
    super.dispose();
  }

  String get _elapsed {
    final h = _elapsedSeconds ~/ 3600;
    final m = (_elapsedSeconds % 3600) ~/ 60;
    final s = _elapsedSeconds % 60;
    if (h > 0) {
      return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
    }
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  void _sendMessage() {
    final text = _chatCtrl.text.trim();
    if (text.isEmpty) return;
    HapticFeedback.selectionClick();
    setState(() {
      _messages.add(_ChatMessage(
          author: 'You',
          text: text,
          time:
              '${TimeOfDay.now().hour.toString().padLeft(2, '0')}:${TimeOfDay.now().minute.toString().padLeft(2, '0')}',
          isMe: true));
    });
    _chatCtrl.clear();
    // TODO: socket.emit('chat_message', {'text': text, 'tournamentId': widget.tournamentId});
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_chatScroll.hasClients) {
        _chatScroll.animateTo(_chatScroll.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.bg,
      appBar: _buildAppBar(),
      body: Column(
        children: [
          // Status bar
          _MyStatusBar(
              status: _myStatus,
              round: _currentRound,
              totalRounds: _totalRounds),

          // Tab bar
          Container(
            color: context.bg,
            child: TabBar(
              controller: _tabCtrl,
              labelColor: _cyan,
              unselectedLabelColor: Colors.white38,
              indicatorColor: _cyan,
              indicatorSize: TabBarIndicatorSize.label,
              labelStyle: const TextStyle(
                  fontWeight: FontWeight.w700, fontSize: 13),
              tabs: const [
                Tab(text: 'Bracket'),
                Tab(text: 'Matches'),
                Tab(text: 'Chat'),
              ],
            ),
          ),

          // Tab content
          Expanded(
            child: TabBarView(
              controller: _tabCtrl,
              children: [
                _BracketTab(bracket: _bracket),
                _MatchesTab(bracket: _bracket),
                _ChatTab(
                  messages: _messages,
                  controller: _chatCtrl,
                  scrollController: _chatScroll,
                  onSend: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  AppBar _buildAppBar() {
    return AppBar(
      backgroundColor: context.bg,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded,
            color: Colors.white, size: 20),
        onPressed: () => _confirmLeave(),
      ),
      title: Column(
        children: [
          Text(widget.tournamentTitle,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w700)),
          Text('Round $_currentRound/$_totalRounds  ·  $_elapsed',
              style: const TextStyle(color: Colors.white38, fontSize: 11)),
        ],
      ),
      centerTitle: true,
      actions: [
        Container(
          margin: const EdgeInsets.only(right: 12),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.redAccent.withOpacity(0.15),
            borderRadius: BorderRadius.circular(6),
          ),
          child: const Row(
            children: [
              Icon(Icons.circle, color: Colors.redAccent, size: 8),
              SizedBox(width: 4),
              Text('LIVE',
                  style: TextStyle(
                      color: Colors.redAccent,
                      fontWeight: FontWeight.w800,
                      fontSize: 11)),
            ],
          ),
        ),
      ],
    );
  }

  void _confirmLeave() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: context.card,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Leave Tournament?',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        content: const Text(
          'Leaving during a live tournament may result in disqualification.',
          style: TextStyle(color: Colors.white70, fontSize: 13),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Stay',
                  style: TextStyle(color: Color(0xFF22D1EE)))),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text('Leave',
                style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Status bar
// ---------------------------------------------------------------------------

class _MyStatusBar extends StatelessWidget {
  final String status;
  final int round;
  final int totalRounds;

  static const _cyan = Color(0xFF22D1EE);
  static const _orange = Color(0xFFFF5E00);

  const _MyStatusBar({
    required this.status,
    required this.round,
    required this.totalRounds,
  });

  @override
  Widget build(BuildContext context) {
    final Color color = status == 'playing'
        ? _orange
        : status == 'champion'
            ? Colors.amber
            : status == 'eliminated'
                ? Colors.redAccent
                : _cyan;

    final String label = status == 'playing'
        ? '⚔️  Match in progress'
        : status == 'champion'
            ? '🏆  Champion!'
            : status == 'eliminated'
                ? '❌  Eliminated'
                : '⏳  Waiting for next match';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        border: Border(
            bottom: BorderSide(color: color.withOpacity(0.25))),
      ),
      child: Row(
        children: [
          Text(label,
              style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w600,
                  fontSize: 13)),
          const Spacer(),
          Text('R$round/$totalRounds',
              style: const TextStyle(
                  color: Colors.white38, fontSize: 12)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Bracket tab — horizontal scroll bracket view
// ---------------------------------------------------------------------------

class _BracketTab extends StatelessWidget {
  final List<List<_MatchModel>> bracket;
  const _BracketTab({required this.bracket});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: bracket.asMap().entries.map((entry) {
          final roundIndex = entry.key;
          final matches = entry.value;
          return Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Round ${roundIndex + 1}',
                    style: const TextStyle(
                        color: Colors.white38,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8)),
                const SizedBox(height: 8),
                ...matches.map((m) => _BracketMatchCard(match: m)),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _BracketMatchCard extends StatelessWidget {
  final _MatchModel match;
  static const _cyan = Color(0xFF22D1EE);
  static const _orange = Color(0xFFFF5E00);

  const _BracketMatchCard({required this.match});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: match.isLive
              ? _orange.withOpacity(0.6)
              : const Color(0xFF1E2438),
        ),
      ),
      child: Column(
        children: [
          _BracketPlayer(
              name: match.player1,
              score: match.score1,
              isWinner: match.winnerId == 1,
              isLive: match.isLive),
          const Divider(height: 1, color: Color(0xFF1E2438)),
          _BracketPlayer(
              name: match.player2,
              score: match.score2,
              isWinner: match.winnerId == 2,
              isLive: match.isLive),
          if (match.isLive)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 4),
              decoration: const BoxDecoration(
                color: Color(0x22FF5E00),
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(10)),
              ),
              child: const Text('LIVE',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: Color(0xFFFF5E00),
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1)),
            ),
        ],
      ),
    );
  }
}

class _BracketPlayer extends StatelessWidget {
  final String name;
  final int? score;
  final bool isWinner;
  final bool isLive;

  const _BracketPlayer({
    required this.name,
    this.score,
    required this.isWinner,
    required this.isLive,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      child: Row(
        children: [
          Expanded(
            child: Text(
              name.isEmpty ? 'TBD' : name,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: isWinner
                    ? const Color(0xFF22D1EE)
                    : name.isEmpty
                        ? Colors.white24
                        : Colors.white70,
                fontWeight:
                    isWinner ? FontWeight.w700 : FontWeight.w400,
                fontSize: 12,
              ),
            ),
          ),
          if (score != null)
            Text('$score',
                style: TextStyle(
                    color: isWinner
                        ? const Color(0xFF22D1EE)
                        : Colors.white38,
                    fontWeight: FontWeight.w700,
                    fontSize: 13)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Matches tab — list view of all matches with status
// ---------------------------------------------------------------------------

class _MatchesTab extends StatelessWidget {
  final List<List<_MatchModel>> bracket;
  const _MatchesTab({required this.bracket});

  @override
  Widget build(BuildContext context) {
    final allMatches = bracket.expand((r) => r).toList();
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: allMatches.length,
      itemBuilder: (ctx, i) => _MatchListTile(match: allMatches[i], index: i),
    );
  }
}

class _MatchListTile extends StatelessWidget {
  final _MatchModel match;
  final int index;

  const _MatchListTile({required this.match, required this.index});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: context.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: match.isLive
              ? const Color(0xFFFF5E00).withOpacity(0.5)
              : const Color(0xFF1E2438),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  match.player1.isEmpty ? 'TBD' : match.player1,
                  style: TextStyle(
                    color: match.winnerId == 1
                        ? const Color(0xFF22D1EE)
                        : Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 2),
                const Text('vs',
                    style: TextStyle(color: Colors.white24, fontSize: 10)),
                const SizedBox(height: 2),
                Text(
                  match.player2.isEmpty ? 'TBD' : match.player2,
                  style: TextStyle(
                    color: match.winnerId == 2
                        ? const Color(0xFF22D1EE)
                        : Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          if (match.score1 != null && match.score2 != null)
            Text('${match.score1} - ${match.score2}',
                style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 16)),
          const SizedBox(width: 12),
          _MatchStatusChip(isLive: match.isLive, isDone: match.isDone),
        ],
      ),
    );
  }
}

class _MatchStatusChip extends StatelessWidget {
  final bool isLive;
  final bool isDone;

  const _MatchStatusChip({required this.isLive, required this.isDone});

  @override
  Widget build(BuildContext context) {
    final Color color = isLive
        ? const Color(0xFFFF5E00)
        : isDone
            ? Colors.greenAccent
            : Colors.white24;
    final String label =
        isLive ? 'LIVE' : isDone ? 'DONE' : 'SOON';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Text(label,
          style: TextStyle(
              color: color,
              fontWeight: FontWeight.w800,
              fontSize: 10,
              letterSpacing: 0.5)),
    );
  }
}

// ---------------------------------------------------------------------------
// Chat tab
// ---------------------------------------------------------------------------

class _ChatTab extends StatelessWidget {
  final List<_ChatMessage> messages;
  final TextEditingController controller;
  final ScrollController scrollController;
  final VoidCallback onSend;

  const _ChatTab({
    required this.messages,
    required this.controller,
    required this.scrollController,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            controller: scrollController,
            padding: const EdgeInsets.all(16),
            itemCount: messages.length,
            itemBuilder: (ctx, i) =>
                _ChatBubble(message: messages[i]),
          ),
        ),
        _ChatInput(controller: controller, onSend: onSend),
      ],
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final _ChatMessage message;
  const _ChatBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment:
          message.isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.72),
        decoration: BoxDecoration(
          color: message.isMe
              ? const Color(0xFF22D1EE).withOpacity(0.15)
              : context.card,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(12),
            topRight: const Radius.circular(12),
            bottomLeft: message.isMe
                ? const Radius.circular(12)
                : const Radius.circular(2),
            bottomRight: message.isMe
                ? const Radius.circular(2)
                : const Radius.circular(12),
          ),
          border: Border.all(
            color: message.isMe
                ? const Color(0xFF22D1EE).withOpacity(0.3)
                : const Color(0xFF1E2438),
          ),
        ),
        child: Column(
          crossAxisAlignment: message.isMe
              ? CrossAxisAlignment.end
              : CrossAxisAlignment.start,
          children: [
            if (!message.isMe)
              Text(message.author,
                  style: const TextStyle(
                      color: Color(0xFF22D1EE),
                      fontSize: 11,
                      fontWeight: FontWeight.w700)),
            Text(message.text,
                style: const TextStyle(color: Colors.white, fontSize: 13)),
            Text(message.time,
                style: const TextStyle(color: Colors.white38, fontSize: 10)),
          ],
        ),
      ),
    );
  }
}

class _ChatInput extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSend;

  const _ChatInput({required this.controller, required this.onSend});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          12, 8, 12, MediaQuery.of(context).padding.bottom + 8),
      decoration: const BoxDecoration(
        color: Color(0xFF0F1220),
        border: Border(top: BorderSide(color: Color(0xFF1E2438))),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              style: const TextStyle(color: Colors.white, fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Say something...',
                hintStyle: const TextStyle(color: Colors.white38),
                filled: true,
                fillColor: context.card,
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: const BorderSide(color: Color(0xFF1E2438)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: const BorderSide(color: Color(0xFF1E2438)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(20),
                  borderSide: const BorderSide(color: Color(0xFF22D1EE)),
                ),
              ),
              onSubmitted: (_) => onSend(),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: onSend,
            child: Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: Color(0xFF22D1EE),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.send_rounded,
                  color: Colors.black, size: 18),
            ),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Data models
// ---------------------------------------------------------------------------

class _MatchModel {
  final String player1;
  final String player2;
  final int? score1;
  final int? score2;
  final int? winnerId; // 1 or 2
  final bool isLive;
  final bool isDone;

  const _MatchModel({
    required this.player1,
    required this.player2,
    this.score1,
    this.score2,
    this.winnerId,
    this.isLive = false,
    this.isDone = false,
  });
}

class _ChatMessage {
  final String author;
  final String text;
  final String time;
  final bool isMe;

  const _ChatMessage({
    required this.author,
    required this.text,
    required this.time,
    this.isMe = false,
  });
}

// ---------------------------------------------------------------------------
// Mock bracket data
// ---------------------------------------------------------------------------

List<List<_MatchModel>> _buildMockBracket() {
  return [
    // Round 1 (sample first 4 of 16)
    [
      const _MatchModel(
          player1: 'Greatman',
          player2: 'Emeka',
          score1: 3,
          score2: 1,
          winnerId: 1,
          isDone: true),
      const _MatchModel(
          player1: 'Amaka',
          player2: 'Tunde',
          score1: 2,
          score2: 3,
          winnerId: 2,
          isDone: true),
      const _MatchModel(
          player1: 'Fatima',
          player2: 'Ngozi',
          isLive: true,
          score1: 1,
          score2: 1),
      const _MatchModel(player1: 'Babatunde', player2: 'Kelechi'),
    ],
    // Quarter Finals
    [
      const _MatchModel(
          player1: 'Greatman', player2: 'Tunde', isLive: true),
      const _MatchModel(player1: '', player2: ''),
    ],
    // Semi Finals
    [
      const _MatchModel(player1: '', player2: ''),
    ],
    // Final
    [
      const _MatchModel(player1: '', player2: ''),
    ],
  ];
}
