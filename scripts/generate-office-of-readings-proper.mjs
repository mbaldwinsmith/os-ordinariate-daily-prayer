#!/usr/bin/env node
// Generates Office of Readings first-reading citations for the seasons
// that have NO week number (data/proper-of-seasons/*.json instead of the
// week-based data/office-of-readings/ files): the Triduum, the four days
// between Ash Wednesday and the first Sunday of Lent, and the Christmas
// season. See CONVENTIONS.md for why these are proper-based, and
// SOURCES.md for why a handful of these specific choices (Joel 2 for Ash
// Wednesday, Isaiah 52-53 for Good Friday, Isaiah 9 for Christmas, Isaiah
// 60 for Epiphany, Jeremiah 31 for Holy Innocents) carry noticeably more
// traditional grounding than the systematic week-cycling used elsewhere -
// still "verified": false, since none of it has been checked against a
// primary lectionary text.
//
// Unlike the week-based seasons, these are NOT split Year I/II: the
// schema these files use (schema/proper.schema.json) has no year concept,
// matching how a lot of this content (the Triduum especially) is the same
// every year in real breviaries anyway.
//
// This script also generates Phase 8's proper-of-seasons/-saints
// overrides for solemnities: the Easter octave (data/proper-of-seasons/,
// full hours - it's the only stretch of the year the four-week psalter
// skeleton has zero coverage for, since psalterWeek is 'easter' there),
// a handful of other moveable solemnities (data/proper-of-seasons/,
// first-reading only - Lauds/Vespers/etc. fall back to the ferial
// psalter, which TASKS.md Phase 8 explicitly allows), and a handful of
// fixed-date solemnities (data/proper-of-saints/, first population of
// that directory, also first-reading only). All of it is a representative
// slice, not exhaustive coverage of every solemnity/feast/memorial - the
// rest remains ongoing/incremental work per TASKS.md.
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUTPUT_DIR = fileURLToPath(new URL('../data/proper-of-seasons', import.meta.url));
const SAINTS_OUTPUT_DIR = fileURLToPath(new URL('../data/proper-of-saints', import.meta.url));

const ENTRIES = [
  // The Triduum.
  { key: 'holyThursday', name: 'Holy Thursday', ref: 'Ex 12' },
  { key: 'goodFriday', name: 'Good Friday', ref: 'Is 52' },
  { key: 'holySaturday', name: 'Holy Saturday', ref: 'Lam 3' },

  // Ash Wednesday through the Saturday after (before the 1st Sunday of
  // Lent's numbered weeks begin) - see src/officeOfReadings.ts, which maps
  // these by day-of-week rather than by romcal's celebration key (that key
  // isn't stable here - an occasional commemoration can occupy this
  // Saturday in a given year).
  { key: 'ashWednesday', name: 'Ash Wednesday', ref: 'Jl 2' },
  { key: 'thursdayAfterAshWednesday', name: 'Thursday after Ash Wednesday', ref: 'Dt 30' },
  { key: 'fridayAfterAshWednesday', name: 'Friday after Ash Wednesday', ref: 'Is 58' },
  { key: 'saturdayAfterAshWednesday', name: 'Saturday after Ash Wednesday', ref: 'Am 5' },

  // Christmas season (Dec 25 - Baptism of the Lord). Keyed by romcal's own
  // celebration key; a handful of low-rank ferial days here can
  // occasionally be occupied by an optional memorial not covered below,
  // in which case that day's Office of Readings just isn't populated yet
  // rather than resolving incorrectly - see CONVENTIONS.md.
  { key: 'christmas', name: 'Christmas', ref: 'Is 9' },
  { key: 'saintStephenTheFirstMartyr', name: 'Saint Stephen, the First Martyr', ref: 'Acts 7' },
  { key: 'saintJohnTheApostleAndEvangelist', name: 'Saint John, Apostle and Evangelist', ref: '1 Jn 1' },
  { key: 'holyInnocentsMartyrs', name: 'The Holy Innocents', ref: 'Jer 31' },
  { key: 'holyFamily', name: 'The Holy Family', ref: 'Sir 3' },
  { key: '6thDayInTheOctaveOfChristmas', name: '6th Day in the Octave of Christmas', ref: 'Is 62' },
  { key: 'wednesdayBeforeEpiphany', name: 'Wednesday before Epiphany', ref: '1 Jn 2' },
  { key: 'thursdayBeforeEpiphany', name: 'Thursday before Epiphany', ref: '1 Jn 3' },
  { key: 'fridayBeforeEpiphany', name: 'Friday before Epiphany', ref: '1 Jn 4' },
  { key: 'saturdayBeforeEpiphany', name: 'Saturday before Epiphany', ref: '1 Jn 5' },
  { key: 'maryMotherOfGod', name: 'Mary, Mother of God', ref: 'Nm 6' },
  { key: 'epiphany', name: 'Epiphany', ref: 'Is 60' },
  { key: 'mondayAfterEpiphany', name: 'Monday after Epiphany', ref: 'Is 61' },
  { key: 'tuesdayAfterEpiphany', name: 'Tuesday after Epiphany', ref: 'Is 62' },
  { key: 'wednesdayAfterEpiphany', name: 'Wednesday after Epiphany', ref: 'Is 63' },
  { key: 'thursdayAfterEpiphany', name: 'Thursday after Epiphany', ref: 'Is 64' },
  { key: 'fridayAfterEpiphany', name: 'Friday after Epiphany', ref: 'Is 65' },
  { key: 'saturdayAfterEpiphany', name: 'Saturday after Epiphany', ref: 'Is 66' },
  { key: 'baptismOfTheLord', name: 'The Baptism of the Lord', ref: 'Is 42' },
];

