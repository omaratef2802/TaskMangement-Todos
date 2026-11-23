import {Injectable,signal} from '@angular/core';
export type ThemePreference='light'|'dark'|'system';
@Injectable({providedIn:'root'})
export class ThemeService{
 readonly preference=signal<ThemePreference>((localStorage.getItem('todos_theme') as ThemePreference)||'system');
 constructor(){this.apply();if(typeof window!=='undefined')window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(this.preference()==='system')this.apply();});}
 set(value:ThemePreference):void{this.preference.set(value);localStorage.setItem('todos_theme',value);this.apply();}
 private apply():void{const dark=this.preference()==='dark'||(this.preference()==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset['theme']=dark?'dark':'light';}
}
