// Nunito family names (used by the Brain Gym workout wheel). Prefer these over
// fontWeight so text renders consistently. Falls back to the system font if the
// Nunito family isn't loaded — safe either way.
export const FONT = {
  regular:   'Nunito_400Regular',
  semibold:  'Nunito_600SemiBold',
  bold:      'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black:     'Nunito_900Black',
};

const FONTS = {
  sizes: {
    xs:   11,
    sm:   12,
    base: 14,
    md:   16,
    lg:   18,
    xl:   22,
    xxl:  28,
  },
  weights: {
    normal:   '400',
    medium:   '500',
    semiBold: '600',
    bold:     '700',
    extraBold:'800',
  },
};

export default FONTS;