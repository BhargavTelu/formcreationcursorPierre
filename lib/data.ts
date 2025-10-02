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

// Note: Ported directly from the static HTML dataset (trimmed to representative sample to keep repo small).
// You can extend these arrays with the full dataset from the original file if desired.

export const destinationsData: DestinationNode[] = [
  {
    id: 'cape-town',
    name: 'Cape Town',
    subDestinations: [
      {
        id: 'cape-town-city',
        name: 'Cape Town',
        subDestinations: [
          { id: 'city center', name: 'City Center' },
          { id: 'constantia', name: 'Constantia' },
          { id: 'atlantic seabord', name: 'Atlantic Seabord' },
        ],
      },
      {
        id: 'cape-safari',
        name: 'Safari',
        subDestinations: [
          { id: 'sanbona', name: 'Sanbona Game Reserve' },
          { id: 'aquila', name: 'Aquila Game Reserve' },
          { id: 'inverdoorn', name: 'Inverdoorn Game Reserve' },
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
          { id: 'paarl', name: 'Paarl' },
        ],
      },
    ],
  },
  {
    id: 'n2-route62',
    name: 'N2 & Route 62',
    subDestinations: [
      { id: 'robertson-montagu', name: 'Robertson/ Montagu' },
      { id: 'swellendam-heidelberg', name: 'Swellendam/ Heidelberg' },
    ],
  },
  {
    id: 'oudtshoorn',
    name: 'Oudtshoorn',
    subDestinations: [
      { id: 'oudtshoorn', name: 'Oudtshoorn' },
    ],
  },
  {
    id: 'whale-coast',
    name: 'Whale Coast',
    subDestinations: [
      { id: 'hermanus', name: 'Hermanus' },
      { id: 'gansbaai', name: 'Gansbaai' },
      { id: 'overberg/ agulhas', name: 'Overberg/ Agulhas' },
    ],
  },
  {
    id: 'garden-route',
    name: 'Garden Route',
    subDestinations: [
      { id: 'knysna', name: 'Knysna' },
      { id: 'plettenberg', name: 'Plettenberg Bay' },
      { id: 'george', name: 'George' },
      { id: 'st. francis-bay', name: 'St. Francis Bay' },
      {
        id: 'gr-golfresort',
        name: 'Golfresort',
        subDestinations: [
          { id: 'fancourt', name: 'Fancourt' },
          { id: 'pezula', name: 'Pezula' },
          { id: 'simola', name: 'Simola' },
        ],
      },
      {
        id: 'gr-safari',
        name: 'Safari',
        subDestinations: [
          { id: 'gondwana', name: 'Gondwana Game Reserve' },
          { id: 'botlierskop', name: 'Botlierskop Game Reserve' },
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
      { id: 'dullstroom', name: 'Dullstroom' },
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
          { id: 'kuzuko', name: 'Kuzuko Game Reserve' },
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
      { id: 'north coast', name: 'North Coast' },
      {
        id: 'kzn-safari',
        name: 'Safari',
        subDestinations: [
          { id: 'phinda', name: 'Phinda Game Reserve' },
          { id: 'mkhuze', name: 'Mkhuze Falls Game Reserve' },
          { id: 'namibiti', name: 'Namibiti Game Reserve' },
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
          { id: 'surprise-me', name: 'Surprise me!' },
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
          { id: 'waterberg', name: 'Waterberg' },
        ],
      },
      {
        id: 'botswana',
        name: 'Botswana',
        subDestinations: [
          { id: 'okavango', name: 'Okavango Delta' },
          { id: 'chobe', name: 'Chobe' },
        ],
      },
      { id: 'zambia-zimbabwe', name: 'Zambia/Zimbabwe' },
      { id: 'victoria-falls', name: 'Victoria Falls' },
    ],
  },
  {
    id: 'other-golf',
    name: 'Other Golf Destinations',
    subDestinations: [
      { id: 'sun-city', name: 'Sun City' },
      { id: 'dullstroom', name: 'Dullstroom (Ernie Els Highlands Gate)' },
      { id: 'johannesburg', name: 'Johannesburg' },
      { id: 'zebula', name: 'Zebula' },
      { id: 'pinnacle-point', name: 'Pinnacle Point' },
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
      { id: 'zimbali', name: 'Zimbali' },
    ],
  },
];

export const hotelsData: Hotel[] = [
  // City Center
  { id: 'cape-grace', name: 'Cape Grace', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'the-silo', name: 'The Silo', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'belmond-mount-nelson', name: 'Belmond Mount Nelson', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'one-only-cape-town', name: 'One & Only Cape Town', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'atzaro', name: 'Atzaro', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'cape-cadogan', name: 'Cape Cadogan', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'more-quarters', name: 'More Quarters', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'dock-house', name: 'Dock House', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'welgelegen-house', name: 'Welgelegen House', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'queen-victoria', name: 'Queen Victoria', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'radisson-waterfront', name: 'Radisson Waterfront', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'labotessa', name: 'Labotessa', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'noah-house', name: 'Noah House', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'kaap-mooi', name: 'Kaap Mooi', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'the-winchester', name: 'The Winchester', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'radisson-red', name: 'Radisson Red', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'portswood', name: 'Portswood', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'commodore', name: 'Commodore', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'victoria-alfred', name: 'Victoria & Alfred', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'derwent-house', name: 'Derwent House', regionId: 'cape-town', subRegionId: 'city center' },
  { id: '2in1-kensington', name: '2in1 Kensington', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'kensington-place', name: 'Kensington Place', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'four-rosmead', name: 'Four Rosmead', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'cape-riviera', name: 'Cape Riviera', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'three-boutique-hotel', name: 'Three Boutique Hotel', regionId: 'cape-town', subRegionId: 'city center' },
  { id: 'breakwater-lodge', name: 'Breakwater Lodge', regionId: 'cape-town', subRegionId: 'city center' },
  // Atlantic Seaboard
  { id: '12-apostles', name: '12 Apostles', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'compass-house', name: 'Compass House', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'pod-boutique-hotel', name: 'POD Boutique Hotel', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: '21-nettleton', name: '21 Nettleton', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'ellerman-house', name: 'Ellerman House', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'azamare', name: 'Azamare', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'clarendon-bantry-bay', name: 'Clarendon Bantry Bay', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'sea-five-boutique-hotel', name: 'Sea Five Boutique Hotel', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'lions-eye', name: 'Lions Eye', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'the-bay', name: 'The Bay', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'the-marly', name: 'The Marly', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'blue-views-sc', name: 'Blue Views (SC)', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'south-beach', name: 'South Beach', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'walden-suites', name: 'Walden Suites', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'ocean-view-house', name: 'Ocean View House', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'blackheath-lodge', name: 'Blackheath Lodge', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'o-on-kloof', name: 'O on Kloof', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'otwo-hotel', name: "O'Two Hotel", regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'diamond-house', name: 'Diamond House', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'romney-park', name: 'Romney Park', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'cape-rose-cottage', name: 'Cape Rose Cottage', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'president-hotel', name: 'President Hotel', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
  { id: 'royal-boutique', name: 'Royal Boutique', regionId: 'cape-town', subRegionId: 'atlantic seabord' },
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
  // Stellenbosch Wineregion hotels (subset)
  { id: 'del-aire-graff', name: 'Del Aire Graff', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'lanzerac', name: 'Lanzerac', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'clouds', name: 'Clouds', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'jordan', name: 'Jordan', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'wedge-view', name: 'Wedge View', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'majeka-house', name: 'Majeka House', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  { id: 'de-zalze-lodge', name: 'De Zalze Lodge', regionId: 'stellenbosch-wineregion', subRegionId: 'stellenbosch' },
  // Franschhoek subset
  { id: 'le-quartier-francais', name: 'Le Quartier Francais', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'leeu-house', name: 'Leeu House', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'mont-rochelle', name: 'Mont Rochelle', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  { id: 'babylonstoren', name: 'Babylonstoren', regionId: 'stellenbosch-wineregion', subRegionId: 'franschhoek' },
  // Paarl subset
  { id: 'grand-roche', name: 'Grand Roche', regionId: 'stellenbosch-wineregion', subRegionId: 'paarl' },
  { id: 'pearl-valley-hotel', name: 'Pearl Valley Hotel', regionId: 'stellenbosch-wineregion', subRegionId: 'paarl' },
  // Somerset West subset
  { id: 'silver-forest', name: 'Silver Forest', regionId: 'stellenbosch-wineregion', subRegionId: 'somerset-west' },
  { id: 'erinvale-hotel', name: 'Erinvale Hotel', regionId: 'stellenbosch-wineregion', subRegionId: 'somerset-west' },
  // Whale Coast subset
  { id: 'the-marine', name: 'The Marine', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'birkenhead-house', name: 'Birkenhead House', regionId: 'whale-coast', subRegionId: 'hermanus' },
  { id: 'arabella-kleinmond', name: 'Arabella (Kleinmond)', regionId: 'whale-coast', subRegionId: 'hermanus' },
  // N2 & Route 62 subset
  { id: 'robertson-small-hotel', name: 'Robertson Small Hotel', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },
  { id: 'galenia-estate-montagu', name: 'Galenia Estate Montagu', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },
  { id: 'mimosa-lodge', name: 'Mimosa Lodge', regionId: 'n2-route62', subRegionId: 'robertson-montagu' },
  // Garden Route subset
  { id: 'fancourt-manor-house', name: 'Fancourt Manor House', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'fancourt-hotel', name: 'Fancourt Hotel', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'oubaai', name: 'Oubaai', regionId: 'garden-route', subRegionId: 'george' },
  { id: 'pezula', name: 'Pezula', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'simola', name: 'Simola', regionId: 'garden-route', subRegionId: 'knysna' },
  { id: 'the-plettenberg', name: 'The Plettenberg', regionId: 'garden-route', subRegionId: 'plettenberg' },
  // North subset
  { id: 'the-palace-of-sun-city', name: 'The Palace of Sun City', regionId: 'north', subRegionId: 'north-west' },
  { id: 'zebula-golf-resort', name: 'Zebula Golf Resort', regionId: 'north', subRegionId: 'north-west' },
  // Mpumalanga subset
  { id: 'buhala', name: 'Buhala', regionId: 'north', subRegionId: 'mpumalanga' },
  { id: 'olivers-lodge', name: 'Olivers Lodge', regionId: 'north', subRegionId: 'mpumalanga' },
  // Limpopo subset
  { id: 'safari-moon', name: 'Safari Moon', regionId: 'north', subRegionId: 'limpopo' },
  { id: 'unembeza', name: 'Unembeza', regionId: 'north', subRegionId: 'limpopo' },
  // Dullstroom subset
  { id: 'walkersons', name: 'Walkersons', regionId: 'north', subRegionId: 'dullstroom' },
  // KZN subset
  { id: 'the-oyster-box', name: 'The Oyster Box', regionId: 'kwazulu-natal', subRegionId: 'durban' },
  { id: 'zimbali-the-capital', name: 'Zimbali - The Capital. Zimbali', regionId: 'kwazulu-natal', subRegionId: 'durban' },
  { id: 'days-at-sea', name: 'Days at Sea', regionId: 'kwazulu-natal', subRegionId: 'south-coast' },
  { id: 'lidiko-lodge', name: 'Lidiko Lodge', regionId: 'kwazulu-natal', subRegionId: 'north coast' },
  // Oudtshoorn subset
  { id: 'rosenhof-country-house', name: 'Rosenhof Country House', regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
  { id: 'de-zeekoe', name: 'De Zeekoe', regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
  { id: 'queens-hotel', name: "Queen's Hotel", regionId: 'oudtshoorn', subRegionId: 'oudtshoorn' },
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
  { id: 'route11', label: 'Route 11: SMART - GOLF - Classic Wine, Safari & Garden Route' },
];


