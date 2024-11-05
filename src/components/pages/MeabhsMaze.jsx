import React, { useRef, useEffect, useState } from 'react';
import { iniGridArrayScene, scenePause, sysPause } from '../scripts/gridArrayWithThreeJS';

function MeabhsMaze() {
  const mountRef = useRef(null);
  const [ loaded, setLoaded ] = useState(false);
  const [ btnmsg, setbtnmsg ] = useState("Unpause");

  useEffect(() => {
    if (!loaded){
      iniGridArrayScene(mountRef);
      setLoaded(true);
    }
  }, [loaded]);
  
  const togglePauseGrid = () => {
    if ( sysPause ){
      scenePause(false);
      setbtnmsg("Pause");
    } else { 
      scenePause(true);
      setbtnmsg( "Unpause" );
    }
  };

  return (
    <div>
      <div className="bbmThreeScene">
      <div id="bbmThreeScene" ref={mountRef} className="flex flex-wrap w-screen h-screen backdrop-blur-sm"/>
      <button id="pauseBtn" className="pauseBtn bbmBtn" onClick={ togglePauseGrid }>{ btnmsg }</button>
    </div>
    </div>
  );
}

export default MeabhsMaze;
