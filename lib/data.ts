export type DestinationNode = {
  id: string;
  name: string;
  subDestinations?: DestinationNode[];
};

export type Hotel = {
  id: string;
  name: string;
  regionId: string;
  subRegionId?: string;
};

export const destinationsData: DestinationNode[] = [
  {
    id: 'cape-town',
    name: 'Cape Town',
    subDestinations: [
      {
        id: 'cape-town-city',
        name: 'Cape Town',
        subDestinations: [
          { id: 'city-center', name: 'City Center' },
          { id: 'constantia', name: 'Constantia' },
          { id: 'atlantic-seabord', name: 'Atlantic Seabord' }
        ],
      },
      {
        id: 'cape-safari',
        name: 'Safari',
        subDestinations: [
          { id: 'sanbona', name: 'Sanbona Game Reserve' },
          { id: 'aquila', name: 'Aquila Game Reserve' },
          { id: 'inverdoorn', name: 'Inverdoorn Game Reserve' }
        ],
      },
    ],
  },
  {
    id: 'stellenbosch-wineregion',
    name: 'Stellenbosch Wineregion',
    subDestinations: [
      {
        id: 'wine-region',
        name: 'Wine Region',
        subDestinations: [
          { id: 'stellenbosch', name: 'Stellenbosch' },
          { id: 'franschhoek', name: 'Franschhoek' },
          { id: 'somerset-west', name: 'Somerset West' },
          { id: 'paarl', name: 'Paarl' }
        ],
      },
    ],
  },
  {
    id: 'n2-route62',
    name: 'N2 & Route 62',
    subDestinations: [
      { id: 'robertson-montagu', name: 'Robertson/ Montagu' },
      { id: 'swellendam-heidelberg', name: 'Swellendam/ Heidelberg' }
    ],
  },
  {
    id: 'oudtshoorn',
    name: 'Oudtshoorn',
    subDestinations: [
      { id: 'oudtshoorn', name: 'Oudtshoorn' }
    ],
  },
  {
    id: 'whale-coast',
    name: 'Whale Coast',
    subDestinations: [
      { id: 'hermanus', name: 'Hermanus' },
      { id: 'gansbaai', name: 'Gansbaai' },
      { id: 'overberg-agulhas', name: 'Overberg/ Agulhas' }
    ],
  },
  {
    id: 'garden-route',
    name: 'Garden Route',
    subDestinations: [
      { id: 'knysna', name: 'Knysna' },
      { id: 'plettenberg', name: 'Plettenberg Bay' },
      { id: 'george', name: 'George' },
      { id: 'st-francis-bay', name: 'St. Francis Bay' },
      {
        id: 'gr-golfresort',
        name: 'Golfresort',
        subDestinations: [
          { id: 'fancourt', name: 'Fancourt' },
          { id: 'pezula', name: 'Pezula' },
          { id: 'simola', name: 'Simola' }
        ],
      },
      {
        id: 'gr-safari',
        name: 'Safari',
        subDestinations: [
          { id: 'gondwana', name: 'Gondwana Game Reserve' },
          { id: 'botlierskop', name: 'Botlierskop Game Reserve' }
        ],
      },
    ],
  },
  {
    id: 'north',
    name: 'North',
    subDestinations: [
      { id: 'north-west', name: 'North West' },
      { id: 'mpumalanga', name: 'Mpumalanga' },
      { id: 'limpopo', name: 'Limpopo' },
      { id: 'dullstroom', name: 'Dullstroom' }
    ],
  },
  {
    id: 'eastern-cape',
    name: 'Eastern Cape',
    subDestinations: [
      { id: 'st-francis', name: 'St Francis Bay/Cape St Francis' },
      { id: 'port-elizabeth', name: 'Port Elizabeth' },
      {
        id: 'ec-safari',
        name: 'Safari',
        subDestinations: [
          { id: 'kariega', name: 'Kariega Game Reserve' },
          { id: 'shamwari', name: 'Shamwari Game Reserve' },
          { id: 'lalibela', name: 'Lalibela Game Reserve' },
          { id: 'amakhala', name: 'Amakhala Game Reserve' },
          { id: 'addo', name: 'Addo National Park' },
          { id: 'pumba', name: 'Pumba Game Reserve' },
          { id: 'kuzuko', name: 'Kuzuko Game Reserve' }
        ],
      },
    ],
  },
  {
    id: 'kwazulu-natal',
    name: 'Kwazulu-Natal',
    subDestinations: [
      { id: 'durban', name: 'Durban/Ballito/Umhlanga' },
      { id: 'south-coast', name: 'South Coast' },
      { id: 'north-coast', name: 'North Coast' },
      {
        id: 'kzn-safari',
        name: 'Safari',
        subDestinations: [
          { id: 'phinda', name: 'Phinda Game Reserve' },
          { id: 'mkhuze', name: 'Mkhuze Falls Game Reserve' },
          { id: 'namibiti', name: 'Namibiti Game Reserve' }
        ],
      },
    ],
  },
  {
    id: 'kruger',
    name: 'Kruger National Park & Surroundings',
    subDestinations: [
      { id: 'white-river', name: 'White River' },
      { id: 'hazyview', name: 'Hazyview' },
      { id: 'hoedspruit', name: 'Hoedspruit' },
      {
        id: 'kruger-safari',
        name: 'Safari',
        subDestinations: [
          { id: 'public-kruger', name: 'Public Kruger National Park' },
          { id: 'private-kruger', name: 'Private Game Reserve Kruger National Park' },
          { id: 'sabi-sands', name: 'Sabi Sands' },
          { id: 'thornybush', name: 'Thornybush' },
          { id: 'timbavati', name: 'Timbavati' },
          { id: 'surprise-me', name: 'Surprise me!' }
        ],
      },
    ],
  },
  {
    id: 'other-safari',
    name: 'Other Safari Destinations',
    subDestinations: [
      {
        id: 'malaria-free',
        name: 'Malaria Free',
        subDestinations: [
          { id: 'madikwe', name: 'Madikwe' },
          { id: 'pilansberg', name: 'Pilansberg' },
          { id: 'waterberg', name: 'Waterberg' }
        ],
      },
      {
        id: 'botswana',
        name: 'Botswana',
        subDestinations: [
          { id: 'okavango', name: 'Okavango Delta' },
          { id: 'chobe', name: 'Chobe' }
        ],
      },
      { id: 'zambia-zimbabwe', name: 'Zambia/Zimbabwe' },
      { id: 'victoria-falls', name: 'Victoria Falls' }
    ],
  },
  {
    id: 'other-golf',
    name: 'Other Golf Destinations',
    subDestinations: [
      { id: 'sun-city', name: 'Sun City' },
      { id: 'dullstroom-golf', name: 'Dullstroom (Ernie Els Highlands Gate)' },
      { id: 'johannesburg', name: 'Johannesburg' },
      { id: 'zebula', name: 'Zebula' },
      { id: 'pinnacle-point', name: 'Pinnacle Point' }
    ],
  },
  {
    id: 'must-have-golf',
    name: 'Must Have Golf Courses',
    subDestinations: [
      { id: 'pearl-valley', name: 'Pearl Valley' },
      { id: 'steenberg', name: 'Steenberg' },
      { id: 'arabella-golf', name: 'Arabella' },
      { id: 'de-zalze', name: 'De Zalze' },
      { id: 'erinvale', name: 'Erinvale' },
      { id: 'fancourt-golf', name: 'Fancourt' },
      { id: 'leopard-creek', name: 'Leopard Creek' },
      { id: 'st-francis-links', name: 'St Francis Links' },
      { id: 'simola-golf', name: 'Simola' },
      { id: 'pezula-golf', name: 'Pezula' },
      { id: 'zimbali', name: 'Zimbali' }
    ],
  },
];

