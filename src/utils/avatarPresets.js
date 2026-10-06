import { Image } from 'react-native';

/**
 * Preset Esports Gamer Mascot Avatars matching dark hooded gamer vector style.
 */
export const AVATAR_PRESETS = [
  {
    id: 'red_reaper',
    label: 'RED REAPER',
    source: require('../../assets/avatars/gamer_red.jpg'),
    uri: Image.resolveAssetSource(require('../../assets/avatars/gamer_red.jpg')).uri,
  },
  {
    id: 'cyan_phantom',
    label: 'CYAN PHANTOM',
    source: require('../../assets/avatars/gamer_cyan.jpg'),
    uri: Image.resolveAssetSource(require('../../assets/avatars/gamer_cyan.jpg')).uri,
  },
  {
    id: 'purple_shadow',
    label: 'PURPLE SHADOW',
    source: require('../../assets/avatars/gamer_purple.jpg'),
    uri: Image.resolveAssetSource(require('../../assets/avatars/gamer_purple.jpg')).uri,
  },
  {
    id: 'gold_titan',
    label: 'GOLD TITAN',
    source: require('../../assets/avatars/gamer_gold.jpg'),
    uri: Image.resolveAssetSource(require('../../assets/avatars/gamer_gold.jpg')).uri,
  },
  {
    id: 'green_ninja',
    label: 'GREEN NINJA',
    source: require('../../assets/avatars/gamer_green.jpg'),
    uri: Image.resolveAssetSource(require('../../assets/avatars/gamer_green.jpg')).uri,
  },

];

export function resolveAvatarSource(avatar) {
  if (!avatar) return require('../../assets/avatars/gamer_red.jpg');
  if (typeof avatar === 'number') return avatar;
  if (typeof avatar === 'object' && avatar.uri) return avatar;
  if (typeof avatar === 'string') {
    const preset = AVATAR_PRESETS.find((p) => p.id === avatar || p.uri === avatar);
    if (preset) return preset.source;
    if (avatar.startsWith('http') || avatar.startsWith('file') || avatar.startsWith('data')) {
      return { uri: avatar };
    }
  }
  return require('../../assets/avatars/gamer_red.jpg');
}
