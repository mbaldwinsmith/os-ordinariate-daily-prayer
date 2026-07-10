#!/usr/bin/env node
// Generates the three antiphon data files added in the Phase 9 revisit (see
// TASKS.md and SOURCES.md):
//
//  - data/texts/invitatoryAntiphons.json - the antiphon said before the
//    Venite/Jubilate at the start of the day's first Hour. Transcribed from
//    `blocher/dailyoffice2019` (MIT-licensed; the same repo/commit already
//    used for data/texts/fixedCanticles.json), specifically the
//    `MPInvitatory.antiphon` logic in site/office/morning_prayer.py.
//  - data/texts/oAntiphons.json - the "O Antiphons" attached to the
//    Magnificat at Vespers, Dec 16-23 (the Sarum/English 8-antiphon
//    tradition, adding "O Virgo virginum" for Dec 23 to the Roman
//    tradition's 7). Same source, `EPCanticle1.get_antiphon` in
//    site/office/evening_prayer.py.
//  - data/texts/marianAntiphons.json - the four seasonal Marian antiphons
//    said at the end of Compline. Transcribed from
//    `DivinumOfficium/divinum-officium`'s English text file
//    web/www/horas/English/Psalterium/Mariaant.txt. Unlike the two files
//    above, this repository carries no explicit license file, and - more to
//    the point - even a clearly-licensed repository doesn't establish the
//    copyright status of a *translation* it happens to host (distinct from
//    the ancient Latin original's public-domain status). The wording here
//    matches long-attested traditional English translations found in many
//    older hymnals, but that's corroboration, not verification - every
//    entry is explicitly "verified": false pending a source with clearer
//    provenance, exactly as flagged in SOURCES.md for other unverified
//    content in this app.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DAILYOFFICE2019_COMMIT = '53e4a3a09418324b590d3f636ad9d6678b245e16';
const DIVINUM_OFFICIUM_COMMIT = 'e52d8ba49ef3f6b3aaf73e190c5f9f51add2a535';

const INVITATORY_PATH = fileURLToPath(new URL('../data/texts/invitatoryAntiphons.json', import.meta.url));
const O_ANTIPHONS_PATH = fileURLToPath(new URL('../data/texts/oAntiphons.json', import.meta.url));
const MARIAN_PATH = fileURLToPath(new URL('../data/texts/marianAntiphons.json', import.meta.url));

// Transcribed directly from `blocher/dailyoffice2019` at the commit above,
// site/office/morning_prayer.py's MPInvitatory.antiphon method.
const INVITATORY_ANTIPHONS = {
  weekdayGroups: {
    sunWedSat: { firstLine: 'The earth is the Lord’s for he made it:', secondLine: 'O come, let us adore him.' },
    monThu: { firstLine: 'Worship the Lord in the beauty of holiness:', secondLine: 'O come, let us adore him.' },
    tueFri: { firstLine: 'The mercy of the Lord is everlasting:', secondLine: 'O come, let us adore him.' },
  },
  seasons: {
    advent: { firstLine: 'Our King and Savior now draws near:', secondLine: 'O come, let us adore him.' },
    christmasBeforeEpiphany: { firstLine: 'Alleluia, to us a child is born:', secondLine: 'O come, let us adore him.' },
    christmasAfterEpiphany: { firstLine: 'The Lord has shown forth his glory:', secondLine: 'O come, let us adore him.' },
    lentAndTriduum: { firstLine: 'The Lord is full of compassion and mercy:', secondLine: 'O come, let us adore him.' },
    // dailyoffice2019's Eastertide default; Ascension/Pentecost/Easter Day
    // itself have their own entries below under `celebrations`.
    easter: { firstLine: 'Alleluia. The Lord is risen indeed:', secondLine: 'O come, let us adore him.' },
  },
  // Keyed by romcal's celebrationKey - checked before the season/weekday
  // defaults above. "The Lord is glorious in his saints" is dailyoffice2019's
  // generic Holy Day antiphon (its own source excludes a handful of feasts -
  // Circumcision, Visitation, Holy Cross, Holy Innocents - none of which are
  // solemnities/feasts with their own romcal celebrationKey override here
  // anyway, so they simply fall through to their season default instead,
  // matching the source's behavior).
  celebrations: {
    presentationOfTheLord: { firstLine: 'The Word was made flesh and dwelt among us:', secondLine: 'O come, let us adore him.' },
    annunciation: { firstLine: 'The Word was made flesh and dwelt among us:', secondLine: 'O come, let us adore him.' },
    pentecostSunday: { firstLine: 'Alleluia. The Spirit of the Lord renews the face of the earth:', secondLine: 'O come, let us adore him.' },
    trinitySunday: { firstLine: 'Father, Son, and Holy Spirit, one God:', secondLine: 'O come, let us adore him.' },
    ascension: { firstLine: 'Alleluia. Christ the Lord has ascended into heaven:', secondLine: 'O come, let us adore him.' },
    transfiguration: { firstLine: 'The Lord has shown forth his glory:', secondLine: 'O come, let us adore him.' },
    allSaints: { firstLine: 'The Lord is glorious in his saints:', secondLine: 'O come, let us adore him.' },
    josephHusbandOfMary: { firstLine: 'The Lord is glorious in his saints:', secondLine: 'O come, let us adore him.' },
    peterAndPaulApostles: { firstLine: 'The Lord is glorious in his saints:', secondLine: 'O come, let us adore him.' },
    assumption: { firstLine: 'The Lord is glorious in his saints:', secondLine: 'O come, let us adore him.' },
    immaculateConception: { firstLine: 'The Lord is glorious in his saints:', secondLine: 'O come, let us adore him.' },
    birthOfJohnTheBaptist: { firstLine: 'The Lord is glorious in his saints:', secondLine: 'O come, let us adore him.' },
    corpusChristi: { firstLine: 'The Lord is glorious in his saints:', secondLine: 'O come, let us adore him.' },
    sacredHeartOfJesus: { firstLine: 'The Lord is glorious in his saints:', secondLine: 'O come, let us adore him.' },
    christTheKing: { firstLine: 'The Lord is glorious in his saints:', secondLine: 'O come, let us adore him.' },
  },
};