export const hotelsData: Hotel[] = [
  // City Center
  { id: 'cape-grace', name: 'Cape Grace', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'the-silo', name: 'The Silo', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'belmond-mount-nelson', name: 'Belmond Mount Nelson', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'one-only-cape-town', name: 'One & Only Cape Town', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'atzaro', name: 'Atzaro', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'cape-cadogan', name: 'Cape Cadogan', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'more-quarters', name: 'More Quarters', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'dock-house', name: 'Dock House', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'welgelegen-house', name: 'Welgelegen House', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'queen-victoria', name: 'Queen Victoria', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'radisson-waterfront', name: 'Radisson Waterfront', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'labotessa', name: 'Labotessa', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'noah-house', name: 'Noah House', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'kaap-mooi', name: 'Kaap Mooi', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'the-winchester', name: 'The Winchester', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'radisson-red', name: 'Radisson Red', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'portswood', name: 'Portswood', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'commodore', name: 'Commodore', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'victoria-alfred', name: 'Victoria & Alfred', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'derwent-house', name: 'Derwent House', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: '2in1-kensington', name: '2in1 Kensington', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'kensington-place', name: 'Kensington Place', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'four-rosmead', name: 'Four Rosmead', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'cape-riviera', name: 'Cape Riviera', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'three-boutique-hotel', name: 'Three Boutique Hotel', regionId: 'cape-town', subRegionId: 'city-center' },
  { id: 'breakwater-lodge', name: 'Breakwater Lodge', regionId: 'cape-town', subRegionId: 'city-center' },

  // Atlantic Seaboard
  { id: '12-apostles', name: '12 Apostles', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'compass-house', name: 'Compass House', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'pod-boutique-hotel', name: 'POD Boutique Hotel', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: '21-nettleton', name: '21 Nettleton', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'ellerman-house', name: 'Ellerman House', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'azamare', name: 'Azamare', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'clarendon-bantry-bay', name: 'Clarendon Bantry Bay', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'sea-five-boutique-hotel', name: 'Sea Five Boutique Hotel', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'lions-eye', name: 'Lions Eye', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'the-bay', name: 'The Bay', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'the-marly', name: 'The Marly', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'blue-views-sc', name: 'Blue Views (SC)', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'south-beach', name: 'South Beach', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'walden-suites', name: 'Walden Suites', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'ocean-view-house', name: 'Ocean View House', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'blackheath-lodge', name: 'Blackheath Lodge', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'o-on-kloof', name: 'O on Kloof', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'otwo-hotel', name: "O'Two Hotel", regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'diamond-house', name: 'Diamond House', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'romney-park', name: 'Romney Park', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'cape-rose-cottage', name: 'Cape Rose Cottage', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'president-hotel', name: 'President Hotel', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },
  { id: 'royal-boutique', name: 'Royal Boutique', regionId: 'cape-town', subRegionId: 'atlantic-seabord' },

  // Constantia
  { id: 'steenberg-hotel', name: 'Steenberg Hotel', regionId: 'cape-town', subRegionId: 'constantia' },
  { id: 'villa-coloniale', name: 'Villa Coloniale', regionId: 'cape-town', subRegionId: 'constantia' },
  { id: 'cellars-hohenhort', name: 'Cellars Hohenhort', regionId: 'cape-town', subRegionId: 'constantia' },
  { id: 'villa-lions-view', name: 'Villa Lions View', regionId: 'cape-town', subRegionId: 'constantia' },
  { id: 'glen-avon', name: 'Glen Avon', regionId: 'cape-town', subRegionId: 'constantia' },
  { id: 'andros-boutique-hotel', name: 'Andros Boutique Hotel', regionId: 'cape-town', subRegionId: 'constantia' },
  { id: 'the-alphen', name: 'The Alphen', regionId: 'cape-town', subRegionId: 'constantia' },
  { id: 'last-word-constantia', name: 'Last Word Constantia', regionId: 'cape-town', subRegionId: 'constantia' },
  { id: 'vineyard-hotel', name: 'Vineyard Hotel', regionId: 'cape-town', subRegionId: 'constantia' },
  { id: 'white-lodge', name: 'White Lodge', regionId: 'cape-town', subRegionId: 'constantia' },

  // Stellenbosch
  { id: 'del-aire-graff', name: 'Del Aire Graff', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'lanzerac', name: 'Lanzerac', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'clouds', name: 'Clouds', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'jordan', name: 'Jordan', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'wedge-view', name: 'Wedge View', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'majeka-house', name: 'Majeka House', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'batavia', name: 'Batavia', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'de-zalze-lodge', name: 'De Zalze Lodge', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'van-der-stel-manor', name: 'Van der Stel Manor', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'river-manor', name: 'River Manor', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'boutique-hotel', name: 'Boutique Hotel', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'roosenwijn', name: 'Roosenwijn', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'cultivar', name: 'Cultivar', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'brenaissance', name: 'Brenaissance', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'devon-valley-hotel', name: 'Devon Valley Hotel', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },

  // Franschhoek
  { id: 'le-quartier-francais', name: 'Le Quartier Francais', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'leeu-house', name: 'Leeu House', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'mont-rochelle', name: 'Mont Rochelle', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'ludus-magnus', name: 'Ludus Magnus', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'akademie-guest-house', name: 'Akademie Guest House', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'la-cle-des-montagnes', name: 'La Cle Des Montagnes', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'babylonstoren', name: 'Babylonstoren', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'leeu-estates', name: 'Leeu Estates', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'la-residence', name: 'La Residence', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'angala-boutique-hotel', name: 'Angala Boutique Hotel', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'la-paris', name: 'La Paris', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'le-manoir-de-brendel', name: 'Le Manoir de Brendel', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'boschendal-werf-cottages', name: 'Boschendal Werf Cottages', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'macaron', name: 'Macaron', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'avondrood-guest-house', name: 'Avondrood Guest House', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'plumwood-inn', name: 'Plumwood Inn', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'basse-provence', name: 'Basse Provence', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'mont-or-franschhoek', name: "Mont d'Or Franschhoek", regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'auberge-clermont', name: 'Auberge Clermont', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'protea-hotel-franschhoek', name: 'Protea Hotel Franschhoek', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },

  // Paarl
  { id: 'grand-roche', name: 'Grand Roche', regionId: 'stellenbosch-wineregion', subRegionId: 'paarl' },
  { id: 'palmiet-valley-estate', name: 'Palmiet Valley Estate', regionId: 'stellenbosch-wineregion', subRegionId: 'paarl' },
  { id: 'the-lighthouse-boutique-suites', name: 'The Lighthouse Boutique Suites', regionId: 'stellenbosch-wineregion', subRegionId: 'paarl' },
  { id: 'd-olyfboom-estate', name: "d'Olyfboom Estate", regionId: 'stellenbosch-wineregion', subRegionId: 'paarl' },
  { id: 'pearl-valley-hotel', name: 'Pearl Valley Hotel', regionId: 'stellenbosch-wineregion', subRegionId: 'paarl' },

  // Somerset West
  { id: 'silver-forest', name: 'Silver Forest', regionId: 'stellenbosch-wineregion', subRegionId: 'somerset-west' },
  { id: 'erinvale-hotel', name: 'Erinvale Hotel', regionId: 'stellenbosch-wineregion', subRegionId: 'somerset-west' },
  { id: 'spanish-farm-guest-lodge', name: 'Spanish Farm Guest Lodge', regionId: 'stellenbosch-wineregion', subRegionId: 'somerset-west' },
  { id: 'willowbrook-guest-lodge', name: 'Willowbrook Guest Lodge', regionId: 'stellenbosch-wineregion', subRegionId: 'somerset-west' },
  { id: 'krystal-beach-hotel', name: 'Krystal Beach Hotel', regionId: 'stellenbosch-wineregion', subRegionId: 'somerset-west' },
  { id: 'nh-the-lord-charles', name: 'NH The Lord Charles', regionId: 'stellenbosch-wineregion', subRegionId: 'somerset-west' },

  // Whale Coast - Hermanus
  { id: 'the-marine', name: 'The Marine', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'birkenhead-house', name: 'Birkenhead House', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: '7-on-marine', name: '7 on Marine', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'abalone-lodge', name: 'Abalone Lodge', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'schulphoek-house', name: 'Schulphoek House', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'one-marine-drive', name: 'One Marine Drive', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'arabella-kleinmond', name: 'Arabella (Kleinmond)', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'whale-rock-lodge', name: 'Whale Rock Lodge', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'on-the-cliff-guest-lodge', name: 'On The Cliff Guest Lodge', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'auberge-burgundy', name: 'Auberge Burgundy', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'hermanus-boutique-hotel', name: 'Hermanus Boutique Hotel', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'misty-waves', name: 'Misty Waves', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'harbour-house-hotel', name: 'Harbour House Hotel', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'bamboo-guesthouse', name: 'Bamboo Guesthouse', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'sandbaai-country-house', name: 'Sandbaai Country House', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'baleia-guest-lodge', name: 'Baleia Guest Lodge', regionId: 'whale-coast', subRegionId: 'hermanus' },

  // Gansbaai
  { id: 'sea-star-lodge', name: 'Sea Star Lodge', regionId: 'whale-coast', subRegionId: 'gansbaai' },
  { id: 'romans-villa', name: 'Romans Villa', regionId: 'whale-coast', subRegionId: 'gansbaai' },
  { id: 'the-roundhouse', name: 'The Roundhouse', regionId: 'whale-coast', subRegionId: 'gansbaai' },

  // Overberg/Agulhas
  { id: 'lekkerwater', name: 'Lekkerwater', regionId: 'whale-coast', subRegionId: 'overberg-agulhas' },
  { id: 'grootbos-nature-reserve', name: 'Grootbos Nature Reserve', regionId: 'whale-coast', subRegionId: 'overberg-agulhas' },
  { id: 'morukuru-beach-ocean-house', name: 'Morukuru Beach & Ocean House', regionId: 'whale-coast', subRegionId: 'overberg-agulhas' },
  { id: 'de-hoop-collection', name: 'De Hoop Collection', regionId: 'whale-coast', subRegionId: 'overberg-agulhas' },
  { id: 'arniston-hotel', name: 'Arniston Hotel', regionId: 'whale-coast', subRegionId: 'overberg-agulhas' },

  // N2 & Route 62 - Robertson/Montagu
  { id: 'robertson-small-hotel', name: 'Robertson Small Hotel', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },
  { id: 'galenia-estate-montagu', name: 'Galenia Estate Montagu', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },
  { id: 'mo-rose', name: 'Mo & Rose', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },
  { id: 'excelsior', name: 'Excelsior', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },
  { id: 'galenia-estate', name: 'Galenia Estate', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },
  { id: 'fraai-uitzicht', name: 'Fraai Uitzicht', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },
  { id: 'gubas-de-hoek', name: 'Gubas de Hoek', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },
  { id: 'mimosa-lodge', name: 'Mimosa Lodge', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },
  { id: 'montagu-country-hotel', name: 'Montagu Country Hotel', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },
  { id: 'rosendal-winery', name: 'Rosendal Winery', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },

  // Swellendam/Heidelberg
  { id: 'the-hideaway', name: 'The Hideaway', regionId: 'n2-route62', subRegionId: 'swellendam-heidelberg' },
  { id: 'schoone-oordt', name: 'Schoone Oordt', regionId: 'n2-route62', subRegionId: 'swellendam-heidelberg' },
  { id: 'jan-harmsgat', name: 'Jan Harmsgat', regionId: 'n2-route62', subRegionId: 'swellendam-heidelberg' },
  { id: 'rothman-manor', name: 'Rothman Manor', regionId: 'n2-route62', subRegionId: 'swellendam-heidelberg' },
  { id: 'de-oude-pastorie', name: 'De Oude Pastorie', regionId: 'n2-route62', subRegionId: 'swellendam-heidelberg' },
  { id: 'aan-de-oever', name: 'Aan de Oever', regionId: 'n2-route62', subRegionId: 'swellendam-heidelberg' },

  // Garden Route - George
  { id: 'fancourt-manor-house', name: 'Fancourt Manor House', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'oceans-wilderness', name: 'Oceans Wilderness', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'views-boutique-hotel-spa', name: 'Views Boutique Hotel & Spa', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'fancourt-hotel', name: 'Fancourt Hotel', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'beach-villa-wilderness', name: 'Beach Villa Wilderness', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'oubaai', name: 'Oubaai', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'dune-villa', name: 'Dune Villa', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'ocean-view-luxury-guesthouse', name: 'Ocean View Luxury Guesthouse', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'malvern-manor', name: 'Malvern Manor', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'dolphin-dunes', name: 'Dolphin Dunes', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'fairview-homestead', name: 'Fairview Homestead', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'oakhurst-hotel', name: 'Oakhurst Hotel', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'protea-hotel-king-george', name: 'Protea Hotel King George', regionId: 'garden-route', subRegionId: 'george' },

  // Knysna
  { id: 'falcons-view-manor', name: 'Falcons View Manor', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'somervreug-guest-house', name: 'Somervreug Guest House', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'kanonkop-house', name: 'Kanonkop House', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'pezula', name: 'Pezula', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'simola', name: 'Simola', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'head-over-hills', name: 'Head over Hills', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'turbine-hotel', name: 'Turbine Hotel', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'villa-paradisa', name: 'Villa Paradisa', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'amanzi-island-lodge', name: 'Amanzi Island Lodge', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'leisure-isle-lodge', name: 'Leisure Isle Lodge', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'knysna-views', name: 'Knysna Views', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'hideaway-guest-house', name: 'Hideaway Guest House', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'rexford-manor', name: 'Rexford Manor', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'madison-manor', name: 'Madison Manor', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'the-moorings', name: 'The Moorings', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'knysna-greens', name: 'Knysna Greens', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'belvidere-manor-sc-cottages', name: 'Belvidere Manor (SC Cottages)', regionId: 'garden-route', subRegionId: 'knysna' },

  // Plettenberg Bay
  { id: 'tsala-treetop-lodge', name: 'Tsala Treetop Lodge', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'the-plettenberg', name: 'The Plettenberg', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'kurland-country-estate', name: 'Kurland Country Estate', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'robberg-beach-lodge', name: 'Robberg Beach Lodge', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'hunters-country-house', name: 'Hunters Country House', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'lairds-lodge', name: 'Lairds Lodge', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'christiana-lodge', name: 'Christiana Lodge', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'tamodi-lodge', name: 'Tamodi Lodge', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'emily-moon', name: 'Emily Moon', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'hog-hollow', name: 'Hog Hollow', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'bitou-river-lodge', name: 'Bitou River Lodge', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'piesang-valley-lodge', name: 'Piesang Valley Lodge', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'southern-cross-beach-house', name: 'Southern Cross Beach House', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'whalesong-hotel', name: 'Whalesong Hotel', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'buffelsdam-country-house', name: 'Buffelsdam Country House', regionId: 'garden-route', subRegionId: 'plettenberg' },
  { id: 'shell-lodges-collection', name: 'Shell lodges collection', regionId: 'garden-route', subRegionId: 'plettenberg' },

  // St. Francis Bay
  { id: 'the-sands-at-st-francis', name: 'The Sands at St Francis', regionId: 'garden-route', subRegionId: 'st-francis-bay' },
  { id: 'st-francis-golf-lodge', name: 'St Francis Golf Lodge', regionId: 'garden-route', subRegionId: 'st-francis-bay' },
  { id: 'thatchwood-country-house', name: 'Thatchwood Country House', regionId: 'garden-route', subRegionId: 'st-francis-bay' },
  { id: 'oyster-bay-lodge', name: 'Oyster Bay Lodge', regionId: 'garden-route', subRegionId: 'st-francis-bay' },
  { id: 'dune-ridge-country-house', name: 'Dune Ridge Country House', regionId: 'garden-route', subRegionId: 'st-francis-bay' },

  // North - North West
  { id: 'the-palace-of-sun-city', name: 'The Palace of Sun City', regionId: 'north', subRegionId: 'north-west' },
  { id: 'sun-city-cascades', name: 'Sun City Cascades', regionId: 'north', subRegionId: 'north-west' },
  { id: 'sun-city-hotel', name: 'Sun City Hotel', regionId: 'north', subRegionId: 'north-west' },
  { id: 'zebula-golf-resort', name: 'Zebula Golf Resort', regionId: 'north', subRegionId: 'north-west' },

  // Mpumalanga
  { id: 'buhala', name: 'Buhala', regionId: 'north', subRegionId: 'mpumalanga' },
  { id: 'olivers-lodge', name: 'Olivers Lodge', regionId: 'north', subRegionId: 'mpumalanga' },
  { id: 'ndhula-lodge', name: 'Ndhula Lodge', regionId: 'north', subRegionId: 'mpumalanga' },
  { id: 'hippo-hollow', name: 'Hippo Hollow', regionId: 'north', subRegionId: 'mpumalanga' },
  { id: 'casa-do-sol', name: 'Casa do Sol', regionId: 'north', subRegionId: 'mpumalanga' },
  { id: 'perrys-bridge-hollow', name: "Perry's Bridge Hollow", regionId: 'north', subRegionId: 'mpumalanga' },

  // Limpopo
  { id: 'safari-moon', name: 'Safari Moon', regionId: 'north', subRegionId: 'limpopo' },
  { id: 'unembeza', name: 'Unembeza', regionId: 'north', subRegionId: 'limpopo' },
  { id: 'moya-safari-villa', name: 'Moya Safari Villa', regionId: 'north', subRegionId: 'limpopo' },
  { id: 'ukuthuka-bush-lodge', name: 'Ukuthuka Bush Lodge', regionId: 'north', subRegionId: 'limpopo' },

  // Dullstroom
  { id: 'walkersons', name: 'Walkersons', regionId: 'north', subRegionId: 'dullstroom' },
  { id: 'critchley-hackle', name: 'Critchley Hackle', regionId: 'north', subRegionId: 'dullstroom' },

  // Kwazulu-Natal - Durban
  { id: 'the-oyster-box', name: 'The Oyster Box', regionId: 'kwazulu-natal', subRegionId: 'durban' },
  { id: 'canelands-beach-club', name: 'Canelands Beach Club', regionId: 'kwazulu-natal', subRegionId: 'durban' },
  { id: 'zimbali-the-capital', name: 'Zimbali - The Capital. Zimbali', regionId: 'kwazulu-natal', subRegionId: 'durban' },
  { id: 'the-vineyard-on-balito', name: 'The Vineyard on Balito', regionId: 'kwazulu-natal', subRegionId: 'durban' },
  { id: 'petite-provence', name: 'Petite Provence', regionId: 'kwazulu-natal', subRegionId: 'durban' },

  // South Coast
  { id: 'days-at-sea', name: 'Days at Sea', regionId: 'kwazulu-natal', subRegionId: 'south-coast' },
  { id: 'coral-tree-colony', name: 'Coral Tree Colony', regionId: 'kwazulu-natal', subRegionId: 'south-coast' },
  { id: 'san-lameer', name: 'San Lameer', regionId: 'kwazulu-natal', subRegionId: 'south-coast' },

  // North Coast
  { id: 'lidiko-lodge', name: 'Lidiko Lodge', regionId: 'kwazulu-natal', subRegionId: 'north-coast' },
  { id: 'kingfisher-lodge', name: 'Kingfisher Lodge', regionId: 'kwazulu-natal', subRegionId: 'north-coast' },

  // Oudtshoorn
  { id: 'rosenhof-country-house', name: 'Rosenhof Country House', regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
  { id: 'altes-landhaus', name: 'Altes Landhaus', regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
  { id: 'de-zeekoe', name: 'De Zeekoe', regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
  { id: 'surval-boutique-olive-farm', name: 'Surval Boutique Olive Farm', regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
  { id: 'montana-guest-farm', name: 'Montana Guest Farm', regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
  { id: 'die-fonteine', name: 'Die Fonteine', regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
  { id: 'de-denne', name: 'De Denne', regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
  { id: 'berluda', name: 'Berluda', regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
  { id: 'mooiplaas', name: 'Mooiplaas', regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
  { id: 'queens-hotel', name: "Queen's Hotel", regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
  { id: 'turnberry-boutique-hotel', name: 'Turnberry Boutique Hotel', regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' }
];

export const predefinedRoutes = [
  { id: 'route1', label: 'Route 1: STB GR und Safari ' },
  { id: 'route2', label: 'Route 2: Clouds & Buhala ' },
  { id: 'route3', label: 'Route 3: GOLF COMFORT - Winelands & Kruger (Wedgegeiw & Olivers)- 10 nts' },
  { id: 'route4', label: 'Route 4: GOLF COMFORT - Cape, Whales, Safari & WIne' },
  { id: 'route5', label: 'Route 5: GOLF COMFORT - Classic Wine, Safari & Garden Route' },
  { id: 'route6', label: 'Route 6: GOLF COMFORT - Kap to Krüger (Cape Riviera & Olivers)- 10 nts' },
  { id: 'route7', label: 'Route 7: GOLF COMFORT - Sun City, Olivers & Kruger' },
  { id: 'route8', label: 'Route 8: GOLF COMFORT - WIne, Wlld Coast & Wildlife' },
  { id: 'route9', label: 'Route 9: GOLF SMART - Cape, Wine & Whales' },
  { id: 'route10', label: 'Route 10: GOLF SMART- Cape & Garden Route' },
  { id: 'route11', label: 'Route 11: SMART - GOLF - Classic Wine, Safari & Garden Route' }
];