// Other moveable solemnities: first-reading only, ferial psalter fallback
// for the Hours (see TASKS.md Phase 8).
const SOLEMNITY_ENTRIES = [
  { key: 'ascension', name: 'The Ascension of the Lord', ref: 'Eph 1' },
  { key: 'pentecostSunday', name: 'Pentecost Sunday', ref: 'Acts 2' },
  { key: 'trinitySunday', name: 'The Most Holy Trinity', ref: '2 Cor 13' },
  { key: 'corpusChristi', name: 'The Most Holy Body and Blood of Christ', ref: '1 Cor 11' },
  { key: 'sacredHeartOfJesus', name: 'The Most Sacred Heart of Jesus', ref: 'Hos 11' },
  { key: 'christTheKing', name: 'Our Lord Jesus Christ, King of the Universe', ref: 'Dn 7' },
];

// Fixed-date solemnities: first-reading only, same fallback as above. This
// is the first population of data/proper-of-saints/.
const SAINT_ENTRIES = [
  { key: 'josephHusbandOfMary', name: 'Saint Joseph, Husband of the Blessed Virgin Mary', ref: 'Mt 1' },
  { key: 'annunciation', name: 'The Annunciation of the Lord', ref: 'Lk 1' },
  { key: 'birthOfJohnTheBaptist', name: 'The Birth of Saint John the Baptist', ref: 'Is 49' },
  { key: 'peterAndPaulApostles', name: 'Saints Peter and Paul, Apostles', ref: '2 Tm 4' },
  {
    key: 'assumption',
    name: 'The Assumption of the Blessed Virgin Mary',
    ref: 'Rv 12',
    shortReadings: { lauds: 'Is 61:10', daytimePrayer: 'Rv 12:1', vespers: '1 Cor 15:22-23' },
  },
  { key: 'allSaints', name: 'All Saints', ref: 'Rv 7' },
  { key: 'immaculateConception', name: 'The Immaculate Conception of the Blessed Virgin Mary', ref: 'Gn 3' },
];

const sr = (ref) => ({ ref, verified: false });

