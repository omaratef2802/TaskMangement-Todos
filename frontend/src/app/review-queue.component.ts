import {CommonModule,DatePipe} from '@angular/common';
import {Component,OnInit,inject,signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ApiService} from './core/api.service';
import {Todo} from './core/models';

@Component({
 standalone:true,
 selector:'app-review-queue',
 imports:[CommonModule,DatePipe,RouterLink],
 template:`
 <div class="page-heading"><div><span class="eyebrow">ADMINISTRATION</span><h1>Review queue</h1><p class="muted">Tasks submitted by teammates and waiting for your decision.</p></div><button class="btn-secondary small" (click)="load()"><i class="bi bi-arrow-clockwise"></i> Refresh</button></div>
 @if(error()){<div class="alert-error">{{error()}}</div>}
 <section class="surface">
  <div class="surface-head"><div><h3>Pending reviews</h3><p class="muted">{{tasks().length}} task(s) waiting for approval</p></div></div>
  @if(loading()){<div class="empty-state">Loading review queue…</div>}
  @else if(!tasks().length){<div class="empty-state"><i class="bi bi-check2-circle"></i><h3>All caught up</h3><p>There are no tasks waiting for review.</p></div>}
  @else{@for(t of tasks();track t._id){<article class="task-row review-queue-row">
   <span class="status-mark done"><i class="bi bi-hourglass-split"></i></span>
   <a class="task-copy task-anchor" [routerLink]="['/app/tasks',t._id]"><b>{{t.title}}</b><p>{{t.description||'No description added'}}</p><small><span>Owner: {{ownerName(t)}}</span><span>{{t.assignedTo?.length||0}} assignee(s)</span><span>Submitted {{t.submittedAt?(t.submittedAt|date:'mediumDate'):'recently'}}</span></small></a>
   <span class="status-pill pending">Pending review</span>
   <a class="btn-primary small" [routerLink]="['/app/tasks',t._id]">Review task</a>
  </article>}}
 </section>`
})
export class ReviewQueueComponent implements OnInit{
 private readonly api=inject(ApiService);
 readonly tasks=signal<Todo[]>([]);
 readonly loading=signal(false);
 readonly error=signal('');
 ngOnInit():void{this.load();}
 load():void{this.loading.set(true);this.error.set('');this.api.reviewQueue(1,100).subscribe({next:r=>{this.tasks.set(r.data||[]);this.loading.set(false);},error:e=>{this.error.set(e.error?.message||'Could not load review queue.');this.loading.set(false);}});}
 ownerName(todo:Todo):string{const owner=todo.userId;return typeof owner==='object'&&owner?owner.fname+' '+owner.lname:'Task owner';}
}
`;
