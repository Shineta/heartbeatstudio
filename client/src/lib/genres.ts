export const allGenres = [
  { id: "pop", label: "Pop" },
  { id: "dance", label: "Dance / EDM" },
  { id: "hip-hop", label: "Hip Hop" },
  { id: "rap", label: "Rap" },
  { id: "rock", label: "Rock" },
  { id: "soul", label: "Soul" },
  { id: "r&b", label: "R&B" },
  { id: "country", label: "Country" },
  { id: "jazz", label: "Jazz" },
  { id: "electronic", label: "Electronic" },
  { id: "acoustic", label: "Acoustic" },
  { id: "classical", label: "Classical" },
  { id: "gospel", label: "Gospel" },
  { id: "contemporary-christian", label: "Contemporary Christian" },
  { id: "hymn", label: "Hymn / Traditional" },
  { id: "choir", label: "Choir" },
  { id: "inspirational", label: "Inspirational" },
  { id: "kids", label: "Kids / Children's" },
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

export const gospelGenres = allGenres.filter(g => 
  ["gospel", "soul", "contemporary-christian", "hymn", "rap", "r&b", "acoustic", "choir", "inspirational"].includes(g.id)
);
