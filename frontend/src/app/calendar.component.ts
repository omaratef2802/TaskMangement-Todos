import {CommonModule,DatePipe} from '@angular/common';
import {Component,OnDestroy,OnInit,inject,signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {forkJoin,Subscription} from 'rxjs';
import {ApiService} from './core/api.service';
import {Todo} from './core/models';
interface CalendarCell{date:Date|null;items:Todo[];key:string}
@Component({standalone:true,selector:'app-calendar',imports:[CommonModule,DatePipe,RouterLink],template:`
<div class="page-heading"><div><span class="eyebrow">PLAN AHEAD</span><h1>Calendar</h1><p class="muted">See your deadlines and plan the month ahead.</p></div><a routerLink="/app/tasks" class="btn-primary">View all tasks</a></div>
<section class="surface calendar-surface"><div class="calendar-toolbar"><button class="icon-button" (click)="shiftMonth(-1)"><i class="bi bi-chevron-left"></i></button><h2>{{month()|date:'MMMM yyyy'}}</h2><button class="icon-button" (click)="shiftMonth(1)"><i class="bi bi-chevron-right"></i></button><button class="btn-secondary small" (click)="goToday()">Today</button></div>
<div class="calendar-grid calendar-weekdays">@for(day of weekdays;track day){<div>{{day}}</div>}</div><div class="calendar-grid calendar-days">@for(cell of calendarDays();track cell.key){<button class="calendar-cell" [class.outside]="!cell.date" [class.today]="isToday(cell.date)" [class.selected]="selectedKey()===cell.key" [disabled]="!cell.date" (click)="selectDay(cell)"><span>{{cell.date?.getDate()}}</span>@for(t of cell.items.slice(0,3);track t._id){<small [class]="t.priority">{{t.title}}</small>}@if(cell.items.length>3){<em>+{{cell.items.length-3}} more</em>}</button>}</div>
@if(loading()){<div class="empty-state">Loading calendar…</div>}
</section>
<section class="surface calendar-agenda"><div class="surface-head"><div><h3>{{selectedDate()|date:'EEEE, MMMM d'}}</h3><p class="muted">{{selectedTasks().length}} tasks due</p></div></div>@for(t of selectedTasks();track t._id){<a class="task-row task-row-link" [routerLink]="['/app/tasks',t._id]"><span class="status-mark" [class]="displayStatus(t)"><i class="bi bi-check-lg"></i></span><div class="task-copy"><b>{{t.title}}</b><p>{{t.deadline|date:'shortTime'}} · {{t.category}}</p></div><span class="priority" [class]="t.priority">{{t.priority}}</span></a>}@if(!selectedTasks().length){<div class="empty-state"><i class="bi bi-calendar-check"></i><h3>No tasks due on this day</h3><p>Select another date or add a deadline to a task.</p></div>}</section>`})
export class CalendarComponent implements OnInit,OnDestroy{
 private readonly api=inject(ApiService);readonly tasks=signal<Todo[]>([]);readonly loading=signal(true);readonly month=signal(new Date(new Date().getFullYear(),new Date().getMonth(),1));readonly selectedDate=signal(new Date());readonly selectedKey=signal(this.key(new Date()));readonly weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];private changesSubscription?:Subscription;
 ngOnInit():void{this.load();this.changesSubscription=this.api.todoChanged$.subscribe(()=>this.load());}
 ngOnDestroy():void{this.changesSubscription?.unsubscribe();}
 load():void{this.loading.set(true);forkJoin({mine:this.api.list({page:1,limit:100,sortBy:'deadline',order:'asc'}),assigned:this.api.assignedToMe({page:1,limit:100,sortBy:'deadline',order:'asc'})}).subscribe({next:r=>{const merged=[...r.mine.data,...r.assigned.data];this.tasks.set(merged.filter((t,i)=>!!t.deadline&&merged.findIndex(x=>x._id===t._id)===i));this.loading.set(false);},error:()=>this.loading.set(false)});}
 private currentUserId():string{try{const part=sessionStorage.getItem('todos_access_token')!.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(part.padEnd(Math.ceil(part.length/4)*4,'='))).userId||'';}catch{return '';}}
 displayStatus(todo:Todo):string{const ownerId=typeof todo.userId==='object'?todo.userId._id:String(todo.userId);if(ownerId===this.currentUserId())return todo.status;const entry=todo.assignedStatuses?.find(item=>typeof item.userId==='object'&&item.userId?._id===this.currentUserId());return entry?.status||'not-started';}
 key(d:Date):string{return d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();}
 calendarDays():CalendarCell[]{const first=this.month(),start=new Date(first.getFullYear(),first.getMonth(),1-first.getDay());const cells:CalendarCell[]=[];for(let i=0;i<42;i++){const date=new Date(start.getFullYear(),start.getMonth(),start.getDate()+i);const same=date.getMonth()===first.getMonth();const items=this.tasks().filter(t=>{const x=new Date(t.deadline!);return x.getFullYear()===date.getFullYear()&&x.getMonth()===date.getMonth()&&x.getDate()===date.getDate();});cells.push({date:same?date:null,items,key:this.key(date)});}return cells;}
 selectedTasks():Todo[]{const d=this.selectedDate();return this.tasks().filter(t=>{const x=new Date(t.deadline!);return x.getFullYear()===d.getFullYear()&&x.getMonth()===d.getMonth()&&x.getDate()===d.getDate();}).sort((a,b)=>new Date(a.deadline!).getTime()-new Date(b.deadline!).getTime());}
 selectDay(c:CalendarCell):void{if(c.date){this.selectedDate.set(c.date);this.selectedKey.set(c.key);}}
 shiftMonth(n:number):void{const d=this.month();const next=new Date(d.getFullYear(),d.getMonth()+n,1);this.month.set(next);this.selectedDate.set(next);this.selectedKey.set(this.key(next));}
 goToday():void{const d=new Date();this.month.set(new Date(d.getFullYear(),d.getMonth(),1));this.selectedDate.set(d);this.selectedKey.set(this.key(d));}
 isToday(d:Date|null):boolean{return !!d&&this.key(d)===this.key(new Date());}
}
