// Original, procedurally generated pad. No recording, sample or third-party track.
export class AmbientSound {
 context:AudioContext;master:GainNode;timer:ReturnType<typeof setInterval>;notes=0;
 constructor(volume:number){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=0;this.master.connect(this.context.destination);this.setVolume(volume);this.tick();this.timer=setInterval(()=>this.tick(),1800);}
 tick(){if(this.context.state!=='running')return;const frequencies=[130.81,164.81,196,246.94,196,164.81];const now=this.context.currentTime;const oscillator=this.context.createOscillator(),gain=this.context.createGain();oscillator.type='sine';oscillator.frequency.value=frequencies[this.notes++%frequencies.length];gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.16,now+1.5);gain.gain.exponentialRampToValueAtTime(.001,now+5.5);oscillator.connect(gain);gain.connect(this.master);oscillator.start(now);oscillator.stop(now+6);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
 setVolume(value:number){this.master.gain.setTargetAtTime(value/100,this.context.currentTime,.3);}
 async play(){await this.context.resume();}
 async pause(){await this.context.suspend();}
 close(){clearInterval(this.timer);void this.context.close();}
}
