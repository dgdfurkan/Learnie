import {Component,type ReactNode} from 'react';

// An open tab can still reference a lazy chunk from a previous Pages release.
// Keep a usable recovery screen when that file is no longer on the server.
export default class AppBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){
  if(!this.state.failed)return this.props.children;
  return <main className="app-recovery" role="alert"><h1>Bir daha deneyelim.</h1><p>Bu ekran yüklenemedi. Güncel sürümü açarak devam edebilirsin; kaydettiklerin bu cihazda kalır.</p><button onClick={()=>{const url=new URL(location.href);url.searchParams.set('release',String(Date.now()));location.replace(url.href);}}>Learnie’yi yeniden aç</button></main>;
 }
}

/** Contains a failure inside one screen (for example Reels) so the rest of the app keeps working. */
export class ScreenBoundary extends Component<{children:ReactNode;onReset:()=>void},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 componentDidCatch(){setTimeout(()=>{this.props.onReset();this.setState({failed:false});},0);}
 render(){return this.state.failed?null:this.props.children;}
}
