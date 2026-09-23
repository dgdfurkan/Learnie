import {useEffect,useState} from 'react';
import mark from './assets/brand.svg?raw';
import './brand.css';

export function BrandMark({className=''}:{className?:string}){
 return <span className={`brand-mark ${className}`} aria-hidden="true" dangerouslySetInnerHTML={{__html:mark}}/>;
}
export function Brand(){return <><BrandMark/><span className="brand-word">learnie</span></>;}
export function BrandIntro(){
 const [visible,setVisible]=useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches&&!/\/p\//.test(location.pathname));
 useEffect(()=>{const timer=window.setTimeout(()=>setVisible(false),1150);return()=>window.clearTimeout(timer);},[]);
 if(!visible)return null;
 return <div className="brand-intro" aria-hidden="true"><div className="brand-intro-lockup"><BrandMark/><span>learnie</span></div></div>;
}
