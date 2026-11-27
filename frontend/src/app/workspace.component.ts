import {CommonModule} from '@angular/common';
import {Component,OnDestroy,OnInit,inject,signal} from '@angular/core';
import {Subscription} from 'rxjs';
import {Router,RouterLink,RouterLinkActive,RouterOutlet} from '@angular/router';
import {ApiService} from './core/api.service';
import {SocketService} from './core/socket.service';
import {ThemeService} from './core/theme.service';
import {NotificationItem,User} from './core/models';
@Component({standalone:true,selector:'app-workspace',imports:[CommonModule,RouterOutlet,RouterLink,RouterLinkActive],template:`
<div class="app-shell"><aside class="sidebar" [class.open]="menuOpen()"><a class="brand" routerLink="/app"><span class="brand-mark"><i class="bi bi-check2"></i></span> TaskFlow</a><span class="nav-label">WORKSPACE</span><a class="nav-link" routerLink="/app/organizations" (click)="closeMenu()" routerLinkActive="active"><i class="bi bi-building"></i> Organizations</a>
<a class="nav-link" routerLink="/app" (click)="closeMenu()" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><i class="bi bi-grid"></i> Overview</a>
<a class="nav-link" routerLink="/app/tasks" (click)="closeMenu()" routerLinkActive="active"><i class="bi bi-list-task"></i> Todo</a>
<a class="nav-link" routerLink="/app/assigned" (click)="closeMenu()" routerLinkActive="active"><i class="bi bi-inbox"></i> Assigned to me</a>
<a class="nav-link" routerLink="/app/assigned-by" (click)="closeMenu()" routerLinkActive="active"><i class="bi bi-send"></i> Assigned by me</a>
<span class="nav-label nav-spaced">MY LISTS</span>
<a class="nav-link category-nav-link" routerLink="/app/tasks" [queryParams]="{}" (click)="closeMenu()" [routerLinkActive]="'active'" [routerLinkActiveOptions]="{exact:true}"><i class="bi bi-grid"></i> All categories</a>
@for(item of categories();track item.name){<a class="nav-link category-nav-link" [routerLink]="['/app/tasks']" [queryParams]="{category:item.name}" (click)="closeMenu()"><span class="category-dot"></span><span class="category-name">{{item.name}}</span><span class="nav-count">{{item.count}}</span></a>}
@if(!categories().length){<small class="category-empty">No categories yet</small>}
<a class="nav-link" routerLink="/app/calendar" (click)="closeMenu()" routerLinkActive="active"><i class="bi bi-calendar3"></i> Calendar</a>
<span class="nav-label nav-spaced">PERSONAL</span><a class="nav-link" routerLink="/app/notifications" (click)="closeMenu()" routerLinkActive="active"><i class="bi bi-bell"></i> Notifications @if(unread()){<span class="unread-dot"></span>}</a>
<a class="nav-link" routerLink="/app/trash" (click)="closeMenu()" routerLinkActive="active"><i class="bi bi-trash3"></i> Trash</a>
<a class="nav-link" routerLink="/app/reviews" (click)="closeMenu()" routerLinkActive="active"><i class="bi bi-clipboard-check"></i> Review queue</a>
@if(isAdmin()){<span class="nav-label nav-spaced">ADMINISTRATION</span><a class="nav-link" routerLink="/app/admin" (click)="closeMenu()" routerLinkActive="active"><i class="bi bi-shield-check"></i> Admin panel</a>}
<div class="sidebar-bottom"><a class="profile-link" routerLink="/app/profile" (click)="closeMenu()"><span class="avatar">{{initials()}}</span><span class="profile-copy"><b>{{profile()?.fname}} {{profile()?.lname}}</b><small>{{profile()?.mail}}</small></span><i class="bi bi-chevron-right"></i></a><button class="logout-link" (click)="logout()"><i class="bi bi-box-arrow-right"></i> Sign out</button></div></aside>
<main class="main-area"><header class="topbar"><button class="icon-button mobile-menu" (click)="toggleMenu()"><i class="bi bi-list"></i></button><div class="breadcrumb">Workspace <i class="bi bi-chevron-right"></i> <b>TaskFlow</b></div><div class="topbar-right"><label class="theme-select"><i class="bi bi-circle-half"></i><select [value]="theme.preference()" (change)="theme.set($any($event.target).value)"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label><button class="icon-button notification-button" routerLink="/app/notifications"><i class="bi bi-bell"></i>@if(unread()){<em></em>}</button><a class="top-avatar" routerLink="/app/profile">{{initials()}}</a></div></header><div class="page-content"><router-outlet /></div>
<div class="toast-stack" aria-live="polite" aria-relevant="additions">
@for(toast of toasts();track toast.id){<article class="app-toast">
<button class="toast-open" (click)="openToast(toast)"><span class="toast-icon"><i class="bi bi-bell"></i></span><span class="toast-copy"><b>{{toast.title}}</b><small>{{toast.message}}</small><em>{{toast.todoId&&!['todo_unassigned','todo_deleted'].includes(toast.type)?'Open task':'View notifications'}}</em></span></button>
<button class="toast-dismiss" (click)="dismissToast(toast.id)" aria-label="Dismiss notification"><i class="bi bi-x-lg"></i></button>
</article>}
</div>
</main></div>`})
export class WorkspaceComponent implements OnInit,OnDestroy{
 private readonly api=inject(ApiService);private readonly socket=inject(SocketService);private readonly router=inject(Router);
 readonly theme=inject(ThemeService);readonly profile=signal<User|null>(null);readonly unread=signal(0);readonly menuOpen=signal(false);readonly categories=signal<{name:string;count:number}[]>([]);readonly toasts=signal<{id:number;notificationId:string;title:string;message:string;todoId:string|null;type:string}[]>([]);
 private categoriesSubscription?:Subscription;private todoChangesSubscription?:Subscription;private notificationSubscription?:Subscription;private toastTimers=new Map<number,number>();private toastSequence=0;
 ngOnInit():void{this.api.profile().subscribe({next:r=>this.profile.set(r.data),error:()=>this.logout()});this.refreshUnread();this.refreshCategories();this.categoriesSubscription=this.api.categoriesChanged$.subscribe(()=>this.refreshCategories());this.todoChangesSubscription=this.socket.todoChanged$.subscribe(event=>this.api.notifyTodoChanged(event));
 this.notificationSubscription=this.socket.notification$.subscribe(value=>{this.showNotification(value);this.refreshUnread();this.refreshCategories();});
 const token=sessionStorage.getItem('todos_access_token');if(token)this.socket.connect(token,()=>{this.refreshUnread();this.refreshCategories();});}
 ngOnDestroy():void{this.socket.disconnect();this.categoriesSubscription?.unsubscribe();this.todoChangesSubscription?.unsubscribe();this.notificationSubscription?.unsubscribe();this.toastTimers.forEach(timer=>window.clearTimeout(timer));this.toastTimers.clear();}
 showNotification(value:unknown):void{
  const notification=value as NotificationItem;
  if(!notification||typeof notification.title!=='string')return;
  const todoId=typeof notification.todoId==='object'&&notification.todoId?notification.todoId._id:typeof notification.todoId==='string'?notification.todoId:null;
  const id=++this.toastSequence;
  const toast={id,notificationId:notification._id||'',title:notification.title,message:notification.message||'You have a new update.',todoId,type:notification.type||'info'};
  this.toasts.update(items=>[...items.slice(-3),toast]);
  const timer=window.setTimeout(()=>this.dismissToast(id),6500);
  this.toastTimers.set(id,timer);
 }
 dismissToast(id:number):void{const timer=this.toastTimers.get(id);if(timer)window.clearTimeout(timer);this.toastTimers.delete(id);this.toasts.update(items=>items.filter(item=>item.id!==id));}
 openToast(toast:{id:number;notificationId:string;todoId:string|null;type:string}):void{
  if(toast.notificationId)this.api.markNotificationRead(toast.notificationId).subscribe({next:()=>this.refreshUnread(),error:()=>undefined});
  this.dismissToast(toast.id);
  if(toast.todoId&&!['todo_unassigned','todo_deleted'].includes(toast.type))this.router.navigate(['/app/tasks',toast.todoId]);else this.router.navigateByUrl('/app/notifications');
 }
 toggleMenu():void{this.menuOpen.update(v=>!v);}
 closeMenu():void{this.menuOpen.set(false);}
 isAdmin():boolean{return this.profile()?.role==='Admin';}
 initials():string{const u=this.profile();return u?((u.fname?.[0]||'')+(u.lname?.[0]||'')).toUpperCase():'TF';}
 refreshUnread():void{this.api.unreadCount().subscribe({next:r=>this.unread.set(r.data.unreadCount),error:()=>undefined});}
 refreshCategories():void{this.api.categories().subscribe({next:r=>this.categories.set(r.data||[]),error:()=>this.categories.set([])});}
 logout():void{sessionStorage.removeItem('todos_access_token');this.socket.disconnect();this.router.navigateByUrl('/login');}
}