// Transcribed directly from `blocher/dailyoffice2019` at the commit above,
// site/office/evening_prayer.py's EPCanticle1.get_antiphon method.
const O_ANTIPHONS = {
  '16': {
    latin: 'O Sapientia, quae ex ore Altissimi prodiisti, attingens a fine usque ad finem, fortiter suaviterque disponens omnia: veni ad docendum nos viam prudentiae.',
    english: 'O Wisdom, who came from the mouth of the Most High, reaching from end to end and ordering all things mightily and sweetly: come, and teach us the way of prudence.',
    hymn: 'O come, thou Wisdom from on high who orderest all things mightily; to us the path of knowledge show, and teach us in her ways to go. Rejoice! Rejoice! Emmanuel shall come to thee, O Israel.',
    citation: 'Isaiah 11:2-3, 28:29',
  },
  '17': {
    latin: 'O Adonai, et Dux domus Israel, qui Moysi in igne flammae rubi apparuisti, et ei in Sina legem dedisti: veni ad redimendum nos in brachio extento.',
    english: 'O Lord and Ruler the house of Israel, who appeared to Moses in the flame of the burning bush and gave him the law on Sinai: come, and redeem us with outstretched arms.',
    hymn: "O come, O come, thou Lord of might, who to thy tribes on Sinai's height in ancient times didst give the law, in cloud, and majesty, and awe. Rejoice! Rejoice! Emmanuel shall come to thee, O Israel.",
    citation: 'Isaiah 11:4-5, 33:22',
  },
  '18': {
    latin: 'O Radix Jesse, qui stas in signum populorum, super quem continebunt reges os suum, quem Gentes deprecabuntur: veni ad liberandum nos, jam noli tardare.',
    english: 'O Root of Jesse, that stands for an ensign of the people, before whom the kings keep silence and unto whom the Gentiles shall make supplication: come, to deliver us, and tarry not.',
    hymn: "O come, through Branch of Jesse's tree, free them from Satan's tyranny that trust thy mighty power to save, and give them victory oer' the grave. Rejoice! Rejoice! Emmanuel shall come to thee, O Israel.",
    citation: 'Isaiah 11:1, 10',
  },
  '19': {
    latin: 'O clavis David, et sceptrum domus Israel: qui aperis, et nemo claudit; claudis, et nemo aperit: veni, et educ vinctum de domo carceris, sedentem in tenebris.',
    english: 'O Key of David, and scepter of the house of Israel, who opens and no man shuts, who shuts and no man opens: come, and lead forth the captive who sits in the shadows from his prison.',
    hymn: 'O come, though Key of David, come, and open wide our heavenly home; make safe the way that leads on high, and close the path to misery. Rejoice! Rejoice! Emmanuel shall come to thee, O Israel.',
    citation: 'Isaiah 9:6, 22:22.',
  },
  '20': {
    latin: 'O Oriens, splendor lucis æternæ, et sol justitiæ: veni, et illumina sedentes in tenebris, et umbra mortis.',
    english: 'O dawn of the east, brightness of light eternal, and sun of justice: come, and enlighten those who sit in darkness and in the shadow of death.',
    hymn: "O come, thou Dayspring from on high, and cheer us by thy drawing night; disperse the gloomy clouds of night, and death's dark shadow put to flight. Rejoice! Rejoice! Emmanuel shall come to thee, O Israel.",
    citation: 'Isaiah 9:2',
  },
  '21': {
    latin: 'O Rex Gentium, et desideratus earum, lapisque angularis, qui facis utraque unum: veni, et salva hominem, quem de limo formasti.',
    english: 'O King of the gentiles and their desired One, the cornerstone that makes both one: come, and deliver man, whom you formed out of the dust of the earth.',
    hymn: 'O come, Desire of nations, bind in one the hearts of all mankind; bid thou our sad divisions cease, and be thyself our King of Peace. Rejoice! Rejoice! Emmanuel shall come to thee, O Israel.',
    citation: 'Isaiah 2:4, 9:7',
  },
  '22': {
    latin: 'O Emmanuel, Rex et legifer noster, exspectatio gentium, et Salvator earum: veni ad salvandum nos Domine Deus noster.',
    english: 'O Emmanuel, God with us, our King and lawgiver, the expected of the nations and their Savior: come to save us, O Lord our God.',
    hymn: 'O come, O come, Emmanuel, and ransom captive Israel, that mourns in lonley exile here until the Sod of God appear. Rejoice! Rejoice! Emmanuel shall come to thee, O Israel.',
    citation: 'Isaiah 7:14',
  },
  '23': {
    latin: 'O Virgo virginum, quomodo fiet istud? Quia nec primam similem visa es nec habere sequentem. Filiae Jerusalem, quid me admiramini? Divinum est mysterium hoc quod cernitis.',
    english: 'O Virgin of virgins, how shall this be? For neither before you was any like you, nor shall there be after. Daughters of Jerusalem, why do you marvel at me? The thing which you behold is a divine mystery.',
    hymn: "O Virgin great! How shall this be? For none before nor hence were like to thee; Why, Salem's daughters, marvel ye? Behold, a heav'nly mystery! Rejoice! Rejoice! Emmanuel shall come to thee, O Israel.",
    citation: '',
  },
};

