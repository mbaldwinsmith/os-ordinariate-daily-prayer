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
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const OUTPUT_DIR = fileURLToPath(new URL('../data/proper-of-seasons', import.meta.url));

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

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const { key, name, ref } of ENTRIES) {
    const content = {
      key,
      verified: false,
      name,
      firstReading: { ref },
    };
    await writeFile(`${OUTPUT_DIR}/${key}.json`, JSON.stringify(content, null, 2) + '\n');
  }

  console.log(`Wrote ${ENTRIES.length} proper Office of Readings files to ${OUTPUT_DIR}.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
