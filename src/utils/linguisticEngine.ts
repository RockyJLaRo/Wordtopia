import { VocabWord } from '../types';

export interface WordLinguisticProfile {
  word: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb';
  studentDefinition: string;
  exampleSentence: string;
  clozeSentence: string; // contains _____
  synonyms: string[];
  antonyms: string[];
  category: 'Actions & Skills' | 'Feelings & Traits' | 'Descriptions & States' | 'Communication & Ideas' | 'Time & Nature';
  connotation: 'positive' | 'negative' | 'neutral';
  intensity: 'mild' | 'moderate' | 'strong';
  syllables: string[];
  morphemes?: { prefix?: string; root: string; suffix?: string };
  // Clues for Word Detective (Tier 1 to 4)
  clueLadder: [string, string, string, string];
  // Sentence Forge pieces
  forge: {
    starter: string;
    correctEnding: string;
    deceptiveEnding: string;
    syntacticEnding: string;
  };
  // Context Quest narrative branch
  quest: {
    setting: string;
    scenario: string;
    prompt: string;
    correctOutcome: string;
    incorrectOutcomes: Record<string, string>;
  };
}

export const CURATED_LINGUISTIC_DATABASE: Record<string, WordLinguisticProfile> = {
  clash: {
    word: 'Clash',
    partOfSpeech: 'verb',
    studentDefinition: 'To look ugly or disagree when placed together.',
    exampleSentence: 'Her neon green stripes and bright purple polka dots clash horribly.',
    clozeSentence: 'The two loud paint colors began to _____ on the classroom wall.',
    synonyms: ['conflict', 'disagree', 'mismatch'],
    antonyms: ['match', 'harmonize', 'blend'],
    category: 'Descriptions & States',
    connotation: 'negative',
    intensity: 'moderate',
    syllables: ['clash'],
    clueLadder: [
      'I am an action word often used when colors or patterns collide.',
      'The neon green socks and orange plaid pants _____ terribly.',
      'Starts with "CL-", has 5 letters, and rhymes with splash.',
      'Direct synonym for "conflict" or "mismatch".',
    ],
    forge: {
      starter: 'When Liam put on bright orange shoes with his formal blue suit, the styles...',
      correctEnding: 'began to clash and drew funny looks from his friends.',
      deceptiveEnding: 'began to clash because they were perfectly matched.',
      syntacticEnding: 'clash the colors softly in the mirror.',
    },
    quest: {
      setting: 'The Royal Wardrobe Workshop',
      scenario: 'The Emperor wants a royal banner, but the royal tailor mixed lime-green dye with magenta paint.',
      prompt: 'How would you describe what the two loud colors do together?',
      correctOutcome: 'The tailor repaints the banner in harmonious gold and sapphire!',
      incorrectOutcomes: {
        suggest: 'The tailor politely suggests new colors, but the bright dyes are still colliding.',
        usual: 'There is nothing usual about this glowing neon disaster!',
      },
    },
  },
  winking: {
    word: 'Winking',
    partOfSpeech: 'verb',
    studentDefinition: 'Quickly closing and opening one eye as a secret signal or friendly greeting.',
    exampleSentence: 'Grandpa gave me a playful grin, winking as he slipped me a secret cookie.',
    clozeSentence: 'Aria shared a quiet joke with her brother by _____ across the dinner table.',
    synonyms: ['blinking', 'signaling', 'twinkling'],
    antonyms: ['staring', 'gazing'],
    category: 'Actions & Skills',
    connotation: 'positive',
    intensity: 'mild',
    syllables: ['wink', 'ing'],
    morphemes: { root: 'wink', suffix: 'ing' },
    clueLadder: [
      'I am a facial expression used for sharing secret jokes or warm greetings.',
      'She knew the surprise was ready when her coach smiled and started _____.',
      'Contains 7 letters, starts with "W-", and ends with "-ING".',
      'The action of blinking just one eye at someone playfully.',
    ],
    forge: {
      starter: 'Before letting the kids into the secret surprise room, the guide grinned...',
      correctEnding: 'winking playfully to show that something fun was waiting.',
      deceptiveEnding: 'winking angrily while glaring with both wide-open eyes.',
      syntacticEnding: 'winking of the door handle with both hands.',
    },
    quest: {
      setting: 'The Whispering Forest Path',
      scenario: 'An elf scout perches on an oak branch, holding a golden key behind her back with a warm smile.',
      prompt: 'What playful action does the elf make to show she is on your side?',
      correctOutcome: 'The elf leaps down cheerfully and hands you the golden gateway key!',
      incorrectOutcomes: {
        snarled: 'The friendly elf looks confused as to why you expected her to be tangled.',
        pesky: 'The elf certainly is not trying to annoy you!',
      },
    },
  },
  suggest: {
    word: 'Suggest',
    partOfSpeech: 'verb',
    studentDefinition: 'To offer ideas, plans, or advice for someone to think over.',
    exampleSentence: 'Can you suggest a fun game for us to play during recess?',
    clozeSentence: 'The teacher asked the class to _____ their favorite books for reading circle.',
    synonyms: ['recommend', 'propose', 'advise'],
    antonyms: ['demand', 'order', 'refuse'],
    category: 'Communication & Ideas',
    connotation: 'positive',
    intensity: 'mild',
    syllables: ['sug', 'gest'],
    clueLadder: [
      'I am a speaking action used when offering helpful thoughts or ideas.',
      'May I _____ that we bring umbrellas in case the dark clouds produce rain?',
      'Has 7 letters, begins with "SU-", and ends with "-EST".',
      'To recommend or propose a thoughtful possibility.',
    ],
    forge: {
      starter: 'When the study group could not choose a science fair topic, Olivia decided to...',
      correctEnding: 'suggest building a model volcano powered by baking soda.',
      deceptiveEnding: 'suggest by strictly forcing everyone to obey without discussion.',
      syntacticEnding: 'suggested very idea during the bell ring.',
    },
    quest: {
      setting: 'The Clockwork Council Hall',
      scenario: 'The town gears are stuck, and the inventors are arguing without any practical ideas.',
      prompt: 'What should a helpful apprentice do to help break the deadlock?',
      correctOutcome: 'Your brilliant proposal is warmly accepted, and the gears spin into gear!',
      incorrectOutcomes: {
        protested: 'Shouting protests only makes the engineers argue louder.',
        mushy: 'The metallic gears cannot be repaired with soft mushiness!',
      },
    },
  },
  scrunches: {
    word: 'Scrunches',
    partOfSpeech: 'verb',
    studentDefinition: 'Squeezes, wrinkles, or crushes something into a different tight shape.',
    exampleSentence: 'Every time Leo smells spicy mustard, he scrunches his nose in disgust.',
    clozeSentence: 'The paper artist _____ the damp foil to create rocky mountains on the map.',
    synonyms: ['crumples', 'crushes', 'squeezes'],
    antonyms: ['smoothes', 'flattens', 'stretches'],
    category: 'Actions & Skills',
    connotation: 'neutral',
    intensity: 'moderate',
    syllables: ['scrunch', 'es'],
    morphemes: { root: 'scrunch', suffix: 'es' },
    clueLadder: [
      'I am a physical action that alters the texture and shape of paper, fabric, or faces.',
      'The cat playfully _____ the tissue paper ball with both front paws.',
      'Begins with "SCR-", ends with "-ES", and has 9 letters.',
      'Action of crushing or crumpling tightly into folds.',
    ],
    forge: {
      starter: 'Whenever Mateo makes an error on his drawing sheet, he frustratedly...',
      correctEnding: 'scrunches the paper into a tight ball and tosses it into recycling.',
      deceptiveEnding: 'scrunches the flat paper by ironing it completely smooth.',
      syntacticEnding: 'scrunches into the pencil sharply.',
    },
    quest: {
      setting: 'The Alchemist Origami Studio',
      scenario: 'A magical parchment needs to fit into a tiny glass bottle to reveal its hidden rune.',
      prompt: 'What physical action must you perform on the flexible paper?',
      correctOutcome: 'The paper crumples compactly into the bottle, illuminating the glowing rune!',
      incorrectOutcomes: {
        illustrate: 'Drawing more pictures will not make the large paper fit into the tiny bottle.',
        annual: 'The bottle needs to be filled now, not once a year!',
      },
    },
  },
  mushy: {
    word: 'Mushy',
    partOfSpeech: 'adjective',
    studentDefinition: 'Very soft, squishy, and wet, often lacking firmness.',
    exampleSentence: 'The overripe banana turned mushy and had to be used for banana bread.',
    clozeSentence: 'After three days in the heavy rain, the garden soil became thick and _____.',
    synonyms: ['squishy', 'soft', 'pulpy'],
    antonyms: ['firm', 'solid', 'hard'],
    category: 'Descriptions & States',
    connotation: 'neutral',
    intensity: 'mild',
    syllables: ['mush', 'y'],
    morphemes: { root: 'mush', suffix: 'y' },
    clueLadder: [
      'I describe a texture that gives way easily when squeezed with your fingers.',
      'We could not build sandcastles because the soggy sand had turned completely _____.',
      'Has 5 letters, starts with "M-", and ends with "-Y".',
      'Opposite of crisp, solid, and firm.',
    ],
    forge: {
      starter: 'When we left the strawberries sitting in the hot sun all afternoon, they became...',
      correctEnding: 'so mushy that they practically turned into jam when touched.',
      deceptiveEnding: 'so mushy that they crunched loudly like fresh carrots.',
      syntacticEnding: 'mushy very quickly under the table.',
    },
    quest: {
      setting: 'The Quicksand Marsh',
      scenario: 'You need to step across a swamp. Some stepping stones are firm granite, but others are soft.',
      prompt: 'Which kind of rotten lily pad should you avoid stepping on?',
      correctOutcome: 'You carefully leap onto the solid stones, avoiding the squishy swamp muck!',
      incorrectOutcomes: {
        usual: 'Usual stones are safe; you needed to identify the soft, rotten ones!',
        annual: 'The swamp waters do not care what season it is!',
      },
    },
  },
  usual: {
    word: 'Usual',
    partOfSpeech: 'adjective',
    studentDefinition: 'Happening most of the time; normal, common, or expected.',
    exampleSentence: 'We walked our usual route home through the oak tree park.',
    clozeSentence: 'It was our _____ Saturday morning routine to make whole-wheat pancakes together.',
    synonyms: ['normal', 'customary', 'common'],
    antonyms: ['rare', 'unusual', 'strange'],
    category: 'Descriptions & States',
    connotation: 'neutral',
    intensity: 'mild',
    syllables: ['u', 'su', 'al'],
    clueLadder: [
      'I describe events, paths, or routines that happen regularly and predictably.',
      'The bus driver arrived at our _____ stop right on schedule.',
      'Starts with the vowel "U-", ends with "-AL", has 5 letters.',
      'Direct synonym for "regular", "normal", or "customary".',
    ],
    forge: {
      starter: 'Because the main street was undergoing construction, the school bus could not take its...',
      correctEnding: 'usual morning route and had to turn onto Maple Avenue instead.',
      deceptiveEnding: 'usual morning route because that path was totally unique and never used before.',
      syntacticEnding: 'usual onto the bridge with heavy wheels.',
    },
    quest: {
      setting: 'The Castle Gatehouse',
      scenario: 'The gatekeeper greets the village bakers who arrive at the exact same hour every single day.',
      prompt: 'What word best describes their customary, expected morning arrival?',
      correctOutcome: 'The gatekeeper raises the iron portcullis with a friendly nod of recognition!',
      incorrectOutcomes: {
        pesky: 'The friendly bakers are not annoying pests!',
        bilingual: 'Speaking multiple languages was not the reason for their predictable schedule.',
      },
    },
  },
  bilingual: {
    word: 'Bilingual',
    partOfSpeech: 'adjective',
    studentDefinition: 'Able to speak, read, or write fluently in two different languages.',
    exampleSentence: 'Sofia is bilingual because she speaks both Spanish and English at home.',
    clozeSentence: 'The travel guide was _____, answering tourists in both Japanese and French.',
    synonyms: ['multilingual', 'dual-language'],
    antonyms: ['monolingual'],
    category: 'Communication & Ideas',
    connotation: 'positive',
    intensity: 'moderate',
    syllables: ['bi', 'lin', 'gual'],
    morphemes: { prefix: 'bi', root: 'lingual' },
    clueLadder: [
      'I describe a person or document that uses two distinct spoken or written languages.',
      'Because Julian was _____, he comfortably translated between the visiting athletes.',
      'Features the prefix "BI-" (meaning two) and ends with "-AL".',
      'The ability to converse fluently in two languages.',
    ],
    forge: {
      starter: 'Growing up with grandparents in Montreal and Toronto allowed Camille to become...',
      correctEnding: 'completely bilingual in French and English from a young age.',
      deceptiveEnding: 'bilingual by speaking only one single language her whole life.',
      syntacticEnding: 'bilingual the book on the library shelf.',
    },
    quest: {
      setting: 'The Ambassador Pavilion',
      scenario: 'Diplomats from two neighboring kingdoms cannot understand each other and need a translator.',
      prompt: 'What skill should the kingdom court scholar possess to unite the two sides?',
      correctOutcome: 'The scholar translates between both delegations and forges a lasting peace treaty!',
      incorrectOutcomes: {
        clash: 'Causing the two cultures to clash would start a trade war!',
        mismatched: 'Mismatched words would lead to disastrous misunderstandings.',
      },
    },
  },
  mismatched: {
    word: 'Mismatched',
    partOfSpeech: 'adjective',
    studentDefinition: 'Things that do not look good together or do not fit properly.',
    exampleSentence: 'In the dark morning, I accidentally put on mismatched blue and black socks.',
    clozeSentence: 'The jigsaw piece remained loose because it was _____ with the empty corner.',
    synonyms: ['unequal', 'unpaired', 'ill-fitting'],
    antonyms: ['matched', 'paired', 'coordinated'],
    category: 'Descriptions & States',
    connotation: 'negative',
    intensity: 'mild',
    syllables: ['mis', 'matched'],
    morphemes: { prefix: 'mis', root: 'match', suffix: 'ed' },
    clueLadder: [
      'I describe two items that fail to coordinate, balance, or belong as a pair.',
      'The bookshelf looked odd because the carpenter installed two _____ wooden legs.',
      'Starts with prefix "MIS-", ends with "-ED", and contains 10 letters.',
      'The opposite of harmoniously paired or coordinated.',
    ],
    forge: {
      starter: 'When digging through the laundry bin in a hurry, Arthur pulled out...',
      correctEnding: 'mismatched gloves that were two entirely different sizes and colors.',
      deceptiveEnding: 'mismatched gloves that were identical twins down to every stitch.',
      syntacticEnding: 'mismatched under the closet rack cleanly.',
    },
    quest: {
      setting: 'The Gearsmith Chamber',
      scenario: 'You must fit a pair of cogs onto the clock axle. The cog teeth must mesh evenly.',
      prompt: 'What kind of cogs will jam the axle and ruin the machine?',
      correctOutcome: 'You reject the mismatched gears and find the twin matched pair, restoring power!',
      incorrectOutcomes: {
        usual: 'Usual cogs are standard and work properly!',
        illustrate: 'Drawing pictures of the cogs does not change their tooth sizes.',
      },
    },
  },
  moody: {
    word: 'Moody',
    partOfSpeech: 'adjective',
    studentDefinition: 'Having feelings or emotions that change often and unpredictably.',
    exampleSentence: 'The moody puppy was tail-wagging one second and sulking in the corner the next.',
    clozeSentence: 'During the rainy spell, our neighbor seemed quite _____, alternating between laughter and grumbles.',
    synonyms: ['temperamental', 'sullen', 'unpredictable'],
    antonyms: ['cheerful', 'even-tempered', 'steady'],
    category: 'Feelings & Traits',
    connotation: 'negative',
    intensity: 'moderate',
    syllables: ['mood', 'y'],
    morphemes: { root: 'mood', suffix: 'y' },
    clueLadder: [
      'I describe someone whose emotional state shifts rapidly from sunny to irritable.',
      'The protagonist in the novel was _____, brooding quietly before suddenly smiling.',
      'Has 5 letters, starts with "M-", and rhymes with broody.',
      'Temperamental and prone to frequent shifts in emotional weather.',
    ],
    forge: {
      starter: 'When toddlers skip their afternoon nap, they often become remarkably...',
      correctEnding: 'moody, giggling with delight one minute and crying over a spilled crayon the next.',
      deceptiveEnding: 'moody by staying completely calm, peaceful, and unbothered for hours.',
      syntacticEnding: 'moody the nursery toys across the floor.',
    },
    quest: {
      setting: 'The Pixie Treehouse',
      scenario: 'A fairy companion is shifting between joyful bursts of sparkles and thunderous storm clouds.',
      prompt: 'How would you describe the unpredictable pixie temperament right now?',
      correctOutcome: 'You offer soothing chamomile tea and gently calm the pixie spirits down!',
      incorrectOutcomes: {
        annual: 'The shifts in feelings are happening every 5 minutes, not once a year!',
        recited: 'Saying poems will not explain why feelings are swinging.',
      },
    },
  },
  pesky: {
    word: 'Pesky',
    partOfSpeech: 'adjective',
    studentDefinition: 'Causing annoyance, irritation, or minor trouble.',
    exampleSentence: 'A pesky mosquito buzzed around our campsite tent all night long.',
    clozeSentence: 'The gardener put up netting to keep the _____ squirrels away from the ripe tomatoes.',
    synonyms: ['annoying', 'troublesome', 'bothersome'],
    antonyms: ['pleasant', 'delightful', 'helpful'],
    category: 'Feelings & Traits',
    connotation: 'negative',
    intensity: 'moderate',
    syllables: ['pes', 'ky'],
    clueLadder: [
      'I describe creatures, habits, or problems that are irritating and hard to get rid of.',
      'We spent twenty minutes looking for the _____ pebble stuck inside my sneaker.',
      'Has 5 letters, begins with "P-", and ends with "-Y".',
      'Direct synonym for "bothersome", "irritating", or "annoying".',
    ],
    forge: {
      starter: 'During the lakeside picnic, a swarm of...',
      correctEnding: 'pesky flies kept buzzing over the watermelon and ruined our peaceful lunch.',
      deceptiveEnding: 'pesky flies gave us helpful directions and brought fresh napkins.',
      syntacticEnding: 'pesky over the checkered blanket in silence.',
    },
    quest: {
      setting: 'The Orchard Watchtower',
      scenario: 'Rabbits are digging small holes under the tomato patch fences, frustrating the farmer.',
      prompt: 'What word captures these troublesome, irritating little invaders?',
      correctOutcome: 'You install humane wooden fencing, keeping the pesky critters safely out!',
      incorrectOutcomes: {
        illustrate: 'The rabbits do not draw illustrations of the fence.',
        usual: 'Normal animals would stay in the woods; these are especially bothersome!',
      },
    },
  },
  illustrate: {
    word: 'Illustrate',
    partOfSpeech: 'verb',
    studentDefinition: 'To draw pictures or provide clear examples that explain and enrich a story.',
    exampleSentence: 'The artist agreed to illustrate the magical fantasy book with watercolor paintings.',
    clozeSentence: 'The teacher drew a quick diagram on the board to _____ how solar eclipses work.',
    synonyms: ['draw', 'depict', 'demonstrate', 'clarify'],
    antonyms: ['obscure', 'confuse', 'erase'],
    category: 'Actions & Skills',
    connotation: 'positive',
    intensity: 'mild',
    syllables: ['il', 'lus', 'trate'],
    morphemes: { root: 'illustrate' },
    clueLadder: [
      'I am an artistic and communicative action that clarifies text through visual imagery.',
      'Beatrix Potter decided to _____ her own children stories with charming rabbit sketches.',
      'Starts with "IL-", ends with "-ATE", and has 10 letters across 3 syllables.',
      'To provide pictures, diagrams, or visual examples to accompany text.',
    ],
    forge: {
      starter: 'To make the complex biology chapter easier for elementary students to understand, the author...',
      correctEnding: 'hired an artist to illustrate each page with colorful cell diagrams.',
      deceptiveEnding: 'decided to illustrate the book by erasing all pictures and diagrams completely.',
      syntacticEnding: 'illustrate quickly through the front library door.',
    },
    quest: {
      setting: 'The Scribe Guild Sanctum',
      scenario: 'A book of ancient legends has blank pages that need artwork so younger villagers can learn the history.',
      prompt: 'What creative duty will you perform for the guild library?',
      correctOutcome: 'You paint vivid scenes of dragons and crystal citadels onto the sacred parchment!',
      incorrectOutcomes: {
        snarled: 'Tangling the parchment into knots will destroy the book!',
        protested: 'Complaining will not paint the blank pages.',
      },
    },
  },
  snarled: {
    word: 'Snarled',
    partOfSpeech: 'adjective',
    studentDefinition: 'Tangled up into a messy knot; or growled viciously showing teeth.',
    exampleSentence: 'My headphone cords became completely snarled inside my backpack pocket.',
    clozeSentence: 'The deep fishing line was so badly _____ that the fisherman had to cut the knot.',
    synonyms: ['tangled', 'knotted', 'entwined'],
    antonyms: ['untangled', 'straight', 'smooth'],
    category: 'Descriptions & States',
    connotation: 'negative',
    intensity: 'moderate',
    syllables: ['snarled'],
    morphemes: { root: 'snarl', suffix: 'ed' },
    clueLadder: [
      'I describe threads, yarn, or hair that have become twisted into impossible knots.',
      'After the puppy pulled the knitting yarn through the bushes, it was hopeless and _____.',
      'Rhymes with "gnarled", starts with "SN-", and has 7 letters.',
      'Hopelessly twisted, tangled, and knotted together.',
    ],
    forge: {
      starter: 'When Maya pulled her kite string out of the stormy bush, she discovered it was...',
      correctEnding: 'so snarled with twigs and knots that it took an hour to unravel.',
      deceptiveEnding: 'snarled in a straight, perfectly ironed ribbon without a single loop.',
      syntacticEnding: 'snarled the flying spool high in the blue sky.',
    },
    quest: {
      setting: 'The Weaver Ancient Loom',
      scenario: 'The golden tapestry strings have been caught by a sudden breeze and twisted into a tangled mess.',
      prompt: 'What condition are the silk strings currently in?',
      correctOutcome: 'With patient care and a fine brass pick, you gently comb the snarled threads straight!',
      incorrectOutcomes: {
        annual: 'The threads are tangled right now, not on a yearly calendar schedule!',
        winking: 'Winking at the knot will not untangle the silk!',
      },
    },
  },
  annual: {
    word: 'Annual',
    partOfSpeech: 'adjective',
    studentDefinition: 'Happening, recurring, or published once every year.',
    exampleSentence: 'Our town holds an annual pumpkin festival every October.',
    clozeSentence: 'The family gathered for their _____ reunion at the lakeside cottage every July.',
    synonyms: ['yearly', 'yearlong', 'anniversary'],
    antonyms: ['daily', 'monthly', 'perennial'],
    category: 'Time & Nature',
    connotation: 'neutral',
    intensity: 'mild',
    syllables: ['an', 'nu', 'al'],
    clueLadder: [
      'I describe traditions, celebrations, or inspections that take place once every 12 months.',
      'The school library hosts its _____ book fair every spring.',
      'Begins with "AN-", ends with "-AL", and has 6 letters.',
      'Occurring, celebrated, or recurring once a year.',
    ],
    forge: {
      starter: 'Because the county fair is an important...',
      correctEnding: 'annual event, farmers spend the entire year preparing their prize vegetables.',
      deceptiveEnding: 'annual event, it occurs three times every single afternoon.',
      syntacticEnding: 'annual across the fairway without stopping.',
    },
    quest: {
      setting: 'The Celestial Observatory',
      scenario: 'A legendary shooting star cluster visits the kingdom once every 365 days.',
      prompt: 'What calendar term describes this yearly cosmic phenomenon?',
      correctOutcome: 'You calibrate the brass telescope and map the annual meteor shower in glory!',
      incorrectOutcomes: {
        pesky: 'The glorious celestial stars are an awe-inspiring wonder, not an annoyance!',
        mushy: 'Cosmic comets are icy rock, never mushy!',
      },
    },
  },
  recited: {
    word: 'Recited',
    partOfSpeech: 'verb',
    studentDefinition: 'Repeated, spoke, or performed from memory in front of listeners.',
    exampleSentence: 'Maya proudly recited the pledge of allegiance without checking the paper.',
    clozeSentence: 'At the talent show, the young poet stepped up and _____ three stanzas by heart.',
    synonyms: ['repeated', 'performed', 'narrated'],
    antonyms: ['forgot', 'improvised', 'hesitated'],
    category: 'Communication & Ideas',
    connotation: 'positive',
    intensity: 'moderate',
    syllables: ['re', 'ci', 'ted'],
    morphemes: { prefix: 're', root: 'cite', suffix: 'ed' },
    clueLadder: [
      'I am an action of public speaking where stored memory is spoken aloud.',
      'Without looking down at his script, the lead actor smoothly _____ his opening monologue.',
      'Begins with prefix "RE-", ends with "-ED", and has 7 letters.',
      'Spoke or declared aloud from memory after careful practice.',
    ],
    forge: {
      starter: 'After rehearsing her speech every evening for two straight weeks, Samantha...',
      correctEnding: 'recited every single line with confidence before the whole auditorium.',
      deceptiveEnding: 'recited by forgetting every word and refusing to speak a sound.',
      syntacticEnding: 'recited into the microphone stand quietly without words.',
    },
    quest: {
      setting: 'The Gate of Echoes',
      scenario: 'A stone guardian asks for the ancient password, which was recorded in a historic scroll.',
      prompt: 'What vocal action must you take with the remembered password to pass?',
      correctOutcome: 'The stone doors rumble open as the spoken words resonate through the hall!',
      incorrectOutcomes: {
        clash: 'Making the words clash would break the magical seal!',
        scrunches: 'Crushing the scroll paper will not speak the secret phrase.',
      },
    },
  },
  protested: {
    word: 'Protested',
    partOfSpeech: 'verb',
    studentDefinition: 'Spoke out strongly or took action against something believed to be unfair.',
    exampleSentence: 'The children protested when their favorite playground was threatened with closure.',
    clozeSentence: 'The captain loudly _____ the referee call, arguing the goal had crossed the line.',
    synonyms: ['objected', 'disagreed', 'opposed'],
    antonyms: ['agreed', 'accepted', 'approved'],
    category: 'Communication & Ideas',
    connotation: 'negative',
    intensity: 'strong',
    syllables: ['pro', 'tes', 'ted'],
    morphemes: { prefix: 'pro', root: 'test', suffix: 'ed' },
    clueLadder: [
      'I am an action of speaking up or assembling to disagree with an unfair policy or decision.',
      'When bedtime was moved an hour earlier, the siblings politely _____ to their parents.',
      'Begins with "PRO-", ends with "-ED", and contains 9 letters.',
      'Expressed strong objection, disagreement, or opposition.',
    ],
    forge: {
      starter: 'When the city announced plans to pave over the neighborhood community garden, residents...',
      correctEnding: 'protested peacefully by carrying signs and speaking at the city hall meeting.',
      deceptiveEnding: 'protested happily by cheering for the bulldozers and welcoming the pavement.',
      syntacticEnding: 'protested down the street without any shoes.',
    },
    quest: {
      setting: 'The Town Hall Forum',
      scenario: 'The mayor attempts to cancel the annual library funding without citizen consent.',
      prompt: 'What civic action do the passionate citizens take to save their library?',
      correctOutcome: 'The citizens speak out united, and the mayor reverses the unfair decision!',
      incorrectOutcomes: {
        winking: 'Winking at the council would not convey the seriousness of the issue.',
        snarled: 'Being tangled in knots will not persuade the city leaders.',
      },
    },
  },
};

