// Auto-generated strongly typed sprite kit definitions for Wordtopia

export type AvatarId = 
  | "black_cat"
  | "red_panda"
  | "capybara"
  | "turtle"
  | "axolotl"
  | "frog"
  | "dinosaur"
  | "cow";

export type WardrobeStyle = "neutral" | "girl" | "boy";

export type SpriteLayer = 
  | "BACK"
  | "TAIL"
  | "BASE"
  | "TEXTURE"
  | "BODY"
  | "NECK"
  | "HAND"
  | "FACE"
  | "HEAD";

export const LAYER_ORDER: SpriteLayer[] = [
  "BACK",
  "TAIL",
  "BASE",
  "TEXTURE",
  "BODY",
  "NECK",
  "HAND",
  "FACE",
  "HEAD"
];

export interface AvatarMeta {
  id: AvatarId;
  name: string;
  emoji: string;
  description: string;
  personality: string;
}

export interface SpriteItem {
  id: string;
  name: string;
  layer: SpriteLayer;
  row: number;
  categoryName: string;
  style: WardrobeStyle;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  price: number;
  isBodyAdaptive: boolean;
}

export interface OutfitCombo {
  id: string;
  name: string;
  items: string[];
  style: "girl" | "boy";
  price: number;
}

export const AVATARS: AvatarMeta[] = [
  {
    "id": "black_cat",
    "name": "Black Cat",
    "emoji": "🐱",
    "description": "Mysterious, agile, and curious night wanderer.",
    "personality": "Curious & Playful"
  },
  {
    "id": "red_panda",
    "name": "Red Panda",
    "emoji": "🐾",
    "description": "Fluffy adventurer who loves bamboo treats and puzzles.",
    "personality": "Energetic & Inquisitive"
  },
  {
    "id": "capybara",
    "name": "Capybara",
    "emoji": "🌿",
    "description": "Ultra-chill master of vocabulary who stays calm under pressure.",
    "personality": "Gentle & Friendly"
  },
  {
    "id": "turtle",
    "name": "Turtle",
    "emoji": "🐢",
    "description": "Wise, steady scholar who proves that steady learning wins the race.",
    "personality": "Patient & Wise"
  },
  {
    "id": "axolotl",
    "name": "Axolotl",
    "emoji": "🫧",
    "description": "Cheerful aquatic friend with sparkling gills and boundless optimism.",
    "personality": "Bubbly & Cheerful"
  },
  {
    "id": "frog",
    "name": "Frog",
    "emoji": "🐸",
    "description": "High-hopping word detective with lightning-fast recall.",
    "personality": "Quick-witted & Eager"
  },
  {
    "id": "dinosaur",
    "name": "Dinosaur",
    "emoji": "🦖",
    "description": "Prehistoric vocab champion with a giant appetite for learning.",
    "personality": "Bold & Adventurous"
  },
  {
    "id": "cow",
    "name": "Cow",
    "emoji": "🐮",
    "description": "Sweet meadow companion with a warm heart and wholesome spirit.",
    "personality": "Caring & Hardworking"
  }
];

