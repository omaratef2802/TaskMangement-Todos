import {CanActivateFn,Router} from '@angular/router';
import {inject} from '@angular/core';
export const authGuard:CanActivateFn=()=>sessionStorage.getItem('todos_access_token')?true:inject(Router).createUrlTree(['/login']);
export const guestGuard:CanActivateFn=()=>sessionStorage.getItem('todos_access_token')?inject(Router).createUrlTree(['/app']):true;
export const adminGuard:CanActivateFn=()=>{
 const token=sessionStorage.getItem('todos_access_token');if(!token)return inject(Router).createUrlTree(['/login']);
 try{const part=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');const payload=JSON.parse(atob(part));return payload.role==='Admin'?true:inject(Router).createUrlTree(['/app']);}
 catch{return inject(Router).createUrlTree(['/login']);}
};