// Representative proper short readings from the same page-referenced source
// used for the ferial cycle. These override the ferial short reading without
// replacing psalmody. Coverage remains deliberately incremental; see SOURCES.md.
const PROPER_SHORT_READINGS = {
  christmas: { lauds: 'Heb 1:1-4', vespers: '1 Jn 1:1-3' },
};

const EASTER_OCTAVE_SHORT_READINGS = {
  easter: { lauds: 'Acts 10:40-43', vespers: 'Heb 10:12-14' },
  easterMonday: { lauds: 'Rom 10:8-10', vespers: 'Heb 8:1-3' },
  easterTuesday: { lauds: 'Acts 13:30-33', vespers: '1 Pt 2:4-5' },
  easterWednesday: { lauds: 'Rom 6:8-11', vespers: 'Heb 7:24-27' },
  easterThursday: { lauds: 'Rom 8:10-11', vespers: '1 Pt 3:18, 22' },
  easterFriday: { lauds: 'Acts 5:30-32', vespers: 'Heb 5:8-10' },
  easterSaturday: { lauds: 'Rom 14:7-9' },
  divineMercySunday: { vespers: 'Col 1:2-6' },
};

const COMPLINE_SHORT_READINGS = {
  sunday: 'Rv 22:4-5', monday: '1 Thes 5:9-10', tuesday: '1 Pt 5:8-9',
  wednesday: 'Eph 4:26-27', thursday: '1 Thes 5:23', friday: 'Jer 14:9',
  saturday: 'Dt 6:4-7',
};

// Compline is a fixed weekly cycle in the real breviary, independent of the
// psalter week/season - so instead of inventing new Compline psalms for the
// Easter octave, this just mirrors the day-of-week assignment the ferial
// skeleton already uses (see data/psalter/week1/*.json).
const OCTAVE_COMPLINE = {
  sunday: [{ type: 'psalm', ref: 'Ps 91' }],
  monday: [{ type: 'psalm', ref: 'Ps 86' }],
  tuesday: [{ type: 'psalm', ref: 'Ps 143:1-11' }],
  wednesday: [{ type: 'psalm', ref: 'Ps 31:1-6' }],
  thursday: [{ type: 'psalm', ref: 'Ps 16' }],
  friday: [{ type: 'psalm', ref: 'Ps 88' }],
  saturday: [
    { type: 'psalm', ref: 'Ps 4' },
    { type: 'psalm', ref: 'Ps 134' },
  ],
};

