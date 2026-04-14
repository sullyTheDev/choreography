type NotoEmojiOption = {
    icon: string;
    emoji: string;
    label: string;
};

export const NOTO_EMOJI_OPTIONS: NotoEmojiOption[] = [
    { icon: 'noto:bust-in-silhouette', emoji: '👤', label: 'Person' },
    { icon: 'noto:boy', emoji: '👦', label: 'Boy' },
    { icon: 'noto:girl', emoji: '👧', label: 'Girl' },
    { icon: 'noto:smiling-face', emoji: '😊', label: 'Smiling face' },
    { icon: 'noto:grinning-face', emoji: '😀', label: 'Grinning face' },
    { icon: 'noto:smiling-face-with-sunglasses', emoji: '😎', label: 'Cool face' },
    { icon: 'noto:thinking-face', emoji: '🤔', label: 'Thinking face' },
    { icon: 'noto:star-struck', emoji: '🤩', label: 'Star struck' },
    { icon: 'noto:party-popper', emoji: '🎉', label: 'Party popper' },
    { icon: 'noto:sparkles', emoji: '✨', label: 'Sparkles' },
    { icon: 'noto:red-heart', emoji: '❤️', label: 'Red heart' },
    { icon: 'noto:rainbow', emoji: '🌈', label: 'Rainbow' },
    { icon: 'noto:rocket', emoji: '🚀', label: 'Rocket' },
    { icon: 'noto:dog-face', emoji: '🐶', label: 'Dog face' },
    { icon: 'noto:cat-face', emoji: '🐱', label: 'Cat face' },
    { icon: 'noto:unicorn', emoji: '🦄', label: 'Unicorn' },
    { icon: 'noto:panda', emoji: '🐼', label: 'Panda' },
    { icon: 'noto:green-apple', emoji: '🍏', label: 'Green apple' },
    { icon: 'noto:pizza', emoji: '🍕', label: 'Pizza' },
    { icon: 'noto:cookie', emoji: '🍪', label: 'Cookie' },
    { icon: 'noto:ice-cream', emoji: '🍨', label: 'Ice cream' },
    { icon: 'noto:birthday-cake', emoji: '🎂', label: 'Birthday cake' },
    { icon: 'noto:wrapped-gift', emoji: '🎁', label: 'Gift' },
    { icon: 'noto:trophy', emoji: '🏆', label: 'Trophy' },
    { icon: 'noto:sports-medal', emoji: '🏅', label: 'Sports medal' },
    { icon: 'noto:coin', emoji: '🪙', label: 'Coin' },
    { icon: 'noto:money-bag', emoji: '💰', label: 'Money bag' },
    { icon: 'noto:soccer-ball', emoji: '⚽', label: 'Soccer ball' },
    { icon: 'noto:basketball', emoji: '🏀', label: 'Basketball' },
    { icon: 'noto:video-game', emoji: '🎮', label: 'Video game' },
    { icon: 'noto:musical-note', emoji: '🎵', label: 'Music note' },
    { icon: 'noto:artist-palette', emoji: '🎨', label: 'Artist palette' },
    { icon: 'noto:books', emoji: '📚', label: 'Books' },
    { icon: 'noto:open-book', emoji: '📖', label: 'Open book' },
    { icon: 'noto:pencil', emoji: '✏️', label: 'Pencil' },
    { icon: 'noto:backpack', emoji: '🎒', label: 'Backpack' },
    { icon: 'noto:house', emoji: '🏠', label: 'House' },
    { icon: 'noto:broom', emoji: '🧹', label: 'Broom' },
    { icon: 'noto:wastebasket', emoji: '🗑️', label: 'Wastebasket' },
    { icon: 'noto:basket', emoji: '🧺', label: 'Basket' },
    { icon: 'noto:fork-and-knife-with-plate', emoji: '🍽️', label: 'Fork and knife' },
    { icon: 'noto:soap', emoji: '🧼', label: 'Soap' },
    { icon: 'noto:sponge', emoji: '🧽', label: 'Sponge' },
    { icon: 'noto:shower', emoji: '🚿', label: 'Shower' },
    { icon: 'noto:bed', emoji: '🛏️', label: 'Bed' },
    { icon: 'noto:alarm-clock', emoji: '⏰', label: 'Alarm clock' },
    { icon: 'noto:potted-plant', emoji: '🪴', label: 'Potted plant' },
    { icon: 'noto:herb', emoji: '🌿', label: 'Herb' }
];

export const AVATAR_EMOJI_OPTIONS = NOTO_EMOJI_OPTIONS.map((option) => ({
    value: option.emoji,
    label: `${option.emoji} ${option.label}`
}));

export const CHORE_ICON_OPTIONS = NOTO_EMOJI_OPTIONS.map((option) => ({
    icon: option.icon,
    label: `${option.emoji} ${option.label}`
}));

export const PRIZE_ICON_OPTIONS = NOTO_EMOJI_OPTIONS.map((option) => ({
    icon: option.icon,
    label: `${option.emoji} ${option.label}`
}));

const LEGACY_EMOJI_TO_NOTO: Record<string, string> = {
    '👤': 'noto:bust-in-silhouette',
    '👦': 'noto:boy',
    '👧': 'noto:girl',
    '😊': 'noto:smiling-face',
    '😀': 'noto:grinning-face',
    '😎': 'noto:smiling-face-with-sunglasses',
    '🤔': 'noto:thinking-face',
    '🤩': 'noto:star-struck',
    '🎉': 'noto:party-popper',
    '✨': 'noto:sparkles',
    '❤️': 'noto:red-heart',
    '🌈': 'noto:rainbow',
    '🚀': 'noto:rocket',
    '🐱': 'noto:cat-face',
    '🦄': 'noto:unicorn',
    '🐼': 'noto:panda',
    '🍏': 'noto:green-apple',
    '🍕': 'noto:pizza',
    '🍪': 'noto:cookie',
    '🍨': 'noto:ice-cream',
    '🎂': 'noto:birthday-cake',
    '🎁': 'noto:wrapped-gift',
    '🏆': 'noto:trophy',
    '🏅': 'noto:sports-medal',
    '🪙': 'noto:coin',
    '💰': 'noto:money-bag',
    '⚽': 'noto:soccer-ball',
    '🏀': 'noto:basketball',
    '🎮': 'noto:video-game',
    '🎵': 'noto:musical-note',
    '🎨': 'noto:artist-palette',
    '✏️': 'noto:pencil',
    '🎒': 'noto:backpack',
    '🏠': 'noto:house',
    '⏰': 'noto:alarm-clock',
    '🪴': 'noto:potted-plant',
    '🧹': 'noto:broom',
    '🛏': 'noto:bed',
    '🛏️': 'noto:bed',
    '🗑': 'noto:wastebasket',
    '🗑️': 'noto:wastebasket',
    '📚': 'noto:books',
    '🧺': 'noto:basket',
    '🐶': 'noto:dog-face',
    '🍽': 'noto:fork-and-knife-with-plate',
    '🍽️': 'noto:fork-and-knife-with-plate',
    '🧼': 'noto:soap',
    '🚿': 'noto:shower',
    '🧽': 'noto:sponge',
    '🌿': 'noto:herb',
    '📖': 'noto:open-book',
};

export function resolveIconifyName(value: string, fallback = 'noto:broom'): string {
    const normalized = value.trim();
    if (!normalized) return fallback;
    if (normalized.includes(':')) return normalized;
    return LEGACY_EMOJI_TO_NOTO[normalized] ?? fallback;
}
