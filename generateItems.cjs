const fs = require('fs');

const newItems = [
  // Royal Collection
  { name: 'King Crown', category: 'Headwear', collection: 'Royal', rarity: 'Legendary', price: 5000, description: 'Rule the living room with an iron paw.', emoji: '👑', color: 'bg-yellow-200 text-yellow-800' },
  { name: 'Queen Tiara', category: 'Headwear', collection: 'Royal', rarity: 'Epic', price: 3000, description: 'Sparkles gracefully in the sunlight.', emoji: '👸', color: 'bg-pink-100 text-pink-700' },
  { name: 'Royal Cape', category: 'Back', collection: 'Royal', rarity: 'Epic', price: 2500, description: 'Velvet cape lined with faux ermine.', emoji: '🧥', color: 'bg-red-800 text-white' },
  { name: 'Scepter', category: 'Hand', collection: 'Royal', rarity: 'Rare', price: 1500, description: 'Command your human subjects.', emoji: '🪄', color: 'bg-amber-300 text-amber-900' },
  { name: 'Throne', category: 'Aura', collection: 'Royal', rarity: 'Mythic', price: 10000, description: 'A plush, magnificent seat of power.', emoji: '🪑', color: 'bg-yellow-500 text-yellow-900' },
  { name: 'Jeweled Necklace', category: 'Waist', collection: 'Royal', rarity: 'Uncommon', price: 800, description: 'Actually it goes around the neck, very fancy.', emoji: '💎', color: 'bg-cyan-100 text-cyan-800' },
  
  // Magic Academy
  { name: 'Wizard Hat', category: 'Headwear', collection: 'Magic Academy', rarity: 'Rare', price: 1200, description: 'Slightly crumpled but full of wisdom.', emoji: '🧙‍♂️', color: 'bg-indigo-300 text-indigo-900' },
  { name: 'Magic Wand', category: 'Hand', collection: 'Magic Academy', rarity: 'Epic', price: 2000, description: 'Swish and flick to summon treats.', emoji: '🎇', color: 'bg-purple-200 text-purple-800' },
  { name: 'Spell Book', category: 'Hand', collection: 'Magic Academy', rarity: 'Uncommon', price: 600, description: 'Contains the secret formula for endless naps.', emoji: '📖', color: 'bg-amber-100 text-amber-900' },
  { name: 'Flying Broom', category: 'Pet', collection: 'Magic Academy', rarity: 'Legendary', price: 4500, description: 'Zooms around chasing imaginary mice.', emoji: '🧹', color: 'bg-yellow-700 text-yellow-100' },
  { name: 'Owl Familiar', category: 'Pet', collection: 'Magic Academy', rarity: 'Epic', price: 2800, description: 'Delivers your acceptance letter.', emoji: '🦉', color: 'bg-slate-300 text-slate-800' },
  { name: 'Potion Bottle', category: 'Hand', collection: 'Magic Academy', rarity: 'Common', price: 300, description: 'Smells remarkably like tuna broth.', emoji: '🧪', color: 'bg-green-200 text-green-900' },
  { name: 'Mystic Aura', category: 'Aura', collection: 'Magic Academy', rarity: 'Mythic', price: 8000, description: 'Purple sparkles float gently around you.', emoji: '✨', color: 'bg-purple-500 text-purple-100' },

  // Gamer Cat
  { name: 'Gaming Headset', category: 'Headwear', collection: 'Gamer', rarity: 'Epic', price: 1800, description: 'RGB lighting included. Purrfect audio.', emoji: '🎧', color: 'bg-slate-800 text-green-400' },
  { name: 'Controller', category: 'Hand', collection: 'Gamer', rarity: 'Rare', price: 900, description: 'Buttons are just right for paw-mashing.', emoji: '🎮', color: 'bg-gray-300 text-gray-900' },
  { name: 'Arcade Cabinet', category: 'Aura', collection: 'Gamer', rarity: 'Legendary', price: 5000, description: 'Insert coin to play Catch the Dot.', emoji: '🕹️', color: 'bg-red-500 text-yellow-300' },
  { name: 'VR Goggles', category: 'Headwear', collection: 'Gamer', rarity: 'Epic', price: 2200, description: 'The virtual mice look so real!', emoji: '🥽', color: 'bg-slate-100 text-slate-900' },
  { name: 'Energy Drink', category: 'Hand', collection: 'Gamer', rarity: 'Uncommon', price: 400, description: 'Zoomies in a can.', emoji: '🥫', color: 'bg-green-400 text-green-900' },
  { name: 'Pixel Pet', category: 'Pet', collection: 'Gamer', rarity: 'Rare', price: 1100, description: 'An 8-bit companion.', emoji: '👾', color: 'bg-indigo-500 text-indigo-100' },

  // Aquatic
  { name: 'Scuba Gear', category: 'Headwear', collection: 'Aquatic', rarity: 'Epic', price: 2400, description: 'For deep-sea tuna fishing.', emoji: '🤿', color: 'bg-blue-300 text-blue-900' },
  { name: 'Mermaid Tail', category: 'Outfit', collection: 'Aquatic', rarity: 'Legendary', price: 4800, description: 'Surprisingly comfortable out of water.', emoji: '🧜‍♀️', color: 'bg-teal-200 text-teal-800' },
  { name: 'Pet Fish', category: 'Pet', collection: 'Aquatic', rarity: 'Uncommon', price: 500, description: 'Friends, not food... maybe.', emoji: '🐠', color: 'bg-orange-200 text-orange-800' },
  { name: 'Trident', category: 'Hand', collection: 'Aquatic', rarity: 'Epic', price: 2000, description: 'Rule the seven seas.', emoji: '🔱', color: 'bg-yellow-400 text-yellow-900' },
  { name: 'Bubble Aura', category: 'Aura', collection: 'Aquatic', rarity: 'Rare', price: 1500, description: 'Pop pop pop!', emoji: '🫧', color: 'bg-cyan-100 text-cyan-500' },
  { name: 'Rubber Ducky', category: 'Pet', collection: 'Aquatic', rarity: 'Common', price: 200, description: 'Makes bath time slightly less terrible.', emoji: '🦆', color: 'bg-yellow-200 text-yellow-700' },

  // Ninja
  { name: 'Ninja Headband', category: 'Headwear', collection: 'Ninja', rarity: 'Uncommon', price: 600, description: 'Focus your inner chi.', emoji: '🥷', color: 'bg-slate-900 text-slate-100' },
  { name: 'Shuriken', category: 'Hand', collection: 'Ninja', rarity: 'Rare', price: 900, description: 'Made of soft foam, perfectly safe.', emoji: '🪃', color: 'bg-gray-400 text-gray-900' },
  { name: 'Katana', category: 'Back', collection: 'Ninja', rarity: 'Epic', price: 2500, description: 'A swift blade for swift paws.', emoji: '🗡️', color: 'bg-slate-200 text-slate-800' },
  { name: 'Smoke Bomb', category: 'Aura', collection: 'Ninja', rarity: 'Legendary', price: 4000, description: 'Disappear into the shadows... to nap.', emoji: '💨', color: 'bg-slate-400 text-slate-100' },
  { name: 'Scroll of Secrets', category: 'Hand', collection: 'Ninja', rarity: 'Rare', price: 1200, description: 'Contains the location of the hidden treats.', emoji: '📜', color: 'bg-amber-100 text-amber-800' },

  // Artist
  { name: 'Beret', category: 'Headwear', collection: 'Artist', rarity: 'Common', price: 300, description: 'A stylish hat for a creative mind.', emoji: '🎨', color: 'bg-red-200 text-red-800' },
  { name: 'Paintbrush', category: 'Hand', collection: 'Artist', rarity: 'Uncommon', price: 400, description: 'Dip the paw, make the art.', emoji: '🖌️', color: 'bg-amber-200 text-amber-900' },
  { name: 'Easel', category: 'Pet', collection: 'Artist', rarity: 'Rare', price: 1000, description: 'Holds your latest masterpiece.', emoji: '🖼️', color: 'bg-stone-300 text-stone-800' },
  { name: 'Palette', category: 'Hand', collection: 'Artist', rarity: 'Common', price: 350, description: 'All the colors of the rainbow.', emoji: '🎨', color: 'bg-white text-slate-800' },
  { name: 'Smock', category: 'Outfit', collection: 'Artist', rarity: 'Rare', price: 1200, description: 'Keeps the paint off your fur.', emoji: '🥼', color: 'bg-slate-100 text-slate-600' },

  // Musician
  { name: 'Electric Guitar', category: 'Hand', collection: 'Musician', rarity: 'Epic', price: 2500, description: 'Shred those riffs!', emoji: '🎸', color: 'bg-red-500 text-white' },
  { name: 'Keyboard', category: 'Hand', collection: 'Musician', rarity: 'Rare', price: 1500, description: 'Play a sweet melody.', emoji: '🎹', color: 'bg-slate-100 text-slate-900' },
  { name: 'Microphone', category: 'Hand', collection: 'Musician', rarity: 'Uncommon', price: 800, description: 'Sing the song of your people at 3 AM.', emoji: '🎤', color: 'bg-slate-300 text-slate-800' },
  { name: 'Drum Set', category: 'Aura', collection: 'Musician', rarity: 'Legendary', price: 5000, description: 'Ba-dum-tss!', emoji: '🥁', color: 'bg-yellow-200 text-yellow-800' },
  { name: 'Trumpet', category: 'Hand', collection: 'Musician', rarity: 'Rare', price: 1100, description: 'Announce your arrival loudly.', emoji: '🎺', color: 'bg-amber-300 text-amber-900' },
  { name: 'Musical Notes', category: 'Aura', collection: 'Musician', rarity: 'Epic', price: 2200, description: 'A melody floats in the air.', emoji: '🎵', color: 'bg-purple-100 text-purple-600' },

  // Astronaut
  { name: 'Space Helmet', category: 'Headwear', collection: 'Sci-Fi', rarity: 'Epic', price: 3000, description: 'Ground control to Major Tomcat.', emoji: '🧑‍🚀', color: 'bg-slate-100 text-slate-800' },
  { name: 'Jetpack', category: 'Back', collection: 'Sci-Fi', rarity: 'Mythic', price: 8000, description: 'To infinity and the kitchen!', emoji: '🚀', color: 'bg-red-400 text-white' },
  { name: 'Alien Friend', category: 'Pet', collection: 'Sci-Fi', rarity: 'Legendary', price: 5500, description: 'Comes in peace, mostly.', emoji: '👽', color: 'bg-green-300 text-green-900' },
  { name: 'UFO', category: 'Aura', collection: 'Sci-Fi', rarity: 'Mythic', price: 9000, description: 'Beam me up, I want food.', emoji: '🛸', color: 'bg-cyan-200 text-cyan-800' },
  { name: 'Moon Rock', category: 'Hand', collection: 'Sci-Fi', rarity: 'Uncommon', price: 700, description: 'It literally rocks.', emoji: '🪨', color: 'bg-slate-300 text-slate-700' },

  // Gardener
  { name: 'Straw Hat', category: 'Headwear', collection: 'Gardener', rarity: 'Common', price: 200, description: 'Keeps the sun out of your eyes.', emoji: '👒', color: 'bg-yellow-100 text-yellow-700' },
  { name: 'Watering Can', category: 'Hand', collection: 'Gardener', rarity: 'Uncommon', price: 400, description: 'For growing premium catnip.', emoji: '🪴', color: 'bg-green-200 text-green-800' },
  { name: 'Flower Crown', category: 'Headwear', collection: 'Gardener', rarity: 'Rare', price: 1000, description: 'Woven with fresh spring daisies.', emoji: '🌸', color: 'bg-pink-100 text-pink-600' },
  { name: 'Bumblebee', category: 'Pet', collection: 'Gardener', rarity: 'Epic', price: 2500, description: 'Buzzes happily around your head.', emoji: '🐝', color: 'bg-yellow-300 text-yellow-900' },
  { name: 'Sunflowers', category: 'Aura', collection: 'Gardener', rarity: 'Legendary', price: 4000, description: 'A field of flowers everywhere you go.', emoji: '🌻', color: 'bg-yellow-400 text-yellow-900' },
  { name: 'Overalls', category: 'Outfit', collection: 'Gardener', rarity: 'Rare', price: 1200, description: 'Denim protection for digging.', emoji: '👖', color: 'bg-blue-400 text-blue-900' },

  // Detective
  { name: 'Deerstalker Hat', category: 'Headwear', collection: 'Detective', rarity: 'Rare', price: 900, description: 'Elementary, my dear Watson.', emoji: '🕵️', color: 'bg-stone-300 text-stone-800' },
  { name: 'Magnifying Glass', category: 'Hand', collection: 'Detective', rarity: 'Uncommon', price: 500, description: 'Investigate the red dot.', emoji: '🔍', color: 'bg-slate-200 text-slate-700' },
  { name: 'Pipe', category: 'Hand', collection: 'Detective', rarity: 'Rare', price: 800, description: 'Blowing bubbles, obviously.', emoji: '🫧', color: 'bg-amber-200 text-amber-800' },
  { name: 'Trench Coat', category: 'Outfit', collection: 'Detective', rarity: 'Epic', price: 2200, description: 'For those rainy city nights.', emoji: '🧥', color: 'bg-amber-100 text-amber-900' },
  { name: 'Notepad', category: 'Hand', collection: 'Detective', rarity: 'Common', price: 250, description: 'Taking notes on dog behavior.', emoji: '📝', color: 'bg-yellow-100 text-yellow-800' },
  
  // Sports
  { name: 'Sweatband', category: 'Headwear', collection: 'Sports', rarity: 'Common', price: 150, description: 'Feel the burn!', emoji: '🤾', color: 'bg-red-200 text-red-800' },
  { name: 'Tennis Racket', category: 'Hand', collection: 'Sports', rarity: 'Uncommon', price: 450, description: 'Perfect for swatting bugs.', emoji: '🎾', color: 'bg-green-100 text-green-700' },
  { name: 'Gold Medal', category: 'Waist', collection: 'Sports', rarity: 'Epic', price: 3000, description: '1st place in napping.', emoji: '🥇', color: 'bg-yellow-300 text-yellow-900' },
  { name: 'Soccer Ball', category: 'Pet', collection: 'Sports', rarity: 'Rare', price: 800, description: 'Goaaaaaaaaal!', emoji: '⚽', color: 'bg-slate-100 text-slate-800' },
  { name: 'Sneakers', category: 'Shoes', collection: 'Sports', rarity: 'Rare', price: 1100, description: 'Maximum zoomie traction.', emoji: '👟', color: 'bg-blue-100 text-blue-700' },
  { name: 'Cheer Pom-Poms', category: 'Hand', collection: 'Sports', rarity: 'Uncommon', price: 550, description: 'Give me a meow!', emoji: '🎊', color: 'bg-pink-200 text-pink-800' },

  // Party Time
  { name: 'Party Hat', category: 'Headwear', collection: 'Party Time', rarity: 'Common', price: 100, description: 'It\'s my birthday!', emoji: '🥳', color: 'bg-fuchsia-200 text-fuchsia-800' },
  { name: 'Balloon', category: 'Hand', collection: 'Party Time', rarity: 'Uncommon', price: 250, description: 'Don\'t let it pop!', emoji: '🎈', color: 'bg-red-300 text-white' },
  { name: 'Confetti Cannon', category: 'Hand', collection: 'Party Time', rarity: 'Rare', price: 750, description: 'Messy but fun.', emoji: '🎉', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'Disco Ball', category: 'Aura', collection: 'Party Time', rarity: 'Legendary', price: 4000, description: 'Time to boogie.', emoji: '🪩', color: 'bg-slate-200 text-slate-800' },
  { name: 'Gift Box', category: 'Pet', collection: 'Party Time', rarity: 'Epic', price: 1500, description: 'What is inside? Who knows!', emoji: '🎁', color: 'bg-red-200 text-red-900' },
  { name: 'Cake Slice', category: 'Hand', collection: 'Party Time', rarity: 'Rare', price: 600, description: 'Extra frosting, please.', emoji: '🍰', color: 'bg-pink-100 text-pink-800' },

  // Spooky
  { name: 'Vampire Cape', category: 'Back', collection: 'Spooky', rarity: 'Rare', price: 1400, description: 'I vant to bite your toes.', emoji: '🧛', color: 'bg-gray-800 text-red-400' },
  { name: 'Witch Broom', category: 'Hand', collection: 'Spooky', rarity: 'Epic', price: 2000, description: 'For nocturnal flights.', emoji: '🧹', color: 'bg-amber-800 text-amber-200' },
  { name: 'Jack-o-Lantern', category: 'Pet', collection: 'Spooky', rarity: 'Uncommon', price: 800, description: 'A glowing squash companion.', emoji: '🎃', color: 'bg-orange-400 text-orange-900' },
  { name: 'Ghost Friend', category: 'Pet', collection: 'Spooky', rarity: 'Legendary', price: 4500, description: 'Boo!', emoji: '👻', color: 'bg-slate-100 text-slate-900' },
  { name: 'Spider Web', category: 'Aura', collection: 'Spooky', rarity: 'Rare', price: 1600, description: 'Slightly sticky.', emoji: '🕸️', color: 'bg-gray-300 text-gray-800' },
  { name: 'Bat Wings', category: 'Back', collection: 'Spooky', rarity: 'Epic', price: 2800, description: 'Creature of the night.', emoji: '🦇', color: 'bg-slate-800 text-slate-300' },

  // Foodie Extended
  { name: 'Taco', category: 'Hand', collection: 'Foodie Kitty', rarity: 'Common', price: 200, description: 'Crunchy and delicious.', emoji: '🌮', color: 'bg-yellow-200 text-yellow-800' },
  { name: 'Ice Cream Cone', category: 'Hand', collection: 'Foodie Kitty', rarity: 'Uncommon', price: 350, description: 'Melting fast!', emoji: '🍦', color: 'bg-pink-100 text-pink-700' },
  { name: 'Popcorn', category: 'Hand', collection: 'Foodie Kitty', rarity: 'Rare', price: 600, description: 'Movie night essential.', emoji: '🍿', color: 'bg-red-100 text-red-800' },
  { name: 'Hot Dog Outfit', category: 'Outfit', collection: 'Foodie Kitty', rarity: 'Legendary', price: 5000, description: 'Frankly, it looks amazing.', emoji: '🌭', color: 'bg-orange-200 text-orange-800' },
  { name: 'French Fries', category: 'Pet', collection: 'Foodie Kitty', rarity: 'Epic', price: 1800, description: 'Crispy golden friends.', emoji: '🍟', color: 'bg-yellow-300 text-yellow-900' },
  { name: 'Pancakes', category: 'Headwear', collection: 'Foodie Kitty', rarity: 'Rare', price: 1200, description: 'Sticky syrup hat.', emoji: '🥞', color: 'bg-amber-100 text-amber-800' },

  // Travel / Vacation
  { name: 'Sunglasses', category: 'Headwear', collection: 'Vacation', rarity: 'Uncommon', price: 500, description: 'Too cool for school.', emoji: '🕶️', color: 'bg-slate-800 text-slate-200' },
  { name: 'Hawaiian Shirt', category: 'Outfit', collection: 'Vacation', rarity: 'Rare', price: 1500, description: 'Floral patterns for relaxing.', emoji: '🌺', color: 'bg-pink-300 text-pink-900' },
  { name: 'Camera', category: 'Hand', collection: 'Vacation', rarity: 'Epic', price: 2000, description: 'Say cheese!', emoji: '📷', color: 'bg-stone-300 text-stone-800' },
  { name: 'Suitcase', category: 'Pet', collection: 'Vacation', rarity: 'Rare', price: 1100, description: 'Ready for the next adventure.', emoji: '🧳', color: 'bg-amber-600 text-amber-100' },
  { name: 'Palm Tree', category: 'Aura', collection: 'Vacation', rarity: 'Legendary', price: 4500, description: 'Island breeze in your fur.', emoji: '🌴', color: 'bg-green-300 text-green-900' },
  { name: 'Coconut Drink', category: 'Hand', collection: 'Vacation', rarity: 'Epic', price: 1800, description: 'Complete with a tiny umbrella.', emoji: '🥥', color: 'bg-stone-200 text-stone-800' },

  // Fantasy / RPG
  { name: 'Knight Helmet', category: 'Headwear', collection: 'Fantasy', rarity: 'Rare', price: 1200, description: 'Sir Meows-a-lot.', emoji: '🛡️', color: 'bg-slate-400 text-slate-900' },
  { name: 'Shield', category: 'Hand', collection: 'Fantasy', rarity: 'Epic', price: 2000, description: 'Blocks incoming vegetables.', emoji: '🛡️', color: 'bg-slate-300 text-slate-800' },
  { name: 'Fairy Wings', category: 'Back', collection: 'Fantasy', rarity: 'Legendary', price: 5500, description: 'Glistening with pixie dust.', emoji: '🧚', color: 'bg-pink-200 text-pink-600' },
  { name: 'Unicorn Horn', category: 'Headwear', collection: 'Fantasy', rarity: 'Mythic', price: 8000, description: 'Magical and pointy.', emoji: '🦄', color: 'bg-fuchsia-200 text-fuchsia-800' },
  { name: 'Bow and Arrow', category: 'Back', collection: 'Fantasy', rarity: 'Epic', price: 2600, description: 'For the stealthy ranger.', emoji: '🏹', color: 'bg-amber-700 text-amber-100' },
  { name: 'Treasure Chest', category: 'Pet', collection: 'Fantasy', rarity: 'Legendary', price: 6000, description: 'Filled with unlimited treats.', emoji: '🪙', color: 'bg-yellow-500 text-yellow-100' },

  // Everyday Cute
  { name: 'Bowtie', category: 'Waist', collection: 'Dapper', rarity: 'Common', price: 150, description: 'A distinguished gentleman.', emoji: '🎀', color: 'bg-red-200 text-red-800' },
  { name: 'Monocle', category: 'Headwear', collection: 'Dapper', rarity: 'Rare', price: 800, description: 'Quite elementary.', emoji: '🧐', color: 'bg-slate-200 text-slate-800' },
  { name: 'Top Hat', category: 'Headwear', collection: 'Dapper', rarity: 'Epic', price: 1600, description: 'Very fancy indeed.', emoji: '🎩', color: 'bg-gray-800 text-gray-200' },
  { name: 'Mustache', category: 'Headwear', collection: 'Dapper', rarity: 'Uncommon', price: 400, description: 'I mustache you a question.', emoji: '🥸', color: 'bg-amber-100 text-amber-900' },
  { name: 'Yarn Ball', category: 'Pet', collection: 'Playtime', rarity: 'Common', price: 100, description: 'A classic toy.', emoji: '🧶', color: 'bg-pink-400 text-pink-100' },
  { name: 'Mouse Toy', category: 'Pet', collection: 'Playtime', rarity: 'Uncommon', price: 250, description: 'Squeak squeak!', emoji: '🐁', color: 'bg-gray-300 text-gray-800' },
  { name: 'Laser Pointer', category: 'Hand', collection: 'Playtime', rarity: 'Epic', price: 2000, description: 'The elusive red dot generator.', emoji: '🔴', color: 'bg-red-500 text-white' },

  // Winter / Holiday
  { name: 'Santa Hat', category: 'Headwear', collection: 'Winter', rarity: 'Rare', price: 900, description: 'Ho ho ho!', emoji: '🎅', color: 'bg-red-600 text-white' },
  { name: 'Snowman Friend', category: 'Pet', collection: 'Winter', rarity: 'Epic', price: 1800, description: 'Likes warm hugs, but melts.', emoji: '⛄', color: 'bg-sky-100 text-sky-800' },
  { name: 'Scarf', category: 'Waist', collection: 'Winter', rarity: 'Uncommon', price: 400, description: 'Knitted by grandma.', emoji: '🧣', color: 'bg-red-300 text-red-900' },
  { name: 'Mittens', category: 'Hand', collection: 'Winter', rarity: 'Rare', price: 700, description: 'Kitten mittens!', emoji: '🧤', color: 'bg-green-300 text-green-900' },
  { name: 'Snowflake Aura', category: 'Aura', collection: 'Winter', rarity: 'Legendary', price: 4500, description: 'A personal flurry.', emoji: '❄️', color: 'bg-blue-100 text-blue-600' }
];

let startingId = 111;
const itemObjects = newItems.map(item => {
  const idStr = `item_${startingId.toString().padStart(3, '0')}`;
  startingId++;
  return `  {
    id: '${idStr}',
    name: '${item.name}',
    category: '${item.category}',
    collection: '${item.collection}',
    rarity: '${item.rarity}',
    price: ${item.price},
    description: '${item.description.replace(/'/g, "\\'")}',
    emoji: '${item.emoji}',
    color: '${item.color}',
  }`;
});

const fileContent = fs.readFileSync('src/data/shopItems.ts', 'utf-8');

// The file ends with "  }\n];\n"
const newContent = fileContent.replace(/  \}\n\];/g, `  },\n${itemObjects.join(',\n')}\n];`);

fs.writeFileSync('src/data/shopItems.ts', newContent);
console.log(`Added ${newItems.length} items to shopItems.ts`);
