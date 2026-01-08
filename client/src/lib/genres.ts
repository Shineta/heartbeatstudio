export const allGenres = [
  { id: "pop", label: "Pop" },
  { id: "dance", label: "Dance / EDM" },
  { id: "hip-hop", label: "Hip Hop" },
  { id: "rap", label: "Rap", hasSubGenres: true },
  { id: "rock", label: "Rock" },
  { id: "soul", label: "Soul" },
  { id: "r&b", label: "R&B" },
  { id: "country", label: "Country" },
  { id: "jazz", label: "Jazz" },
  { id: "electronic", label: "Electronic" },
  { id: "acoustic", label: "Acoustic" },
  { id: "classical", label: "Classical" },
  { id: "gospel", label: "Gospel" },
  { id: "black-gospel", label: "Black Gospel (Clark Sisters style)" },
  { id: "contemporary-christian", label: "Contemporary Christian" },
  { id: "hymn", label: "Hymn / Traditional" },
  { id: "choir", label: "Choir" },
  { id: "inspirational", label: "Inspirational" },
  { id: "kids", label: "Kids / Children's" },
  { id: "neo-soul", label: "Neo-Soul" },
  { id: "motown", label: "Motown" },
  { id: "afrobeat", label: "Afrobeat" },
  { id: "blues", label: "Blues" },
  { id: "funk", label: "Funk" },
  { id: "reggae", label: "Reggae" },
];

export const rapSubGenres = [
  { id: "trap", label: "Trap" },
  { id: "boom-bap", label: "Boom Bap" },
  { id: "conscious-rap", label: "Conscious Rap" },
  { id: "gangsta-rap", label: "Gangsta Rap" },
  { id: "melodic-rap", label: "Melodic Rap" },
  { id: "old-school-rap", label: "Old School" },
  { id: "southern-rap", label: "Southern Rap" },
  { id: "east-coast-rap", label: "East Coast" },
  { id: "west-coast-rap", label: "West Coast" },
  { id: "drill", label: "Drill" },
];

export const jazzSubGenres = [
  { id: "smooth-jazz", label: "Smooth Jazz" },
  { id: "bebop", label: "Bebop" },
  { id: "swing", label: "Swing" },
  { id: "cool-jazz", label: "Cool Jazz" },
  { id: "latin-jazz", label: "Latin Jazz" },
  { id: "fusion", label: "Jazz Fusion" },
  { id: "vocal-jazz", label: "Vocal Jazz" },
  { id: "contemporary-jazz", label: "Contemporary Jazz" },
  { id: "acid-jazz", label: "Acid Jazz" },
  { id: "nu-jazz", label: "Nu Jazz" },
];

export const classroomGenres = allGenres.filter(g => 
  ["kids", "pop", "hip-hop", "rap", "rock", "country", "electronic", "r&b", "jazz", "gospel"].includes(g.id)
);

export const birthdayGenres = allGenres.filter(g => 
  ["pop", "dance", "hip-hop", "rap", "rock", "soul", "country", "r&b", "jazz", "gospel"].includes(g.id)
);

export const dateNightGenres = allGenres.filter(g => 
  ["soul", "r&b", "pop", "rap", "jazz", "acoustic", "country", "electronic", "classical", "gospel"].includes(g.id)
);

export const gospelGenres = [
  { id: "r&b", label: "R&B" },
  { id: "gospel", label: "Gospel" },
  { id: "black-gospel", label: "Black Gospel (Clark Sisters style)" },
  { id: "neo-soul", label: "Neo-Soul" },
  { id: "soul", label: "Soul" },
  { id: "motown", label: "Motown" },
  { id: "rap", label: "Rap" },
  { id: "hip-hop", label: "Hip Hop" },
  { id: "afrobeat", label: "Afrobeat" },
  { id: "jazz", label: "Jazz" },
  { id: "blues", label: "Blues" },
  { id: "funk", label: "Funk" },
  { id: "reggae", label: "Reggae" },
];