// Transcribed directly from `DivinumOfficium/divinum-officium` at the commit
// above, web/www/horas/English/Psalterium/Mariaant.txt. All four
// deliberately "verified": false - see the file header comment above and
// SOURCES.md.
const MARIAN_ANTIPHONS = {
  almaRedemptorisMater: {
    name: 'Alma Redemptoris Mater',
    english:
      "Mother of Christ, hear thou thy people's cry, Star of the deep and Portal of the sky! Mother of Him who thee from nothing made. Sinking we strive and call to thee for aid: O, by what joy which Gabriel brought to thee, Thou Virgin first and last, let us thy mercy see.",
    verified: false,
  },
  aveReginaCaelorum: {
    name: 'Ave Regina Caelorum',
    english:
      "Hail, O Queen of heaven, enthroned! Hail, by Angels Mistress owned! Root of Jesse, Gate of morn, Whence the world's true Light was born: Glorious Virgin, joy to thee, Loveliest whom in heaven they see: Fairest thou, where all are fair, Plead with Christ our sins to spare.",
    verified: false,
  },
  reginaCaeli: {
    name: 'Regina Caeli',
    english:
      'O Queen of heaven rejoice! alleluia: For He whom thou didst merit to bear, alleluia, Hath arisen as he said, alleluia. Pray for us to God, alleluia.',
    verified: false,
  },
  salveRegina: {
    name: 'Salve Regina',
    english:
      'Hail holy Queen, Mother of Mercy, our life, our sweetness, and our hope. To thee do we cry, poor banished children of Eve. To thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious Advocate, thine eyes of mercy toward us. And after this our exile show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary.',
    verified: false,
  },
};

async function main() {
  await writeFile(INVITATORY_PATH, JSON.stringify(INVITATORY_ANTIPHONS, null, 2) + '\n');
  await writeFile(O_ANTIPHONS_PATH, JSON.stringify(O_ANTIPHONS, null, 2) + '\n');
  await writeFile(MARIAN_PATH, JSON.stringify(MARIAN_ANTIPHONS, null, 2) + '\n');
  console.log(`Wrote ${INVITATORY_PATH}, ${O_ANTIPHONS_PATH}, and ${MARIAN_PATH}.`);
  console.log(`(dailyoffice2019 @ ${DAILYOFFICE2019_COMMIT}, divinum-officium @ ${DIVINUM_OFFICIUM_COMMIT})`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