export const SPRITE_ITEMS: Record<string, SpriteItem> = {
  "bubble_aura": {
    "id": "bubble_aura",
    "name": "Bubble Aura",
    "layer": "TEXTURE",
    "row": 1,
    "categoryName": "Base Black Cat + Textures",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": true
  },
  "crystal_skin": {
    "id": "crystal_skin",
    "name": "Crystal Skin",
    "layer": "TEXTURE",
    "row": 1,
    "categoryName": "Base Black Cat + Textures",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": true
  },
  "stone_skin": {
    "id": "stone_skin",
    "name": "Stone Golem Skin",
    "layer": "TEXTURE",
    "row": 1,
    "categoryName": "Base Black Cat + Textures",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": true
  },
  "pink_bow": {
    "id": "pink_bow",
    "name": "Pink Bow",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "girl",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "rainbow_bow": {
    "id": "rainbow_bow",
    "name": "Rainbow Bow",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "girl",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "sparkly_barrette": {
    "id": "sparkly_barrette",
    "name": "Sparkly Barrettes",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "girl",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "flower_crown": {
    "id": "flower_crown",
    "name": "Flower Crown",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "girl",
    "rarity": "Legendary",
    "price": 250,
    "isBodyAdaptive": false
  },
  "princess_tiara": {
    "id": "princess_tiara",
    "name": "Princess Tiara",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "girl",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "unicorn_horn": {
    "id": "unicorn_horn",
    "name": "Unicorn Horn",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "girl",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "crystal_horns": {
    "id": "crystal_horns",
    "name": "Crystal Horns",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "neutral",
    "rarity": "Legendary",
    "price": 250,
    "isBodyAdaptive": false
  },
  "bubble_horns": {
    "id": "bubble_horns",
    "name": "Bubble Horns",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "neutral",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "gargoyle_horns": {
    "id": "gargoyle_horns",
    "name": "Gargoyle Horns",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "neutral",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "mossy_leaf_crown": {
    "id": "mossy_leaf_crown",
    "name": "Mossy Leaf Crown",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "girl",
    "rarity": "Legendary",
    "price": 250,
    "isBodyAdaptive": false
  },
  "beanie": {
    "id": "beanie",
    "name": "Cozy Beanie",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "neutral",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "sun_hat": {
    "id": "sun_hat",
    "name": "Sun Hat",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "girl",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "beret": {
    "id": "beret",
    "name": "Artist Beret",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "girl",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "round_glasses": {
    "id": "round_glasses",
    "name": "Round Glasses",
    "layer": "FACE",
    "row": 3,
    "categoryName": "Face & Neck Accessories",
    "style": "neutral",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "heart_glasses": {
    "id": "heart_glasses",
    "name": "Heart Glasses",
    "layer": "FACE",
    "row": 3,
    "categoryName": "Face & Neck Accessories",
    "style": "girl",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "star_glasses": {
    "id": "star_glasses",
    "name": "Star Glasses",
    "layer": "FACE",
    "row": 3,
    "categoryName": "Face & Neck Accessories",
    "style": "neutral",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "cute_collar": {
    "id": "cute_collar",
    "name": "Bell Collar",
    "layer": "NECK",
    "row": 3,
    "categoryName": "Face & Neck Accessories",
    "style": "neutral",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "bow_tie": {
    "id": "bow_tie",
    "name": "Bow Tie",
    "layer": "NECK",
    "row": 3,
    "categoryName": "Face & Neck Accessories",
    "style": "neutral",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "friendship_necklace": {
    "id": "friendship_necklace",
    "name": "Friendship Necklace",
    "layer": "NECK",
    "row": 3,
    "categoryName": "Face & Neck Accessories",
    "style": "girl",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "rainbow_scarf": {
    "id": "rainbow_scarf",
    "name": "Rainbow Scarf",
    "layer": "NECK",
    "row": 3,
    "categoryName": "Face & Neck Accessories",
    "style": "neutral",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "fluffy_winter_scarf": {
    "id": "fluffy_winter_scarf",
    "name": "Fluffy Winter Scarf",
    "layer": "NECK",
    "row": 3,
    "categoryName": "Face & Neck Accessories",
    "style": "neutral",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "rainbow_tshirt": {
    "id": "rainbow_tshirt",
    "name": "Rainbow T-Shirt",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "neutral",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "heart_sweater": {
    "id": "heart_sweater",
    "name": "Heart Sweater",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "girl",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "star_hoodie": {
    "id": "star_hoodie",
    "name": "Star Hoodie",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "neutral",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "princess_dress": {
    "id": "princess_dress",
    "name": "Princess Dress",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "girl",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "fairy_dress": {
    "id": "fairy_dress",
    "name": "Fairy Dress",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "girl",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "sparkly_skirt": {
    "id": "sparkly_skirt",
    "name": "Sparkly Skirt",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "girl",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "raincoat": {
    "id": "raincoat",
    "name": "Yellow Raincoat",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "neutral",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "puffer_jacket": {
    "id": "puffer_jacket",
    "name": "Puffer Jacket",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "neutral",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "winter_sweater": {
    "id": "winter_sweater",
    "name": "Winter Sweater",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "neutral",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "crystal_dress": {
    "id": "crystal_dress",
    "name": "Crystal Dress",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "girl",
    "rarity": "Legendary",
    "price": 250,
    "isBodyAdaptive": false
  },
  "fairy_wings": {
    "id": "fairy_wings",
    "name": "Fairy Wings",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "girl",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "butterfly_wings": {
    "id": "butterfly_wings",
    "name": "Butterfly Wings",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "girl",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "angel_wings": {
    "id": "angel_wings",
    "name": "Angel Wings",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "crystal_wings": {
    "id": "crystal_wings",
    "name": "Crystal Wings",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "floating_stones": {
    "id": "floating_stones",
    "name": "Floating Stones",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "bubble_wings": {
    "id": "bubble_wings",
    "name": "Bubble Wings",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "stone_gargoyle_wings": {
    "id": "stone_gargoyle_wings",
    "name": "Gargoyle Wings",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "bunny_backpack": {
    "id": "bunny_backpack",
    "name": "Bunny Backpack",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "girl",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "star_backpack": {
    "id": "star_backpack",
    "name": "Star Backpack",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "magical_cape": {
    "id": "magical_cape",
    "name": "Magical Cape",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "girl",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "mossy_cape": {
    "id": "mossy_cape",
    "name": "Mossy Cape",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "bubble_wand": {
    "id": "bubble_wand",
    "name": "Bubble Wand",
    "layer": "HAND",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "rainbow_tail": {
    "id": "rainbow_tail",
    "name": "Fluffy Rainbow Tail",
    "layer": "TAIL",
    "row": 6,
    "categoryName": "Tails",
    "style": "girl",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "mermaid_tail": {
    "id": "mermaid_tail",
    "name": "Mermaid Fin Tail",
    "layer": "TAIL",
    "row": 6,
    "categoryName": "Tails",
    "style": "girl",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "demon_tail": {
    "id": "demon_tail",
    "name": "Cute Demon Tail",
    "layer": "TAIL",
    "row": 6,
    "categoryName": "Tails",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "crystal_tail": {
    "id": "crystal_tail",
    "name": "Crystal-Studded Tail",
    "layer": "TAIL",
    "row": 6,
    "categoryName": "Tails",
    "style": "neutral",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": true
  },
  "witch_hat": {
    "id": "witch_hat",
    "name": "Witch Hat",
    "layer": "HEAD",
    "row": 7,
    "categoryName": "Halloween & Fall Items",
    "style": "girl",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "bat_wings": {
    "id": "bat_wings",
    "name": "Bat Wings",
    "layer": "BACK",
    "row": 7,
    "categoryName": "Halloween & Fall Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "pumpkin_sweater": {
    "id": "pumpkin_sweater",
    "name": "Pumpkin Sweater",
    "layer": "BODY",
    "row": 7,
    "categoryName": "Halloween & Fall Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "vampire_cape": {
    "id": "vampire_cape",
    "name": "Vampire Cape",
    "layer": "BACK",
    "row": 7,
    "categoryName": "Halloween & Fall Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "candy_corn_collar": {
    "id": "candy_corn_collar",
    "name": "Candy Corn Collar",
    "layer": "NECK",
    "row": 7,
    "categoryName": "Halloween & Fall Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "leaf_crown": {
    "id": "leaf_crown",
    "name": "Autumn Leaf Crown",
    "layer": "HEAD",
    "row": 7,
    "categoryName": "Halloween & Fall Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "flannel_shirt": {
    "id": "flannel_shirt",
    "name": "Cozy Flannel Shirt",
    "layer": "BODY",
    "row": 7,
    "categoryName": "Halloween & Fall Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "acorn_necklace": {
    "id": "acorn_necklace",
    "name": "Acorn Necklace",
    "layer": "NECK",
    "row": 7,
    "categoryName": "Halloween & Fall Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "fall_scarf": {
    "id": "fall_scarf",
    "name": "Fall Colors Scarf",
    "layer": "NECK",
    "row": 7,
    "categoryName": "Halloween & Fall Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "santa_hat": {
    "id": "santa_hat",
    "name": "Santa Hat",
    "layer": "HEAD",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "reindeer_antlers": {
    "id": "reindeer_antlers",
    "name": "Reindeer Antlers",
    "layer": "HEAD",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "string_lights": {
    "id": "string_lights",
    "name": "String Lights Necklace",
    "layer": "NECK",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "elf_outfit": {
    "id": "elf_outfit",
    "name": "Elf Outfit",
    "layer": "BODY",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "snowy_aura": {
    "id": "snowy_aura",
    "name": "Snowy Aura",
    "layer": "TEXTURE",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "santa_cape": {
    "id": "santa_cape",
    "name": "Santa Cape",
    "layer": "BACK",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "neutral",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "heart_boppers": {
    "id": "heart_boppers",
    "name": "Heart Boppers",
    "layer": "HEAD",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "girl",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "cupid_wings": {
    "id": "cupid_wings",
    "name": "Cupid Wings",
    "layer": "BACK",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "girl",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "pink_heart_sweater": {
    "id": "pink_heart_sweater",
    "name": "Pink Heart Sweater",
    "layer": "BODY",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "girl",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "pink_heart_dress": {
    "id": "pink_heart_dress",
    "name": "Pink Heart Dress",
    "layer": "BODY",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "girl",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "rose_collar": {
    "id": "rose_collar",
    "name": "Rose Collar",
    "layer": "NECK",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "girl",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "baseball_cap": {
    "id": "baseball_cap",
    "name": "Baseball Cap",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "boy",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "backwards_cap": {
    "id": "backwards_cap",
    "name": "Backwards Cap",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "boy",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "bandana_headwrap": {
    "id": "bandana_headwrap",
    "name": "Bandana Headwrap",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "boy",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "dino_crown": {
    "id": "dino_crown",
    "name": "Dino Spike Crown",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "boy",
    "rarity": "Legendary",
    "price": 250,
    "isBodyAdaptive": false
  },
  "knight_helmet": {
    "id": "knight_helmet",
    "name": "Knight Helmet",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "boy",
    "rarity": "Legendary",
    "price": 250,
    "isBodyAdaptive": false
  },
  "dragon_horn": {
    "id": "dragon_horn",
    "name": "Dragon Horns",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "boy",
    "rarity": "Legendary",
    "price": 250,
    "isBodyAdaptive": false
  },
  "safari_hat": {
    "id": "safari_hat",
    "name": "Safari Hat",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "boy",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "captain_hat": {
    "id": "captain_hat",
    "name": "Captain Hat",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "boy",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "wizard_hat": {
    "id": "wizard_hat",
    "name": "Adventurer Wizard Hat",
    "layer": "HEAD",
    "row": 2,
    "categoryName": "Headwear & Horns",
    "style": "boy",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "aviator_glasses": {
    "id": "aviator_glasses",
    "name": "Aviator Glasses",
    "layer": "FACE",
    "row": 3,
    "categoryName": "Face & Neck Accessories",
    "style": "boy",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "dog_tag_necklace": {
    "id": "dog_tag_necklace",
    "name": "Dog Tag Necklace",
    "layer": "NECK",
    "row": 3,
    "categoryName": "Face & Neck Accessories",
    "style": "boy",
    "rarity": "Common",
    "price": 50,
    "isBodyAdaptive": false
  },
  "superhero_shirt": {
    "id": "superhero_shirt",
    "name": "Superhero Shirt",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "boy",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "knight_armor": {
    "id": "knight_armor",
    "name": "Knight Armor",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "boy",
    "rarity": "Legendary",
    "price": 250,
    "isBodyAdaptive": false
  },
  "astronaut_suit": {
    "id": "astronaut_suit",
    "name": "Astronaut Suit",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "boy",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "pirate_vest": {
    "id": "pirate_vest",
    "name": "Pirate Vest",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "boy",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "robot_suit": {
    "id": "robot_suit",
    "name": "Robot Suit",
    "layer": "BODY",
    "row": 4,
    "categoryName": "Clothing (Shirts, Dresses, Outerwear)",
    "style": "boy",
    "rarity": "Uncommon",
    "price": 80,
    "isBodyAdaptive": false
  },
  "dragon_wings": {
    "id": "dragon_wings",
    "name": "Dragon Wings",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "boy",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "jetpack": {
    "id": "jetpack",
    "name": "Jetpack",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "boy",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "robot_backpack": {
    "id": "robot_backpack",
    "name": "Robot Backpack",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "boy",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "superhero_cape": {
    "id": "superhero_cape",
    "name": "Superhero Cape",
    "layer": "BACK",
    "row": 5,
    "categoryName": "Back Accessories (Wings, Capes, Backpacks)",
    "style": "boy",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "dragon_tail": {
    "id": "dragon_tail",
    "name": "Dragon Tail",
    "layer": "TAIL",
    "row": 6,
    "categoryName": "Tails",
    "style": "boy",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "shark_tail": {
    "id": "shark_tail",
    "name": "Shark Tail",
    "layer": "TAIL",
    "row": 6,
    "categoryName": "Tails",
    "style": "boy",
    "rarity": "Rare",
    "price": 120,
    "isBodyAdaptive": false
  },
  "warlock_hat": {
    "id": "warlock_hat",
    "name": "Warlock Hat",
    "layer": "HEAD",
    "row": 7,
    "categoryName": "Halloween & Fall Items",
    "style": "boy",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "lightning_headband": {
    "id": "lightning_headband",
    "name": "Lightning Bolt Headband",
    "layer": "HEAD",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "boy",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "mini_rocket_wings": {
    "id": "mini_rocket_wings",
    "name": "Mini Rocket Wings",
    "layer": "BACK",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "boy",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "team_jersey": {
    "id": "team_jersey",
    "name": "Team Jersey",
    "layer": "BODY",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "boy",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "camo_jacket": {
    "id": "camo_jacket",
    "name": "Camo Jacket",
    "layer": "BODY",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "boy",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  },
  "medal_necklace": {
    "id": "medal_necklace",
    "name": "Medal Necklace",
    "layer": "NECK",
    "row": 8,
    "categoryName": "Christmas & Valentine's Items",
    "style": "boy",
    "rarity": "Epic",
    "price": 180,
    "isBodyAdaptive": false
  }
};

export const GIRL_COMBOS: OutfitCombo[] = [
  {
    "id": "combo_crystal_fairy_princess",
    "name": "Crystal Horns + Fairy Wings + Princess Dress",
    "items": [
      "crystal_horns",
      "fairy_wings",
      "princess_dress"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "combo_halloween_girl",
    "name": "Halloween Combo",
    "items": [
      "witch_hat",
      "bat_wings",
      "pumpkin_sweater",
      "demon_tail"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "combo_christmas_girl",
    "name": "Christmas Combo",
    "items": [
      "reindeer_antlers",
      "winter_sweater",
      "fluffy_winter_scarf"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "combo_bubble_cutie",
    "name": "Bubble Aura + Heart Glasses + Rainbow Bow",
    "items": [
      "bubble_aura",
      "heart_glasses",
      "rainbow_bow"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "combo_mossy_golem",
    "name": "Stone Texture + Mossy Cape + Leaf Crown",
    "items": [
      "stone_skin",
      "mossy_cape",
      "mossy_leaf_crown"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "set_crystal_guardian",
    "name": "Crystal Guardian Set",
    "items": [
      "crystal_horns",
      "crystal_dress",
      "crystal_wings",
      "crystal_tail"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "set_bubble_pop_girl",
    "name": "Bubble Pop Set",
    "items": [
      "bubble_aura",
      "bubble_wings",
      "bubble_wand"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "set_enchanted_stone",
    "name": "Enchanted Stone Set",
    "items": [
      "mossy_leaf_crown",
      "stone_skin",
      "stone_gargoyle_wings"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "set_spooky_halloween_girl",
    "name": "Spooky Halloween Set",
    "items": [
      "witch_hat",
      "bat_wings",
      "pumpkin_sweater",
      "demon_tail"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "set_cozy_christmas_girl",
    "name": "Cozy Christmas Set",
    "items": [
      "reindeer_antlers",
      "santa_cape",
      "string_lights"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "set_valentine_cupid",
    "name": "Valentine's Cupid Set",
    "items": [
      "heart_boppers",
      "cupid_wings",
      "pink_heart_dress"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "set_autumn_harvest_girl",
    "name": "Autumn Harvest Set",
    "items": [
      "leaf_crown",
      "flannel_shirt",
      "fall_scarf"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "pair_hat_glasses",
    "name": "Sun Hat + Heart Glasses",
    "items": [
      "sun_hat",
      "heart_glasses"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "pair_bow_glasses_bowtie",
    "name": "Rainbow Bow + Star Glasses + Bow Tie",
    "items": [
      "rainbow_bow",
      "star_glasses",
      "bow_tie"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "pair_glasses_collar_girl",
    "name": "Round Glasses + Bell Collar",
    "items": [
      "round_glasses",
      "cute_collar"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "pair_shirt_necklace",
    "name": "Heart Sweater + Friendship Necklace",
    "items": [
      "heart_sweater",
      "friendship_necklace"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "pair_dress_necklace",
    "name": "Princess Dress + Friendship Necklace",
    "items": [
      "princess_dress",
      "friendship_necklace"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "pair_clothing_cape_girl",
    "name": "Rainbow T-Shirt + Magical Cape",
    "items": [
      "rainbow_tshirt",
      "magical_cape"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "pair_costume_hat_girl",
    "name": "Pumpkin Sweater + Witch Hat",
    "items": [
      "pumpkin_sweater",
      "witch_hat"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "pair_clothing_backpack_girl",
    "name": "Puffer Jacket + Star Backpack",
    "items": [
      "puffer_jacket",
      "star_backpack"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "combo_unicorn_princess",
    "name": "Unicorn Princess",
    "items": [
      "unicorn_horn",
      "butterfly_wings",
      "sparkly_skirt",
      "rainbow_tail"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "combo_fairy_garden",
    "name": "Fairy Garden",
    "items": [
      "flower_crown",
      "fairy_wings",
      "fairy_dress"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "combo_star_explorer",
    "name": "Star Explorer",
    "items": [
      "star_glasses",
      "star_hoodie",
      "star_backpack"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "combo_rainy_day",
    "name": "Rainy Day",
    "items": [
      "beret",
      "raincoat",
      "bunny_backpack",
      "round_glasses"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "combo_mermaid_princess",
    "name": "Mermaid Princess",
    "items": [
      "princess_tiara",
      "mermaid_tail",
      "friendship_necklace",
      "bubble_wand"
    ],
    "style": "girl",
    "price": 350
  },
  {
    "id": "combo_cozy_winter",
    "name": "Cozy Winter",
    "items": [
      "beanie",
      "puffer_jacket",
      "fluffy_winter_scarf",
      "snowy_aura"
    ],
    "style": "girl",
    "price": 350
  }
];

export const BOY_COMBOS: OutfitCombo[] = [
  {
    "id": "combo_crystal_dragon_knight",
    "name": "Crystal Horns + Dragon Wings + Knight Armor",
    "items": [
      "crystal_horns",
      "dragon_wings",
      "knight_armor"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "combo_halloween",
    "name": "Halloween Combo",
    "items": [
      "warlock_hat",
      "bat_wings",
      "pumpkin_sweater",
      "demon_tail"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "combo_christmas",
    "name": "Christmas Combo",
    "items": [
      "reindeer_antlers",
      "winter_sweater",
      "fluffy_winter_scarf"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "combo_cool_explorer",
    "name": "Aviator Glasses + Backwards Cap + Bubble Aura",
    "items": [
      "bubble_aura",
      "aviator_glasses",
      "backwards_cap"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "combo_stone_golem",
    "name": "Stone Texture + Mossy Cape + Safari Hat",
    "items": [
      "stone_skin",
      "mossy_cape",
      "safari_hat"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "set_crystal_knight",
    "name": "Crystal Knight Set",
    "items": [
      "crystal_horns",
      "knight_armor",
      "crystal_wings",
      "crystal_tail"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "set_bubble_pop",
    "name": "Bubble Pop Set",
    "items": [
      "bubble_aura",
      "bubble_wings",
      "bubble_wand"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "set_stone_guardian",
    "name": "Stone Guardian Set",
    "items": [
      "safari_hat",
      "stone_skin",
      "stone_gargoyle_wings"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "set_spooky_halloween",
    "name": "Spooky Halloween Set",
    "items": [
      "warlock_hat",
      "bat_wings",
      "pumpkin_sweater",
      "demon_tail"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "set_cozy_christmas",
    "name": "Cozy Christmas Set",
    "items": [
      "reindeer_antlers",
      "santa_cape",
      "string_lights"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "set_rocket_ranger",
    "name": "Rocket Ranger Set",
    "items": [
      "lightning_headband",
      "mini_rocket_wings",
      "camo_jacket"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "set_autumn_harvest",
    "name": "Autumn Harvest Set",
    "items": [
      "leaf_crown",
      "flannel_shirt",
      "fall_scarf"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "combo_dragon_explorer",
    "name": "Dragon Explorer",
    "items": [
      "dragon_horn",
      "dragon_wings",
      "pirate_vest",
      "dragon_tail"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "combo_deep_sea",
    "name": "Deep Sea Diver",
    "items": [
      "aviator_glasses",
      "shark_tail",
      "jetpack"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "combo_star_captain",
    "name": "Star Captain",
    "items": [
      "captain_hat",
      "superhero_shirt",
      "star_backpack"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "combo_camp_explorer",
    "name": "Camp Explorer",
    "items": [
      "safari_hat",
      "raincoat",
      "robot_backpack",
      "round_glasses"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "combo_robo_knight",
    "name": "Robo Knight",
    "items": [
      "knight_helmet",
      "robot_suit",
      "jetpack",
      "dog_tag_necklace"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "combo_winter_adventurer",
    "name": "Winter Adventurer",
    "items": [
      "beanie",
      "puffer_jacket",
      "fluffy_winter_scarf",
      "snowy_aura"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "pair_cap_glasses",
    "name": "Baseball Cap + Aviator Glasses",
    "items": [
      "baseball_cap",
      "aviator_glasses"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "pair_bandana_glasses_bowtie",
    "name": "Bandana + Star Glasses + Bow Tie",
    "items": [
      "bandana_headwrap",
      "star_glasses",
      "bow_tie"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "pair_glasses_collar",
    "name": "Round Glasses + Bell Collar",
    "items": [
      "round_glasses",
      "cute_collar"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "pair_shirt_tag",
    "name": "Superhero Shirt + Dog Tag Necklace",
    "items": [
      "superhero_shirt",
      "dog_tag_necklace"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "pair_armor_tag",
    "name": "Knight Armor + Dog Tag Necklace",
    "items": [
      "knight_armor",
      "dog_tag_necklace"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "pair_clothing_cape",
    "name": "Rainbow T-Shirt + Superhero Cape",
    "items": [
      "rainbow_tshirt",
      "superhero_cape"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "pair_costume_hat",
    "name": "Pumpkin Sweater + Warlock Hat",
    "items": [
      "pumpkin_sweater",
      "warlock_hat"
    ],
    "style": "boy",
    "price": 350
  },
  {
    "id": "pair_clothing_backpack",
    "name": "Puffer Jacket + Robot Backpack",
    "items": [
      "puffer_jacket",
      "robot_backpack"
    ],
    "style": "boy",
    "price": 350
  }
];

export const ALL_COMBOS: OutfitCombo[] = [...GIRL_COMBOS, ...BOY_COMBOS];

export function getAvatarBaseUrl(avatarId: string, style: "girl" | "boy" = "girl"): string {
  const aid = avatarId || "black_cat";
  return `/sprites/${style}/${aid}/sprites/base/base_${aid}.png`;
}

export function getDefaultTailUrl(avatarId: string, style: "girl" | "boy" = "girl"): string {
  const aid = avatarId || "black_cat";
  return `/sprites/${style}/${aid}/sprites/base/layer_TAIL_default.png`;
}

export function getItemStandaloneUrl(itemId: string, avatarId: string = "black_cat", preferredStyle: "girl" | "boy" = "girl"): string {
  const item = SPRITE_ITEMS[itemId];
  const aid = avatarId || "black_cat";
  if (!item) return "";
  const styleFolder = item.style === "boy" ? "boy" : (item.style === "girl" ? "girl" : preferredStyle);
  return `/sprites/${styleFolder}/${aid}/sprites/standalone/${itemId}.png`;
}

export function getItemEquippedPreviewUrl(itemId: string, avatarId: string = "black_cat", preferredStyle: "girl" | "boy" = "girl"): string {
  const item = SPRITE_ITEMS[itemId];
  const aid = avatarId || "black_cat";
  if (!item) return "";
  const styleFolder = item.style === "boy" ? "boy" : (item.style === "girl" ? "girl" : preferredStyle);
  return `/sprites/${styleFolder}/${aid}/sprites/equipped/${itemId}.png`;
}

export function getComboPreviewUrl(comboId: string, avatarId: string = "black_cat", style: "girl" | "boy" = "girl"): string {
  const aid = avatarId || "black_cat";
  const cleanId = comboId.replace(/_(girl|boy)$/, '');
  return `/sprites/${style}/${aid}/sprites/combos/${cleanId}.png`;
}
