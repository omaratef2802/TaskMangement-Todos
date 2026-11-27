import {CommonModule} from '@angular/common';
import {Component,Input,OnChanges,OnDestroy,OnInit,inject,signal} from '@angular/core';
import {Subscription} from 'rxjs';
import {SocketService} from './socket.service';
import {User} from './models';

@Component({
 standalone:true,
 selector:'app-user-avatar',
 imports:[CommonModule],
 template:`
  <span class="user-avatar" [style.width]="size" [style.height]="size" [attr.title]="name()" [attr.aria-label]="name()||'User avatar'">
   @if(image()){<img [src]="image()" [alt]="name()||'Profile photo'" (error)="image.set('')">}
   @else{<span>{{initials()}}</span>}
  </span>
 `,
 styles:[`
  :host{display:inline-flex;flex:none;vertical-align:middle}
  .user-avatar{display:inline-grid;place-items:center;overflow:hidden;border-radius:50%;background:var(--purple-soft,#f0edff);color:var(--purple,#7054e8);font-size:11px;font-weight:800;line-height:1}
  .user-avatar img{display:block;width:100%;height:100%;object-fit:cover}
  .user-avatar>span{display:grid;place-items:center;width:100%;height:100%}
 `]
})
export class UserAvatarComponent implements OnInit,OnChanges,OnDestroy{
 private readonly socket=inject(SocketService);
 private subscription?:Subscription;
 @Input() user:User|string|null|undefined=null;
 @Input() size='34px';
 readonly image=signal('');
 ngOnInit():void{
  this.syncImage();
  this.subscription=this.socket.profileUpdated$.subscribe(event=>{
   if(this.user&&typeof this.user==='object'&&this.user._id===event.userId)this.image.set(event.image||'');
  });
 }
 ngOnChanges():void{this.syncImage();}
 ngOnDestroy():void{this.subscription?.unsubscribe();}
 name():string{return this.user&&typeof this.user==='object'?[this.user.fname,this.user.lname].filter(Boolean).join(' '):'';}
 initials():string{return this.user&&typeof this.user==='object'?((this.user.fname?.[0]||'')+(this.user.lname?.[0]||'')).toUpperCase()||'U':'U';}
 private syncImage():void{this.image.set(this.user&&typeof this.user==='object'?this.user.image||'':'');}
}