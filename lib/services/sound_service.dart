import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';

enum SoundType {
  // UI
  buttonClick,
  navigation,
  notification,
  levelUp,

  // Card games (Whot)
  cardPlay,
  drawCard,
  whotCall,
  nominate,

  // Board games (Draughts / Ayo)
  pieceMove,
  capture,
  kinged,

  // Ludo
  diceRoll,
  pieceHome,

  // Shared
  gameWin,
  gameLose,
}

class SoundService {
  SoundService._();
  static final SoundService instance = SoundService._();

  bool _enabled = true;
  bool get enabled => _enabled;

  AudioPlayer? _bgPlayer;
  final Map<SoundType, AudioPlayer> _sfxPool = {};

  // ── Initialise (call once at app start) ────────────────────────────────

  Future<void> init() async {
    // Pre-create pooled players for the most-used SFX
    for (final type in SoundType.values) {
      _sfxPool[type] = AudioPlayer();
    }
    _bgPlayer = AudioPlayer();
  }

  // ── Toggle ─────────────────────────────────────────────────────────────

  void setEnabled(bool val) {
    _enabled = val;
    if (!val) stopBackground();
  }

  // ── SFX playback ───────────────────────────────────────────────────────

  Future<void> play(SoundType type) async {
    if (!_enabled) return;
    final player = _sfxPool[type];
    if (player == null) return;

    try {
      // Reset to start if already playing
      await player.stop();
      await player.setAsset(_assetFor(type));
      await player.play();
    } catch (e) {
      // Graceful: missing asset or unsupported format — just ignore
      if (kDebugMode) print('[SoundService] SFX error ($type): $e');
    }
  }

  // ── Background music ───────────────────────────────────────────────────

  Future<void> playBackground(String assetPath, {double volume = 0.3}) async {
    if (!_enabled || _bgPlayer == null) return;
    try {
      await _bgPlayer!.setAsset(assetPath);
      await _bgPlayer!.setLoopMode(LoopMode.one);
      await _bgPlayer!.setVolume(volume);
      await _bgPlayer!.play();
    } catch (e) {
      if (kDebugMode) print('[SoundService] BGM error: $e');
    }
  }

  Future<void> stopBackground() async {
    try { await _bgPlayer?.stop(); } catch (_) {}
  }

  Future<void> pauseBackground() async {
    try { await _bgPlayer?.pause(); } catch (_) {}
  }

  Future<void> resumeBackground() async {
    if (!_enabled) return;
    try { await _bgPlayer?.play(); } catch (_) {}
  }

  // ── Cleanup ────────────────────────────────────────────────────────────

  Future<void> dispose() async {
    await _bgPlayer?.dispose();
    for (final p in _sfxPool.values) {
      await p.dispose();
    }
    _sfxPool.clear();
  }

  // ── Asset mapping ──────────────────────────────────────────────────────
  //
  // All files live under  assets/audio/sfx/  and  assets/audio/bgm/
  // Replace the placeholder paths with real .mp3/.ogg files.
  //

  String _assetFor(SoundType type) {
    switch (type) {
      // UI
      case SoundType.buttonClick:
        return 'assets/audio/sfx/button_click.wav';
      case SoundType.navigation:
        return 'assets/audio/sfx/navigation.wav';
      case SoundType.notification:
        return 'assets/audio/sfx/notification.wav';
      case SoundType.levelUp:
        return 'assets/audio/sfx/level_up.wav';

      // Whot
      case SoundType.cardPlay:
        return 'assets/audio/sfx/card_play.wav';
      case SoundType.drawCard:
        return 'assets/audio/sfx/draw_card.wav';
      case SoundType.whotCall:
        return 'assets/audio/sfx/whot_call.wav';
      case SoundType.nominate:
        return 'assets/audio/sfx/nominate.wav';

      // Draughts / Ayo
      case SoundType.pieceMove:
        return 'assets/audio/sfx/piece_move.wav';
      case SoundType.capture:
        return 'assets/audio/sfx/capture.wav';
      case SoundType.kinged:
        return 'assets/audio/sfx/kinged.wav';

      // Ludo
      case SoundType.diceRoll:
        return 'assets/audio/sfx/dice_roll.wav';
      case SoundType.pieceHome:
        return 'assets/audio/sfx/piece_home.wav';

      // Shared
      case SoundType.gameWin:
        return 'assets/audio/sfx/game_win.wav';
      case SoundType.gameLose:
        return 'assets/audio/sfx/game_lose.wav';
    }
  }
}
