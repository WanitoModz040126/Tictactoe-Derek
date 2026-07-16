Derek Snake Game — /assets folder
==================================

Ilagay dito ang 6 na video file, pinangalanan ng:

  1.mp4
  2.mp4
  3.mp4
  4.mp4
  5.mp4
  6.mp4

Kapag pinindot ng user ang "Try Again" button pagkatapos ma-lose,
random isa sa 6 na video ang ipe-play bilang overlay sa loob mismo
ng game board (may Back button para makabalik sa laro).

Notes:
- Hindi kasama dito ang aktwal na video files — dagdagan mo na lang
  ang 6 na .mp4 file dito bago mag-deploy sa Railway.
- Panatilihing katamtaman ang file size ng bawat video (ideally
  under ~15-20MB bawat isa) para mabilis mag-load sa Railway.
- Ang mga video ay served lang bilang static files sa /assets/*.mp4
  at may rate limiting na, kaya walang hard dependency sa external
  video hosting.