/**
 * Generates an automatic linguistic profile for any custom user-added word
 */
export function getWordLinguisticProfile(vocabWord: VocabWord): WordLinguisticProfile {
  const normalizedKey = (vocabWord.word || '').trim().toLowerCase();
  if (CURATED_LINGUISTIC_DATABASE[normalizedKey]) {
    return CURATED_LINGUISTIC_DATABASE[normalizedKey];
  }

  // Algorithmic deduction for custom words
  const cleanWord = (vocabWord.word || '').trim();
  const cleanDef = (vocabWord.definition || '').trim();
  const lowerWord = cleanWord.toLowerCase();

  // Part of speech deduction
  let pos: WordLinguisticProfile['partOfSpeech'] = 'noun';
  if (lowerWord.endsWith('ing') || lowerWord.endsWith('ed') || lowerWord.endsWith('ize') || lowerWord.endsWith('ate')) {
    pos = 'verb';
  } else if (lowerWord.endsWith('ly')) {
    pos = 'adverb';
  } else if (lowerWord.endsWith('ful') || lowerWord.endsWith('ous') || lowerWord.endsWith('y') || lowerWord.endsWith('ive') || lowerWord.endsWith('able')) {
    pos = 'adjective';
  }

  // Simple syllable chunking
  const chunks = chunkWordIntoSyllables(cleanWord);

  // Generate plausible cloze sentence
  const cloze = `The explorer observed how the word "${cleanWord}" was demonstrated when _____.`;
  const example = `In our vocabulary lesson, "${cleanWord}" means ${cleanDef.toLowerCase()}`;

  return {
    word: cleanWord,
    partOfSpeech: pos,
    studentDefinition: cleanDef,
    exampleSentence: example,
    clozeSentence: `The students practiced using the word _____ in their classroom discussion.`,
    synonyms: ['expression of ' + cleanWord],
    antonyms: ['opposite of ' + cleanWord],
    category: pos === 'verb' ? 'Actions & Skills' : pos === 'adjective' ? 'Descriptions & States' : 'Communication & Ideas',
    connotation: 'neutral',
    intensity: 'moderate',
    syllables: chunks,
    clueLadder: [
      `I am a ${pos} in the vocabulary lesson.`,
      `Definition clue: "${cleanDef}"`,
      `Word starts with "${cleanWord.slice(0, 2).toUpperCase()}-" and has ${cleanWord.length} letters.`,
      `Exact vocabulary match for: ${cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1)}.`,
    ],
    forge: {
      starter: `When learning new concepts, the teacher explained that ${cleanWord}...`,
      correctEnding: `directly relates to: "${cleanDef}".`,
      deceptiveEnding: `means the exact opposite of what it truly represents.`,
      syntacticEnding: `${cleanWord} across the wooden desk yesterday.`,
    },
    quest: {
      setting: 'The Grand Archives of Wordtopia',
      scenario: `The head librarian opens a mystical manuscript that references "${cleanWord}".`,
      prompt: `Select the word that accurately represents: "${cleanDef}"`,
      correctOutcome: `The archive stone glows warmly with ancient knowledge as "${cleanWord}" is unlocked!`,
      incorrectOutcomes: {},
    },
  };
}

/**
 * Clean heuristic syllable divider
 */
export function chunkWordIntoSyllables(word: string): string[] {
  const w = word.trim();
  if (w.length <= 4) return [w];

  // Common prefixes & suffixes
  const prefixes = ['un', 're', 'in', 'im', 'dis', 'mis', 'pre', 'bi', 'tri'];
  const suffixes = ['ing', 'ed', 'es', 'ly', 'ment', 'tion', 'sion', 'able', 'ful', 'ness', 'est', 'er'];

  const lower = w.toLowerCase();
  for (const p of prefixes) {
    if (lower.startsWith(p) && lower.length > p.length + 3) {
      return [w.slice(0, p.length), ...chunkWordIntoSyllables(w.slice(p.length))];
    }
  }

  for (const s of suffixes) {
    if (lower.endsWith(s) && lower.length > s.length + 3) {
      return [...chunkWordIntoSyllables(w.slice(0, w.length - s.length)), w.slice(w.length - s.length)];
    }
  }

  // Split roughly in halves around middle vowels
  const mid = Math.floor(w.length / 2);
  return [w.slice(0, mid), w.slice(mid)];
}
