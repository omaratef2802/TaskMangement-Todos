import {CanActivateFn,Router} from '@angular/router';
import {inject} from '@angular/core';
export const authGuard:CanActivateFn=()=>sessionStorage.getItem('todos_access_token')?true:inject(Router).createUrlTree(['/login']);
export const guestGuard:CanActivateFn=()=>sessionStorage.getItem('todos_access_token')?inject(Router).createUrlTree(['/app']):true;
export const adminGuard:CanActivateFn=()=>{
 const token=sessionStorage.getItem('todos_access_token');if(!token)return inject(Router).createUrlTree(['/login']);
 try{return JSON.parse(atob(token.split('.')[1])).role==='Admin'?true:inject(Router).createUrlTree(['/app']);}
 catch{return inject(Router).createUrlTree(['/login']);}
};
