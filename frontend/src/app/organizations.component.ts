import {CommonModule} from '@angular/common';
import {Component,OnInit,inject,signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {ApiService} from './core/api.service';
import {Organization} from './core/models';
import {UserAvatarComponent} from './core/user-avatar.component';

@Component({standalone:true,selector:'app-organizations',imports:[CommonModule,RouterLink,UserAvatarComponent],template:`
<div class="org-page">
 <header class="page-heading"><div><span class="eyebrow">YOUR TEAM SPACES</span><h1>Organizations</h1><p class="muted">All organizations you belong to, in one place.</p></div><button class="btn-primary" (click)="showForm.set(!showForm())"><i class="bi bi-plus-lg"></i> New organization</button></header>
 @if(error()){<div class="alert-error">{{error()}}</div>}@if(message()){<div class="alert-success">{{message()}}</div>}
 @if(showForm()){<section class="surface create-form"><h3>Create organization</h3><div><input [value]="name()" (input)="name.set($any($event.target).value)" placeholder="Organization name"><input [value]="description()" (input)="description.set($any($event.target).value)" placeholder="Description (optional)"><button class="btn-primary" [disabled]="saving()" (click)="create()">Create</button></div></section>}
 <section class="org-section"><div class="section-heading"><div><h2>Your organizations</h2><p class="muted">Open an organization to see its workspaces and team tasks.</p></div><span class="count">{{organizations().length}}</span></div>
 @if(loading()){<div class="empty-state">Loading organizations…</div>}
 @else if(!organizations().length){<div class="surface empty-state"><i class="bi bi-buildings"></i><h3>No organizations yet</h3><p>Create an organization or ask a teammate to invite you.</p><button class="btn-primary" (click)="showForm.set(true)">Create organization</button></div>}
 @else{<div class="org-grid">@for(org of organizations();track org._id){<a class="surface org-card" [routerLink]="['/app/organizations',org._id]"><span class="org-icon"><i class="bi bi-building"></i></span><span class="org-info"><b>{{org.name}}</b><small>{{org.members.length}} members</small><div class="org-avatars">@for(member of org.members.slice(0,4);track member.userId){<app-user-avatar [user]="memberUser(member.userId)" size="25px"></app-user-avatar>}</div><em>{{org.description||'No description added.'}}</em></span><i class="bi bi-arrow-up-right open-icon"></i></a>}</div>}
 </section>
</div>`,
styles:[`
.org-page{max-width:1180px;margin:0 auto}.org-avatars{display:flex;align-items:center;margin:7px 0}.org-avatars app-user-avatar{margin-left:-6px;border:2px solid var(--surface);border-radius:50%}.page-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:26px}.page-heading h1{font-size:30px;font-weight:750;margin:5px 0}.org-section{margin-top:20px}.section-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:15px}.section-heading h2{font-size:18px;font-weight:750;margin:0}.section-heading p{font-size:13px;margin:5px 0 0}.count{color:var(--muted);font-size:13px}.org-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}.org-card{display:flex;align-items:flex-start;gap:13px;padding:20px;color:inherit;text-decoration:none;transition:transform .18s,border-color .18s}.org-card:hover{transform:translateY(-2px);border-color:#8065df}.org-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:12px;background:rgba(112,82,220,.12);color:#7455d9;font-size:19px}.org-info{display:grid;gap:5px;flex:1;min-width:0}.org-info b{font-size:15px}.org-info small,.org-info em{font-size:12px;color:var(--muted);font-style:normal}.org-info em{margin-top:4px}.open-icon{color:#8065df}.create-form{padding:18px;margin-bottom:20px}.create-form h3{font-size:16px;margin-bottom:12px}.create-form>div{display:flex;gap:10px}.create-form input{flex:1;min-width:0;border:1px solid var(--border);border-radius:9px;padding:10px 12px;background:var(--input-bg);color:inherit}.empty-state{text-align:center;padding:50px 20px}.empty-state>i{font-size:32px;color:#8065df}.empty-state h3{font-size:18px;margin:12px 0 5px}.empty-state p{color:var(--muted);font-size:13px}@media(max-width:650px){.page-heading{align-items:flex-start;flex-direction:column}.create-form>div{flex-direction:column}}`
]})
export class OrganizationsComponent implements OnInit{
 private readonly api=inject(ApiService);
 readonly organizations=signal<Organization[]>([]);readonly loading=signal(true);readonly saving=signal(false);readonly error=signal('');readonly message=signal('');
 readonly showForm=signal(false);readonly name=signal('');readonly description=signal('');
 ngOnInit():void{this.load();}
 memberUser(value:unknown):any{return value&&typeof value==='object'?value:null;}
 load():void{this.loading.set(true);this.api.organizations().subscribe({next:r=>{this.organizations.set(r.data||[]);this.loading.set(false);},error:e=>{this.error.set(e.error?.message||'Could not load organizations.');this.loading.set(false);}});}
 create():void{if(this.name().trim().length<2)return;this.saving.set(true);this.api.createOrganization({name:this.name().trim(),description:this.description().trim()}).subscribe({next:()=>{this.saving.set(false);this.showForm.set(false);this.name.set('');this.description.set('');this.message.set('Organization created.');this.load();},error:e=>{this.saving.set(false);this.error.set(e.error?.message||'Could not create organization.');}});}
}