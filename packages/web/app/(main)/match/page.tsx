'use client';

import { AtomicArenaCombat, IShuffleRound } from '@wowarenalogs/parser';
import { CombatReport, CombatReportFromStorage } from '@wowarenalogs/shared';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { useLocalCombats } from '../../../hooks/LocalCombatsContext';

// Contiguous rounds of the shuffle lobby the round at `index` belongs to
function shuffleRoundsAround(combats: AtomicArenaCombat[], index: number): IShuffleRound[] {
  const isNextRound = (a: AtomicArenaCombat | undefined, b: AtomicArenaCombat | undefined) =>
    a?.dataType === 'ShuffleRound' && b?.dataType === 'ShuffleRound' && b.sequenceNumber === a.sequenceNumber + 1;
  let start = index;
  while (start > 0 && isNextRound(combats[start - 1], combats[start])) start--;
  let end = index;
  while (end < combats.length - 1 && isNextRound(combats[end], combats[end + 1])) end++;
  return combats.slice(start, end + 1) as IShuffleRound[];
}

function LocalCombatReport({ combats, index }: { combats: AtomicArenaCombat[]; index: number }) {
  const [selectedRound, setSelectedRound] = useState<IShuffleRound | null>(null);
  const combat = selectedRound ?? combats[index];
  return (
    <CombatReport
      combat={combat}
      matchId={combat.id}
      viewerIsOwner={true}
      shuffleRounds={combat.dataType === 'ShuffleRound' ? shuffleRoundsAround(combats, index) : []}
      onRoundSelected={setSelectedRound}
    />
  );
}

export default function MatchPage() {
  const searchParams = useSearchParams();
  const { localCombats } = useLocalCombats();
  const id = searchParams.get('id');
  const viewerIsOwner = searchParams.get('viewerIsOwner');
  const roundId = searchParams.get('roundId');

  if (!id || typeof id !== 'string') {
    return null;
  }

  // Matches parsed from disk this session open without a server round trip
  const localIndex = localCombats.findIndex((c) => c.id === id);

  return (
    <>
      <title>Combat Report | WoW Arena Logs</title>
      {localIndex >= 0 ? (
        <LocalCombatReport key={id} combats={localCombats} index={localIndex} />
      ) : (
        <CombatReportFromStorage
          id={id}
          roundId={roundId ? roundId.toString() : undefined}
          viewerIsOwner={viewerIsOwner === 'true'}
        />
      )}
    </>
  );
}
