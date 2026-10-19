'use client';

import { CombatStubList, LoadingScreen, useAuth } from '@wowarenalogs/shared';
import { LocalRemoteHybridCombat } from '@wowarenalogs/shared/src/components/CombatStubList/rows';
import { QuerryError } from '@wowarenalogs/shared/src/components/common/QueryError';
import { SignInPromotion } from '@wowarenalogs/shared/src/components/common/SignInPromotion';
import { useGetMyMatchesQuery } from '@wowarenalogs/shared/src/graphql/__generated__/graphql';
import _ from 'lodash';
import { useMemo } from 'react';
import { TbLoader } from 'react-icons/tb';

import { useLocalCombats } from '../../../hooks/LocalCombatsContext';

export default function HistoryPage() {
  const { isLoadingAuthData, isAuthenticated } = useAuth();
  const matchesQuery = useGetMyMatchesQuery();
  const { localCombats } = useLocalCombats();

  const hybridCombats = useMemo(() => {
    if (isLoadingAuthData) {
      return [];
    }

    const remoteCombats = matchesQuery.data?.myMatches?.combats || [];
    const remoteIds = new Set(remoteCombats.map((c) => c.id));
    // Dev servers have no uploads, so list matches parsed from disk this session too
    const unsyncedLocalCombats =
      process.env.NODE_ENV === 'development' ? localCombats.filter((c) => !remoteIds.has(c.id)) : [];
    return _.orderBy(
      [
        ...remoteCombats.map((c) => ({
          isLocal: false,
          isShuffle: c.__typename === 'ShuffleRoundStub',
          match: c,
        })),
        ...unsyncedLocalCombats.map((c) => ({
          isLocal: true,
          isShuffle: c.dataType === 'ShuffleRound',
          match: c,
        })),
      ] as LocalRemoteHybridCombat[],
      (c) => c.match.startTime,
      ['desc'],
    );
  }, [matchesQuery.data, isLoadingAuthData, localCombats]);

  if (isLoadingAuthData) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <SignInPromotion />;
  }

  return (
    <div className="transition-all px-2 overflow-y-auto">
      <div className="animate-fadein mt-2">
        <CombatStubList viewerIsOwner={true} combats={hybridCombats} source="history" />
      </div>
      {matchesQuery.loading && (
        <div className="flex flex-row items-center justify-center animate-loader h-[300px]">
          <TbLoader color="gray" size={60} className="animate-spin-slow" />
        </div>
      )}
      <QuerryError query={matchesQuery} />
    </div>
  );
}
