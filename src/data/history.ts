import type { HistoryCategory, Song } from "../types";

type HistoryTopic = Exclude<HistoryCategory, "all">;
type RawEvent = [number, string, string, HistoryTopic, string];

// A separate history database. These records are never imported by the music catalog.
// The selection is deliberately spread across the whole period 1900–2025 and mixes
// famous milestones with somewhat less obvious but still broadly recognizable events.
const RAW_HISTORY: RawEvent[] = [
  [1900, "Boxarupproret kulminerar i Kina", "En internationell styrka ingriper efter ett våldsamt uppror mot utländskt inflytande och kristna missionärer.", "world", "🏛️"],
  [1901, "De första Nobelprisen delas ut", "De första priserna enligt Alfred Nobels testamente delas ut i Stockholm och Kristiania.", "sweden", "🏅"],
  [1902, "Kuba blir självständigt", "Republiken Kuba utropas efter det spansk-amerikanska kriget och en period av amerikansk ockupation.", "world", "🌎"],
  [1903, "Bröderna Wright genomför en motordriven flygning", "Flygningen vid Kitty Hawk blir ett avgörande genombrott för det moderna flyget.", "science", "✈️"],
  [1904, "Entente cordiale undertecknas", "Storbritannien och Frankrike löser flera koloniala tvister och närmar sig politiskt.", "world", "🤝"],
  [1905, "Einstein publicerar den speciella relativitetsteorin", "Albert Einsteins annus mirabilis förändrar fysikens syn på rum, tid och energi.", "science", "🧠"],
  [1906, "Jordbävningen i San Francisco", "En kraftig jordbävning och efterföljande bränder förstör stora delar av staden.", "society", "🌋"],
  [1907, "Scoutrörelsen tar form", "Robert Baden-Powells försöksläger på Brownsea Island blir startpunkt för den internationella scoutrörelsen.", "society", "🏕️"],
  [1908, "Ford Model T lanseras", "Den billiga och massproducerade bilen bidrar till att förändra transporter och industri.", "science", "🚗"],
  [1909, "Blériot flyger över Engelska kanalen", "Louis Blériot blir först att flyga över kanalen i ett flygplan.", "science", "✈️"],

  [1910, "Sydafrikanska unionen bildas", "Fyra brittiska kolonier förenas till en dominion inom det brittiska imperiet.", "world", "🌍"],
  [1911, "Amundsen når Sydpolen", "Den norska expeditionen når Sydpolen före Robert Scotts brittiska expedition.", "science", "🧭"],
  [1912, "Titanic förliser", "Passagerarfartyget sjunker i Nordatlanten efter att ha kolliderat med ett isberg.", "society", "🚢"],
  [1913, "Det löpande bandet införs hos Ford", "Den nya produktionsmetoden gör biltillverkning snabbare och billigare.", "science", "🏭"],
  [1914, "Första världskriget börjar", "Mordet i Sarajevo följs av en europeisk kris som utvecklas till världskrig.", "world", "⚔️"],
  [1915, "Gallipolifälttåget", "Ententen försöker slå ut Osmanska riket och öppna en sjöväg till Ryssland men misslyckas.", "world", "⚔️"],
  [1916, "Påskupproret i Dublin", "Irländska republikaner gör uppror mot brittiskt styre, vilket påverkar vägen mot självständighet.", "world", "✊"],
  [1917, "Ryska revolutionen", "Tsarväldet faller och bolsjevikerna tar makten senare samma år.", "world", "🏛️"],
  [1918, "Första världskriget tar slut", "Vapenstilleståndet den 11 november avslutar striderna på västfronten.", "world", "🕊️"],
  [1919, "Versaillesfreden undertecknas", "Fredsavtalet med Tyskland formar Europas politiska karta efter kriget.", "world", "📜"],

  [1920, "Nationernas förbund börjar arbeta", "Den internationella organisationen skapas för att förebygga framtida krig.", "world", "🌐"],
  [1921, "Insulin används framgångsrikt", "Upptäckten av insulin förändrar diabetes från en ofta dödlig sjukdom till en behandlingsbar.", "science", "💉"],
  [1922, "BBC inleder reguljära radiosändningar", "British Broadcasting Company börjar sända och blir en central medieinstitution.", "culture", "📻"],
  [1923, "Republiken Turkiet utropas", "Mustafa Kemal Atatürk blir president i den nya republiken.", "world", "🏛️"],
  [1924, "De första olympiska vinterspelen", "Chamonix står värd för tävlingarna som senare erkänns som de första vinter-OS.", "sport", "⛷️"],
  [1925, "Locarnofördragen", "Europeiska stater sluter avtal som tillfälligt förbättrar relationerna efter första världskriget.", "world", "🤝"],
  [1926, "Första demonstrationen av television", "John Logie Baird visar ett fungerande mekaniskt televisionssystem i London.", "science", "📺"],
  [1927, "Lindbergh flyger ensam över Atlanten", "Charles Lindbergh genomför den första nonstopflygningen solo mellan New York och Paris.", "science", "✈️"],
  [1928, "Penicillinet upptäcks", "Alexander Fleming observerar möglets antibakteriella effekt, grunden för penicillinbehandling.", "science", "🧫"],
  [1929, "Börskraschen på Wall Street", "Kraschen blir en symbolisk startpunkt för den stora depressionen.", "world", "📉"],

  [1930, "Gandhis saltmarsch", "Mahatma Gandhi leder en protest mot brittisk saltskatt och stärker Indiens självständighetsrörelse.", "society", "✊"],
  [1931, "Empire State Building invigs", "Skyskrapan i New York blir världens högsta byggnad och en symbol för moderniteten.", "culture", "🏙️"],
  [1932, "Amelia Earhart flyger ensam över Atlanten", "Hon blir den första kvinnan att genomföra en soloflygning över Atlanten.", "science", "✈️"],
  [1933, "Hitler blir rikskansler", "Adolf Hitlers utnämning blir avgörande för Nazitysklands framväxt.", "world", "🏛️"],
  [1934, "Det långa knivarnas natt", "Naziregimen mördar politiska motståndare och befäster Hitlers makt.", "world", "⚔️"],
  [1935, "Nürnberglagarna införs", "Nazityskland lagfäster antisemitisk diskriminering och fråntar judar medborgerliga rättigheter.", "society", "📜"],
  [1936, "Olympiska spelen i Berlin", "Naziregimen använder spelen som propaganda, medan Jesse Owens vinner fyra guld.", "sport", "🏅"],
  [1937, "Hindenburgkatastrofen", "Luftskeppet Hindenburg fattar eld vid landning i New Jersey.", "society", "🔥"],
  [1938, "Münchenöverenskommelsen", "Storbritannien och Frankrike accepterar att Tyskland tar Sudetområdet från Tjeckoslovakien.", "world", "📜"],
  [1939, "Andra världskriget börjar", "Tysklands invasion av Polen leder till att Storbritannien och Frankrike förklarar krig.", "world", "⚔️"],

  [1940, "Slaget om Storbritannien", "Brittiskt flyg försvarar landet mot Luftwaffes omfattande flyganfall.", "world", "✈️"],
  [1941, "Attacken mot Pearl Harbor", "Japans attack leder till att USA går in i andra världskriget.", "world", "⚔️"],
  [1942, "Slaget vid Stalingrad börjar", "Det långvariga slaget blir en avgörande vändpunkt på östfronten.", "world", "⚔️"],
  [1943, "Upproret i Warszawas getto", "Judiska motståndsgrupper gör väpnat motstånd mot den nazistiska deportationen.", "society", "✊"],
  [1944, "D-dagen", "De allierade landstiger i Normandie och öppnar en ny front i Västeuropa.", "world", "🪖"],
  [1945, "Andra världskriget tar slut", "Nazityskland kapitulerar i maj och Japan i september efter atombomberna och Sovjets krigsinträde.", "world", "🕊️"],
  [1946, "FN:s första generalförsamling", "Representanter för medlemsländerna möts i London för den första generalförsamlingen.", "world", "🌐"],
  [1947, "Indien blir självständigt", "Brittiska Indien delas i Indien och Pakistan under en våldsam och omfattande migration.", "world", "🌏"],
  [1948, "FN antar deklarationen om mänskliga rättigheter", "Deklarationen fastslår grundläggande rättigheter och friheter för alla människor.", "society", "⚖️"],
  [1949, "Nato bildas", "Tolv länder grundar den nordatlantiska försvarsalliansen.", "world", "🤝"],

  [1950, "Koreakriget börjar", "Nordkorea invaderar Sydkorea och konflikten internationaliseras snabbt.", "world", "⚔️"],
  [1951, "Flyktingkonventionen antas", "FN-konventionen definierar flyktingars rättsliga ställning och skydd.", "society", "⚖️"],
  [1952, "Elizabeth II blir drottning", "Elizabeth efterträder George VI som brittisk monark.", "world", "👑"],
  [1953, "Mount Everest bestigs", "Edmund Hillary och Tenzing Norgay når toppen av världens högsta berg.", "sport", "🏔️"],
  [1954, "Rassegregering i amerikanska skolor underkänns", "USA:s högsta domstol beslutar i Brown mot Board of Education att segregerade skolor strider mot grundlagen.", "society", "⚖️"],
  [1955, "Rosa Parks vägrar lämna sin bussplats", "Händelsen blir en katalysator för bussbojkotten i Montgomery och medborgarrättsrörelsen.", "society", "✊"],
  [1956, "Suezkrisen", "Egyptens nationalisering av Suezkanalen följs av ett anfall från Israel, Storbritannien och Frankrike.", "world", "🚢"],
  [1957, "Sputnik skjuts upp", "Sovjetunionens första konstgjorda satellit markerar början på rymdåldern.", "science", "🛰️"],
  [1958, "NASA grundas", "USA skapar den civila rymdmyndigheten mitt under den växande rymdkapplöpningen.", "science", "🚀"],
  [1959, "Kubanska revolutionen segrar", "Fidel Castros revolutionära rörelse tar makten på Kuba.", "world", "🏛️"],

  [1960, "Afrikas år", "Sjutton afrikanska stater blir självständiga under ett enda år.", "world", "🌍"],
  [1961, "Jurij Gagarin blir första människan i rymden", "Den sovjetiske kosmonauten genomför ett varv runt jorden med Vostok 1.", "science", "🚀"],
  [1962, "Kubakrisen", "USA och Sovjetunionen står nära kärnvapenkrig efter upptäckten av sovjetiska robotar på Kuba.", "world", "☢️"],
  [1963, "Martin Luther Kings tal I Have a Dream", "Talet hålls vid marschen till Washington och blir en symbol för medborgarrättsrörelsen.", "society", "✊"],
  [1964, "Civil Rights Act antas i USA", "Lagen förbjuder diskriminering och segregation inom flera samhällsområden.", "society", "⚖️"],
  [1965, "Första rymdpromenaden", "Aleksej Leonov lämnar sin rymdfarkost och vistas fritt i rymden.", "science", "🧑‍🚀"],
  [1966, "Kulturrevolutionen inleds i Kina", "Mao Zedong mobiliserar en politisk massrörelse med omfattande förföljelser och samhällsomvälvning.", "world", "🏛️"],
  [1967, "Den första hjärttransplantationen", "Christiaan Barnard genomför den första lyckade transplantationen av ett mänskligt hjärta.", "science", "❤️"],
  [1968, "Pragvåren krossas", "Warszawapaktens styrkor invaderar Tjeckoslovakien och stoppar reformförsöken.", "world", "🪖"],
  [1969, "Den första bemannade månlandningen", "Apollo 11 landar på månen och Neil Armstrong blir första människan på månens yta.", "science", "🌕"],

  [1970, "Den första Earth Day", "Miljontals människor deltar i manifestationer som stärker den moderna miljörörelsen.", "society", "🌱"],
  [1971, "Den första kommersiella mikroprocessorn", "Intel 4004 visar hur en centralprocessor kan samlas på ett enda chip.", "science", "💻"],
  [1972, "Watergateinbrottet", "Inbrottet i Demokraternas högkvarter utvecklas till en politisk skandal i USA.", "world", "🏛️"],
  [1973, "Oljekrisen", "Oljeembargot leder till kraftigt stigande energipriser och ekonomisk oro i västvärlden.", "world", "🛢️"],
  [1974, "Richard Nixon avgår", "USA:s president lämnar posten efter Watergateskandalen.", "world", "🏛️"],
  [1975, "Vietnamkriget tar slut", "Saigons fall avslutar kriget och Vietnam återförenas under kommunistiskt styre.", "world", "🕊️"],
  [1976, "Apple grundas", "Steve Jobs, Steve Wozniak och Ronald Wayne startar företaget som blir centralt i persondatorns historia.", "science", "💻"],
  [1977, "Voyager 1 och 2 skjuts upp", "Rymdsonderna inleder en historisk resa genom det yttre solsystemet.", "science", "🛰️"],
  [1978, "Camp David-avtalen", "Egypten och Israel når en överenskommelse som leder till ett fredsavtal.", "world", "🤝"],
  [1979, "Iranska revolutionen", "Shahens styre störtas och Iran blir en islamisk republik.", "world", "🏛️"],

  [1980, "Smittkoppor förklaras utrotade", "WHO meddelar att smittkoppor har utrotats efter en global vaccinationskampanj.", "science", "💉"],
  [1981, "Den första rymdfärjan skjuts upp", "Columbia genomför den första flygningen i NASA:s återanvändbara rymdfärjeprogram.", "science", "🚀"],
  [1982, "Falklandskriget", "Storbritannien och Argentina strider om Falklandsöarna i Sydatlanten.", "world", "⚔️"],
  [1983, "Internet går över till TCP/IP", "Övergången brukar beskrivas som en viktig födelsedag för det moderna internet.", "science", "🌐"],
  [1984, "Den första Macintosh-datorn lanseras", "Apple populariserar grafiskt användargränssnitt och datormus för en bred konsumentmarknad.", "science", "🖥️"],
  [1985, "Live Aid", "De stora välgörenhetskonserterna i London och Philadelphia samlar in pengar till svältkatastrofen i Etiopien.", "culture", "🎸"],
  [1986, "Tjernobylolyckan", "En reaktor exploderar i den sovjetiska kärnkraftsanläggningen och orsakar omfattande radioaktivt nedfall.", "society", "☢️"],
  [1987, "Montrealprotokollet", "Länder enas om att fasa ut ämnen som bryter ned ozonlagret.", "society", "🌍"],
  [1988, "Lockerbieattentatet", "En bomb ombord på Pan Am Flight 103 dödar 270 människor över Lockerbie i Skottland.", "world", "✈️"],
  [1989, "Berlinmuren faller", "Gränsövergångarna öppnas och muren blir symbolen för östblockets sammanbrott.", "world", "🧱"],

  [1990, "Tyskland återförenas", "Öst- och Västtyskland förenas till en stat efter kalla krigets upplösning.", "world", "🤝"],
  [1991, "Sovjetunionen upplöses", "Den sovjetiska staten upphör och femton självständiga republiker växer fram.", "world", "🏛️"],
  [1992, "Maastrichtfördraget undertecknas", "Fördraget lägger grunden för Europeiska unionen och den gemensamma valutan.", "world", "🇪🇺"],
  [1993, "World Wide Web öppnas fritt", "CERN gör webbtekniken tillgänglig utan licensavgifter, vilket bidrar till dess snabba spridning.", "science", "🌐"],
  [1994, "Nelson Mandela blir president", "Sydafrikas första demokratiska val med allmän rösträtt leder till Mandelas presidentskap.", "world", "🗳️"],
  [1995, "Massakern i Srebrenica", "Över 8 000 bosniakiska män och pojkar mördas under Bosnienkriget.", "world", "🕯️"],
  [1996, "Fåret Dolly klonas", "Dolly blir det första däggdjuret som klonas från en vuxen kroppscell.", "science", "🐑"],
  [1997, "Hongkong återlämnas till Kina", "Storbritannien överlämnar territoriet efter mer än 150 års kolonialt styre.", "world", "🌏"],
  [1998, "Långfredagsavtalet", "Avtalet blir en central grund för fredsprocessen i Nordirland.", "world", "🕊️"],
  [1999, "Euron införs elektroniskt", "Den gemensamma europeiska valutan börjar användas för bokföring och elektroniska betalningar.", "world", "💶"],

  [2000, "Det första utkastet till människans genom presenteras", "Human Genome Project offentliggör en arbetsversion av den mänskliga arvsmassan.", "science", "🧬"],
  [2001, "Terrorattackerna den 11 september", "Kapade flygplan används i attacker mot USA och nästan 3 000 människor dödas.", "world", "🕯️"],
  [2002, "Eurosedlar och euromynt börjar användas", "Den nya valutan blir fysisk vardag i tolv europeiska länder.", "world", "💶"],
  [2003, "Irakkriget börjar", "En USA-ledd koalition invaderar Irak och störtar Saddam Husseins regim.", "world", "⚔️"],
  [2004, "Tsunamin i Indiska oceanen", "En mycket kraftig jordbävning utlöser en tsunami som dödar över 200 000 människor.", "society", "🌊"],
  [2005, "YouTube grundas", "Videoplattformen blir snabbt en central del av internetkultur och medielandskap.", "culture", "📹"],
  [2006, "Pluto omklassificeras", "Internationella astronomiska unionen inför definitionen dvärgplanet.", "science", "🔭"],
  [2007, "Den första iPhone-modellen lanseras", "Apples telefon bidrar till att förändra mobiltelefoner och det digitala vardagslivet.", "science", "📱"],
  [2008, "Den globala finanskrisen fördjupas", "Lehman Brothers kollaps blir en symbol för den allvarliga bank- och kreditkrisen.", "world", "📉"],
  [2009, "H1N1-influensan blir pandemi", "WHO klassar spridningen av den nya influensan som en pandemi.", "society", "🦠"],

  [2010, "Arabiska våren inleds", "Protester i Tunisien sprider sig och utlöser en våg av uppror i Nordafrika och Mellanöstern.", "world", "✊"],
  [2011, "Fukushimaolyckan", "En jordbävning och tsunami leder till allvarliga haverier vid kärnkraftverket Fukushima Daiichi.", "society", "☢️"],
  [2012, "Higgsbosonen bekräftas", "CERN meddelar upptäckten av en partikel som stämmer med den länge eftersökta Higgsbosonen.", "science", "⚛️"],
  [2013, "Edward Snowdens avslöjanden", "Läckta dokument visar omfattningen av amerikansk och internationell massövervakning.", "society", "🔐"],
  [2014, "Ebolautbrottet i Västafrika", "Det största kända ebolautbrottet drabbar främst Guinea, Liberia och Sierra Leone.", "society", "🦠"],
  [2015, "Parisavtalet om klimatet", "Nästan alla världens länder enas om ett gemensamt ramverk för att begränsa den globala uppvärmningen.", "society", "🌱"],
  [2016, "Storbritannien röstar för Brexit", "En majoritet röstar för att landet ska lämna Europeiska unionen.", "world", "🗳️"],
  [2017, "Metoo-rörelsen får global spridning", "Vittnesmål om sexuella trakasserier och övergrepp sprids under hashtaggen metoo.", "society", "✊"],
  [2018, "Fotbollslaget räddas ur grottan i Thailand", "Tolv pojkar och deras tränare räddas efter en internationell insats.", "society", "🧗"],
  [2019, "Den första bilden av ett svart hål", "Event Horizon Telescope presenterar en bild av skuggan kring det svarta hålet i galaxen M87.", "science", "🔭"],

  [2020, "Covid-19 klassas som pandemi", "WHO beskriver det globala coronavirusutbrottet som en pandemi och samhällen stänger ned världen över.", "society", "🦠"],
  [2021, "Perseverance landar på Mars", "NASA:s rover landar i Jezerokratern för att söka spår av tidigare liv och samla prover.", "science", "🤖"],
  [2022, "Rysslands fullskaliga invasion av Ukraina", "Ryssland inleder ett storskaligt angrepp som förändrar Europas säkerhetsläge.", "world", "⚔️"],
  [2023, "WHO avslutar det globala covid-nödläget", "WHO meddelar att covid-19 inte längre utgör ett internationellt hot mot människors hälsa på högsta nödnivå.", "society", "🦠"],
  [2024, "Sverige blir medlem i Nato", "Sverige deponerar sitt anslutningsinstrument och blir försvarsalliansens 32:a medlemsland.", "sweden", "🇸🇪"],
  [2025, "WHO:s pandemiavtal antas", "Världshälsoförsamlingen antar ett internationellt avtal för bättre förebyggande och hantering av framtida pandemier.", "society", "🌐"],
];

