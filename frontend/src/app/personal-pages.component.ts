import {CommonModule,DatePipe} from '@angular/common';
import {Component,OnDestroy,OnInit,inject,signal} from '@angular/core';
import {Subscription} from 'rxjs';
import {RouterLink} from '@angular/router';
import {ApiService} from './core/api.service';
import {SocketService} from './core/socket.service';
import {NotificationItem,Todo} from './core/models';
@Component({standalone:true,selector:'app-notifications',imports:[CommonModule,DatePipe,RouterLink],template:`
<div class="page-heading"><div><span class="eyebrow">STAY IN THE LOOP</span><h1>Notifications</h1><p class="muted">Updates from the people and tasks you work with.</p></div><div class="heading-actions"><button class="btn-secondary" (click)="markAll()" [disabled]="!unread()">Mark all as read</button><button class="btn-secondary" (click)="clear()" [disabled]="!notes().length">Clear all</button></div></div>
<div class="filter-tabs"><button [class.active]="filter()==='all'" (click)="filter.set('all');page.set(1);load()">All</button><button [class.active]="filter()==='unread'" (click)="filter.set('unread');page.set(1);load()">Unread</button></div>
<section class="surface">@if(loading()){<div class="empty-state">Loading notifications…</div>}@else{@for(n of notes();track n._id){<article class="notification-row" [class.unread]="!n.isRead"><span class="notification-icon"><i class="bi" [class.bi-person-plus]="n.type==='todo_assigned'" [class.bi-chat-left-text]="n.type==='comment_added'" [class.bi-bell]="n.type!=='todo_assigned'&&n.type!=='comment_added'"></i></span><div class="notification-copy"><b>{{n.title}}</b><p>{{n.message}}</p><small>{{n.createdAt|date:'medium'}}</small>@if(n.todoId){<a [routerLink]="['/app/tasks',n.todoId._id]" class="text-button">Open task: {{n.todoId.title}}</a>}</div><div class="notification-actions">@if(!n.isRead){<button class="text-button" (click)="markRead(n)">Mark read</button>}<button class="icon-button" title="Delete notification" (click)="remove(n)"><i class="bi bi-x-lg"></i></button></div></article>}@if(!notes().length){<div class="empty-state"><i class="bi bi-bell-slash"></i><h3>All quiet here</h3><p>New updates will appear here.</p></div>}}</section>
<div class="pagination-bar"><span>{{unread()}} unread notifications</span><div><button class="btn-secondary small" [disabled]="page()<=1" (click)="previousPage()">Previous</button><button class="btn-secondary small" [disabled]="page()>=(pages())" (click)="nextPage()">Next</button></div></div>`})
export class NotificationsComponent implements OnInit,OnDestroy{
 private readonly api=inject(ApiService);private readonly socket=inject(SocketService);private socketSubscription?:Subscription;readonly notes=signal<NotificationItem[]>([]);readonly unread=signal(0);readonly loading=signal(false);readonly filter=signal<'all'|'unread'>('all');readonly page=signal(1);readonly pages=signal(1);
 ngOnInit():void{this.load();this.socketSubscription=this.socket.notification$.subscribe(()=>this.load());}
 ngOnDestroy():void{this.socketSubscription?.unsubscribe();}
 load():void{this.loading.set(true);const q:{page:number;limit:number;isRead?:boolean}={page:this.page(),limit:20};if(this.filter()==='unread')q.isRead=false;this.api.notifications(q).subscribe({next:r=>{this.notes.set(r.data);this.unread.set(r.unreadCount??0);this.pages.set(r.pagination?.totalPages||1);this.loading.set(false);},error:()=>this.loading.set(false)});}
 previousPage():void{if(this.page()>1){this.page.update(v=>v-1);this.load();}}
 nextPage():void{if(this.page()<this.pages()){this.page.update(v=>v+1);this.load();}}
 markRead(n:NotificationItem):void{this.api.markNotificationRead(n._id).subscribe({next:()=>this.load()});}
 markAll():void{this.api.markAllNotificationsRead().subscribe({next:()=>this.load()});}
 remove(n:NotificationItem):void{this.api.deleteNotification(n._id).subscribe({next:()=>this.load()});}
 clear():void{if(!confirm('Delete all your notifications?'))return;this.api.clearNotifications().subscribe({next:()=>this.load()});}
}
@Component({standalone:true,selector:'app-trash',imports:[CommonModule,DatePipe,RouterLink],template:`
<div class="page-heading"><div><span class="eyebrow">RECOVER YOUR WORK</span><h1>Trash</h1><p class="muted">Deleted tasks stay here until you restore or permanently remove them.</p></div></div>
<section class="surface"><div class="surface-head"><div><h3>Recently deleted</h3><p class="muted">{{tasks().length}} tasks in trash</p></div></div>@if(loading()){<div class="empty-state">Loading trash…</div>}@else{@for(t of tasks();track t._id){<article class="task-row"><div class="task-copy"><b>{{t.title}}</b><p>{{t.description||'No description'}}</p><small>Deleted task · Created {{t.createdAt|date:'mediumDate'}}</small></div><button class="btn-secondary small" (click)="restore(t)">Restore</button><button class="text-button danger" (click)="remove(t)">Delete forever</button></article>}@if(!tasks().length){<div class="empty-state"><i class="bi bi-trash3"></i><h3>Trash is empty</h3><p>Tasks you delete will appear here.</p></div>}}</section>`})
export class TrashComponent implements OnInit{
 private readonly api=inject(ApiService);readonly tasks=signal<Todo[]>([]);readonly loading=signal(false);
 ngOnInit():void{this.load();}
 load():void{this.loading.set(true);this.api.trash({page:1,limit:100}).subscribe({next:r=>{this.tasks.set(r.data);this.loading.set(false);},error:()=>this.loading.set(false)});}
 restore(t:Todo):void{this.api.restoreTodo(t._id).subscribe({next:()=>this.load()});}
 remove(t:Todo):void{if(!confirm('Permanently delete this task? This cannot be undone.'))return;this.api.permanentlyDeleteTodo(t._id).subscribe({next:()=>this.load()});}
}
