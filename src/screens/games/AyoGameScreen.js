import React from 'react';
import { AyoScreen } from '../../games/ayo/AyoScreen';
import { ServerGameShell } from '../../games/ServerGameShell';

export default function AyoGameScreen({ route, navigation }) {
  return <ServerGameShell gameType="ayo" title="Ayo" route={route} navigation={navigation}>
    {({ session, uid, back, multiplayer }) => <AyoScreen
      secondsRemaining={session.secondsRemaining} update={session.update} uid={uid} status={session.status}
      canMove={session.canMove} pending={session.pending}
      onComplete={session.complete}
      onHumanMove={(pitIndex) => session.move({ pitIndex })}
      onBack={back} onRestart={multiplayer ? undefined : session.restart}
    />}
  </ServerGameShell>;
}