const topicLabel: Record<HistoryTopic, string> = {
  world: "Världshistoria",
  sweden: "Sveriges historia",
  science: "Vetenskap & teknik",
  culture: "Kultur",
  sport: "Sport",
  society: "Samhälle",
};

export const HISTORY_EVENTS: Song[] = RAW_HISTORY.map(([year, title, summary, historyCategory, icon], index) => ({
  id: `history-${year}-${index}`,
  title,
  artist: topicLabel[historyCategory],
  year,
  decade: `${Math.floor(year / 10) * 10}-talet`,
  category: "pop",
  contentType: "history",
  summary,
  historyCategory,
  icon,
}));

export function getHistoryEvents(category: HistoryCategory): Song[] {
  if (category === "all") return [...HISTORY_EVENTS];
  return HISTORY_EVENTS.filter((event) => event.historyCategory === category);
}

export function getHistoryCategoryCounts(): Record<HistoryCategory, number> {
  return {
    all: HISTORY_EVENTS.length,
    world: HISTORY_EVENTS.filter((event) => event.historyCategory === "world").length,
    sweden: HISTORY_EVENTS.filter((event) => event.historyCategory === "sweden").length,
    science: HISTORY_EVENTS.filter((event) => event.historyCategory === "science").length,
    culture: HISTORY_EVENTS.filter((event) => event.historyCategory === "culture").length,
    sport: HISTORY_EVENTS.filter((event) => event.historyCategory === "sport").length,
    society: HISTORY_EVENTS.filter((event) => event.historyCategory === "society").length,
  };
}