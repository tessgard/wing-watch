import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterBirdsForCompetition,
  parseCompetitionQuery,
  projectBirdCount,
  projectLeaderboard,
} from './competition';

const australianBirds = [
  { id: 'au-1', name: "Abbott's Booby (Papasula abbotti)" },
  { id: 'au-2', name: 'Adelie Penguin (Pygoscelis adeliae)' },
  { id: 'au-3', name: "Albert's Lyrebird (Menura alberti)" },
  { id: 'au-4', name: 'Aleutian Tern (Onychoprion aleuticus)' },
  { id: 'au-5', name: 'American Golden Plover (Pluvialis dominica)' },
];

const nonAustralianBird = {
  id: 'world-1',
  name: 'Northern Cardinal (Cardinalis cardinalis)',
};

test('missing competition defaults to Australia and invalid values are rejected', () => {
  assert.equal(parseCompetitionQuery(undefined), 'australia');
  assert.equal(parseCompetitionQuery('worldwide'), 'worldwide');
  assert.throws(() => parseCompetitionQuery('global'), /Unsupported competition/);
});

test('canonical Australian sightings are eligible in both competitions', () => {
  const [bird] = australianBirds;

  assert.deepEqual(filterBirdsForCompetition([bird], 'australia'), [bird]);
  assert.deepEqual(filterBirdsForCompetition([bird], 'worldwide'), [bird]);
});

test('Australian eligibility survives a common-name change when the scientific name matches', () => {
  const renamedBird = {
    id: 'renamed',
    name: 'Renamed Magpie (Gymnorhina tibicen)',
  };

  assert.deepEqual(filterBirdsForCompetition([renamedBird], 'australia'), [renamedBird]);
});

test('Australian and worldwide counts filter the same stored sightings by scope', () => {
  const birds = [...australianBirds, nonAustralianBird];

  assert.equal(projectBirdCount(birds, 'australia'), 5);
  assert.equal(projectBirdCount(birds, 'worldwide'), 6);
});

test('Australian profile filtering returns a list and count that agree', () => {
  const birds = [...australianBirds, nonAustralianBird];
  const birdList = filterBirdsForCompetition(birds, 'australia');

  assert.equal(birdList.length, 5);
  assert.equal(projectBirdCount(birds, 'australia'), birdList.length);
  assert.ok(birdList.every((bird) => bird.id.startsWith('au-')));
});

test('worldwide profiles preserve every stored bird exactly once', () => {
  const birds = [
    { id: 'a', name: 'Australian Magpie (Gymnorhina tibicen)' },
    { id: 'b', name: 'Northern Cardinal (Cardinalis cardinalis)' },
  ];

  assert.deepEqual(filterBirdsForCompetition(birds, 'worldwide'), birds);
});

test('leaderboard ranks by descending eligible count and returns the top ten', () => {
  const users = Array.from({ length: 12 }, (_, index) => ({
    username: `user-${index}`,
    birds: [
      ...Array.from({ length: index }, (__, birdIndex) => ({
        name: `Historical name ${birdIndex} (Papasula abbotti)`,
      })),
      nonAustralianBird,
    ],
  }));

  const leaderboard = projectLeaderboard(users, 'australia');

  assert.equal(leaderboard.length, 10);
  assert.deepEqual(
    leaderboard.map((entry) => entry.birdCount),
    [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
  );
});

test('worldwide-only sightings produce zero Australian leaderboard points', () => {
  const leaderboard = projectLeaderboard(
    [
      { username: 'world-birder', birds: [nonAustralianBird] },
      { username: 'australian-birder', birds: [australianBirds[0]] },
    ],
    'australia'
  );

  assert.deepEqual(leaderboard, [
    { username: 'australian-birder', birdCount: 1 },
    { username: 'world-birder', birdCount: 0 },
  ]);
});
