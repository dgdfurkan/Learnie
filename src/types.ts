export type Category = 'Tümü' | 'Bilim' | 'Uzay' | 'Sanat' | 'Tarih' | 'Coğrafya' | 'Felsefe' | 'İnanç' | 'Doğa' | 'Teknoloji' | 'Spor' | 'Gündelik' | 'Sağlık' | 'Soru' | 'Finans' | 'Edebiyat';
export interface Slide { title: string; text: string; kicker?: string; }
export interface Source {label:string;url:string}
export interface Post {
 topic?:string; layout?:string;
 motion?:'tennis'|'football'|'bottle'|'orbit'|'geometry'|'art'|'particles'|'wave'|'prism'|'pendulum'|'flow'|'layers'|'network'|'helix'|'growth'|'balance'|'gears'|'mosaic'|'pulse'|'probability';
 id:string; category:Category; title:string; subtitle:string; account:string; handle:string;
 cover:{url:string;alt:string;credit:string;source:string;license:string;licenseUrl?:string;position?:string};
 format:'carousel'|'story'|'experiment'|'perspective'|'reel'; minutes:number; accent:string;
 slides:Slide[]; sources:Source[]; updatedAt:string;
 quiz?:{question:string;options:string[];answer:number;explanation:string};
 experiment?:'pressure'|'light';
 video?:{kind:'youtube'|'file';url:string;title:string;language:string};
 comments:{name:string;text:string}[];
}
export interface Collection {id:string;name:string;postIds:string[];createdAt:string}
export interface UserState {collections:Collection[];read:string[];liked:string[];saved:string[];seen:string[];storySeen:string[];answers:Record<string,number>;comments:Record<string,{text:string;createdAt:string}[]>;name:string;simulation:boolean;}
export type View = 'feed'|'explore'|'reels'|'saved'|'profile';