// The Easter octave (Easter Sunday through Divine Mercy Sunday) is the one
// stretch of the year the four-week psalter skeleton has *no* entry for at
// all (psalterWeek 'easter' - see src/psalter.ts), so unlike the other
// solemnities above, these need a full set of Hours, not just a first
// reading. Psalms/canticles are a best-effort curated selection of
// traditionally Easter-associated texts (Ps 118 "This is the day", the
// Canticle of Moses at the Red Sea for Easter Sunday Lauds, Acts of the
// Apostles - the traditional Easter-octave Office of Readings book - for
// the first reading each day), not a transcription of an official
// breviary - see SOURCES.md.
const EASTER_OCTAVE_ENTRIES = [
  {
    key: 'easter',
    name: 'Easter Sunday',
    dayOfWeek: 'sunday',
    firstReading: { ref: '1 Cor 15' },
    hours: {
      officeOfReadings: { psalmody: [p('Ps 118'), p('Ps 145'), p('Ps 66')] },
      lauds: {
        psalmody: [p('Ps 118'), c('Ex 15:1-13, 17-18', 'Canticle of Moses'), p('Ps 150')],
      },
      daytimePrayer: { psalmody: [p('Ps 119:145-152'), p('Ps 122'), p('Ps 124')] },
      vespers: { psalmody: [p('Ps 110'), p('Ps 118'), c('Eph 1:3-10')] },
    },
  },
  {
    key: 'easterMonday',
    name: 'Monday within the Octave of Easter',
    dayOfWeek: 'monday',
    firstReading: { ref: 'Acts 1' },
    hours: {
      officeOfReadings: { psalmody: [p('Ps 2'), p('Ps 8'), p('Ps 19')] },
      lauds: { psalmody: [p('Ps 5'), c('1 Chr 29:10-13'), p('Ps 29')] },
      daytimePrayer: { psalmody: [p('Ps 119:153-160'), p('Ps 20'), p('Ps 21')] },
      vespers: { psalmody: [p('Ps 24'), p('Ps 47'), c('Col 1:12-20')] },
    },
  },
  {
    key: 'easterTuesday',
    name: 'Tuesday within the Octave of Easter',
    dayOfWeek: 'tuesday',
    firstReading: { ref: 'Acts 2' },
    hours: {
      officeOfReadings: { psalmody: [p('Ps 33'), p('Ps 40'), p('Ps 46')] },
      lauds: { psalmody: [p('Ps 63'), c('Is 45:15-25'), p('Ps 149')] },
      daytimePrayer: { psalmody: [p('Ps 119:161-168'), p('Ps 34'), p('Ps 37')] },
      vespers: { psalmody: [p('Ps 93'), p('Ps 96'), c('Phil 2:6-11')] },
    },
  },
  {
    key: 'easterWednesday',
    name: 'Wednesday within the Octave of Easter',
    dayOfWeek: 'wednesday',
    firstReading: { ref: 'Acts 3' },
    hours: {
      officeOfReadings: { psalmody: [p('Ps 57'), p('Ps 65'), p('Ps 68')] },
      lauds: { psalmody: [p('Ps 84'), c('1 Sm 2:1-10', 'Canticle of Hannah'), p('Ps 148')] },
      daytimePrayer: { psalmody: [p('Ps 119:169-176'), p('Ps 72'), p('Ps 85')] },
      vespers: { psalmody: [p('Ps 98'), p('Ps 100'), c('1 Pt 2:21-24')] },
    },
  },
  {
    key: 'easterThursday',
    name: 'Thursday within the Octave of Easter',
    dayOfWeek: 'thursday',
    firstReading: { ref: 'Acts 4' },
    hours: {
      officeOfReadings: { psalmody: [p('Ps 89'), p('Ps 105'), p('Ps 111')] },
      lauds: { psalmody: [p('Ps 30'), c('Dt 32:1-12'), p('Ps 146')] },
      daytimePrayer: { psalmody: [p('Ps 121'), p('Ps 123'), p('Ps 125')] },
      vespers: { psalmody: [p('Ps 114'), p('Ps 115'), c('Rv 4:11, 5:9-10, 5:12')] },
    },
  },
  {
    key: 'easterFriday',
    name: 'Friday within the Octave of Easter',
    dayOfWeek: 'friday',
    firstReading: { ref: 'Acts 5' },
    hours: {
      officeOfReadings: { psalmody: [p('Ps 116'), p('Ps 118'), p('Ps 138')] },
      lauds: { psalmody: [p('Ps 36'), c('Tb 13:1-8'), p('Ps 147')] },
      daytimePrayer: { psalmody: [p('Ps 126'), p('Ps 127'), p('Ps 128')] },
      vespers: { psalmody: [p('Ps 116'), p('Ps 117'), c('Rv 11:17-18, 12:10-12')] },
    },
  },
  {
    key: 'easterSaturday',
    name: 'Saturday within the Octave of Easter',
    dayOfWeek: 'saturday',
    firstReading: { ref: 'Acts 6' },
    hours: {
      officeOfReadings: { psalmody: [p('Ps 145'), p('Ps 148'), p('Ps 149')] },
      lauds: { psalmody: [p('Ps 92'), c('Jdt 16:2-3, 13-15'), p('Ps 150')] },
      daytimePrayer: { psalmody: [p('Ps 129'), p('Ps 130'), p('Ps 131')] },
      vespers: { psalmody: [p('Ps 111'), p('Ps 112'), c('Eph 1:3-10')] },
    },
  },
  {
    key: 'divineMercySunday',
    name: 'Divine Mercy Sunday (2nd Sunday of Easter)',
    dayOfWeek: 'sunday',
    firstReading: { ref: 'Jn 20' },
    hours: {
      officeOfReadings: { psalmody: [p('Ps 118'), p('Ps 145'), p('Ps 150')] },
      lauds: { psalmody: [p('Ps 93'), { type: 'canticle', fixedId: 'benedicite' }, p('Ps 150')] },
      daytimePrayer: { psalmody: [p('Ps 119:33-40'), p('Ps 133'), p('Ps 135')] },
      vespers: { psalmody: [p('Ps 122'), p('Ps 133'), c('Col 1:12-20')] },
    },
  },
];

