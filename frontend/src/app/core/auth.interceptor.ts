import {HttpInterceptorFn} from '@angular/common/http';
export const authInterceptor:HttpInterceptorFn=(request,next)=>{
 const token=sessionStorage.getItem('todos_access_token');
 if(!token||!request.url.includes('/api/'))return next(request);
 return next(request.clone({setHeaders:{Authorization:token}}));
};
