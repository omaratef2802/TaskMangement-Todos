import {Injectable,signal} from '@angular/core';
import {Subject} from 'rxjs';
import {io,Socket} from 'socket.io-client';
import {environment} from '../../environments/environment';
@Injectable({providedIn:'root'})
export class SocketService{
 private socket?:Socket;
 readonly connected=signal(false);
 readonly notification$=new Subject<unknown>();
 readonly todoChanged$=new Subject<{todoId:string;action:string}>();
 connect(token:string,onNotification:()=>void):void{
  this.disconnect();this.socket=io(environment.socketUrl,{auth:{token}});
  this.socket.on('connect',()=>this.connected.set(true));
  this.socket.on('disconnect',()=>this.connected.set(false));
  this.socket.on('notification:new',(notification:unknown)=>{this.notification$.next(notification);onNotification();});
  this.socket.on('todo:changed',(event:{todoId:string;action:string})=>this.todoChanged$.next(event));
 }
 disconnect():void{this.socket?.removeAllListeners();this.socket?.disconnect();this.socket=undefined;this.connected.set(false);}
}