function p(ref) {
  return { type: 'psalm', ref };
}

function c(scriptureRef, name) {
  return name ? { type: 'canticle', scriptureRef, name } : { type: 'canticle', scriptureRef };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(SAINTS_OUTPUT_DIR, { recursive: true });

  for (const { key, name, ref } of ENTRIES) {
    const shortReadings = PROPER_SHORT_READINGS[key];
    const content = {
      key,
      verified: false,
      name,
      firstReading: { ref },
      ...(shortReadings && {
        hours: Object.fromEntries(
          Object.entries(shortReadings).map(([hourName, readingRef]) => [hourName, { shortReading: sr(readingRef) }]),
        ),
      }),
    };
    await writeFile(`${OUTPUT_DIR}/${key}.json`, JSON.stringify(content, null, 2) + '\n');
  }

  for (const { key, name, ref } of SOLEMNITY_ENTRIES) {
    const content = {
      key,
      verified: false,
      name,
      firstReading: { ref },
    };
    await writeFile(`${OUTPUT_DIR}/${key}.json`, JSON.stringify(content, null, 2) + '\n');
  }

  for (const { key, name, ref, shortReadings } of SAINT_ENTRIES) {
    const content = {
      key,
      verified: false,
      name,
      firstReading: { ref },
      ...(shortReadings && {
        hours: Object.fromEntries(
          Object.entries(shortReadings).map(([hourName, readingRef]) => [hourName, { shortReading: sr(readingRef) }]),
        ),
      }),
    };
    await writeFile(`${SAINTS_OUTPUT_DIR}/${key}.json`, JSON.stringify(content, null, 2) + '\n');
  }

  for (const { key, name, dayOfWeek, firstReading, hours } of EASTER_OCTAVE_ENTRIES) {
    const shortReadings = EASTER_OCTAVE_SHORT_READINGS[key] ?? {};
    const hoursWithReadings = Object.fromEntries(
      Object.entries(hours).map(([hourName, hour]) => [
        hourName,
        { ...hour, ...(shortReadings[hourName] && { shortReading: sr(shortReadings[hourName]) }) },
      ]),
    );
    const content = {
      key,
      verified: false,
      name,
      firstReading,
      hours: {
        ...hoursWithReadings,
        compline: {
          psalmody: OCTAVE_COMPLINE[dayOfWeek],
          shortReading: sr(COMPLINE_SHORT_READINGS[dayOfWeek]),
        },
      },
    };
    await writeFile(`${OUTPUT_DIR}/${key}.json`, JSON.stringify(content, null, 2) + '\n');
  }

  const total = ENTRIES.length + SOLEMNITY_ENTRIES.length + SAINT_ENTRIES.length + EASTER_OCTAVE_ENTRIES.length;
  console.log(
    `Wrote ${ENTRIES.length + SOLEMNITY_ENTRIES.length + EASTER_OCTAVE_ENTRIES.length} proper Office of Readings files to ${OUTPUT_DIR} ` +
      `and ${SAINT_ENTRIES.length} to ${SAINTS_OUTPUT_DIR} (${total} total).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
