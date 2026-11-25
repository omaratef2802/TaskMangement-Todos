import {Injectable,inject} from '@angular/core';
import {HttpClient,HttpHeaders,HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {ApiResponse,Attachment,ListQuery,NotificationItem,Todo,TodoActivity,TodoComment,TodoStats,User} from './models';
@Injectable({providedIn:'root'})
export class ApiService{
 private readonly http=inject(HttpClient);
 private readonly users=environment.apiUrl+'/user';
 private readonly todos=environment.apiUrl+'/todo';
 private readonly notificationsUrl=environment.apiUrl+'/notifications';
 private params(query:object):HttpParams{
  let params=new HttpParams();for(const [key,value] of Object.entries(query))if(value!==undefined&&value!=='')params=params.set(key,String(value));return params;
 }
 private resetHeaders(token:string):HttpHeaders{return new HttpHeaders({Authorization:token});}
 login(mail:string,password:string):Observable<ApiResponse<string>>{return this.http.post<ApiResponse<string>>(this.users+'/login',{mail,password});}
 register(payload:{fname:string;lname:string;username:string;mail:string;password:string}):Observable<ApiResponse<User>>{return this.http.post<ApiResponse<User>>(this.users+'/signin',payload);}
 forgotPassword(mail:string):Observable<ApiResponse<string>>{return this.http.post<ApiResponse<string>>(this.users+'/forgetPassword',{mail});}
 verifyOtp(otp:string,token:string):Observable<ApiResponse<string>>{return this.http.post<ApiResponse<string>>(this.users+'/verifyOTP',{otp},{headers:this.resetHeaders(token)});}
 resetPassword(newPassword:string,token:string):Observable<ApiResponse<unknown>>{return this.http.patch<ApiResponse<unknown>>(this.users+'/resetPassword',{newPassword},{headers:this.resetHeaders(token)});}
 profile():Observable<ApiResponse<User>>{return this.http.get<ApiResponse<User>>(this.users+'/MyProfile');}
 updateProfile(payload:Partial<Pick<User,'fname'|'lname'|'username'>>):Observable<ApiResponse<User>>{return this.http.patch<ApiResponse<User>>(this.users+'/updateProfile',payload);}
 updatePassword(currentPassword:string,newPassword:string,confirmPassword:string):Observable<ApiResponse<User>>{return this.http.patch<ApiResponse<User>>(this.users+'/updatePassword',{Password:currentPassword,newPassword,confirmPassword});}
 uploadProfileImage(file:File):Observable<ApiResponse<User>>{const body=new FormData();body.append('image',file);return this.http.patch<ApiResponse<User>>(this.users+'/uploadImage',body);}
 usersList(page=1,limit=20):Observable<ApiResponse<User[]>>{return this.http.get<ApiResponse<User[]>>(this.users+'/MyUsers',{params:this.params({page,limit})});}
 deleteUser(id:string):Observable<unknown>{return this.http.delete(this.users+'/deleteUsers/'+id);}
 stats():Observable<ApiResponse<TodoStats>>{return this.http.get<ApiResponse<TodoStats>>(this.todos+'/stats');}
 list(query:ListQuery={}):Observable<ApiResponse<Todo[]>>{return this.http.get<ApiResponse<Todo[]>>(this.todos+'/AllTodos',{params:this.params(query)});}
 allUsersTodos(query:ListQuery={}):Observable<ApiResponse<Todo[]>>{return this.http.get<ApiResponse<Todo[]>>(this.todos+'/AllTodosUsers',{params:this.params(query)});}
 assignedToMe(query:ListQuery={}):Observable<ApiResponse<Todo[]>>{return this.http.get<ApiResponse<Todo[]>>(this.todos+'/assignedToMe',{params:this.params(query)});}
 assignedByMe(query:ListQuery={}):Observable<ApiResponse<Todo[]>>{return this.http.get<ApiResponse<Todo[]>>(this.todos+'/assignedByMe',{params:this.params(query)});}
 getTodo(id:string):Observable<ApiResponse<Todo>>{return this.http.get<ApiResponse<Todo>>(this.todos+'/todo/'+id);}
 createTodo(payload:Partial<Todo>):Observable<ApiResponse<Todo>>{return this.http.post<ApiResponse<Todo>>(this.todos+'/addTodo',payload);}
 updateTodo(id:string,payload:Partial<Todo>):Observable<ApiResponse<Todo>>{return this.http.patch<ApiResponse<Todo>>(this.todos+'/updateTodo/'+id,payload);}
 assignTodo(id:string,userIds:string[]):Observable<ApiResponse<Todo>>{return this.http.patch<ApiResponse<Todo>>(this.todos+'/assign/'+id,{userIds});}
 inviteTodo(id:string,email:string):Observable<{message:string;data:unknown;status:"assigned"|"invited"}>{return this.http.post<{message:string;data:unknown;status:"assigned"|"invited"}>(this.todos+'/invite/'+id,{email});}
 unassignTodo(id:string,userId:string):Observable<ApiResponse<Todo>>{return this.http.patch<ApiResponse<Todo>>(this.todos+'/unassign/'+id,{userId});}
 assignableUsers(search='',page=1):Observable<ApiResponse<User[]>>{return this.http.get<ApiResponse<User[]>>(this.todos+'/assignableUsers',{params:this.params({search,page,limit:20})});}
 updateAssignedStatus(id:string,status:string):Observable<ApiResponse<Todo>>{return this.http.patch<ApiResponse<Todo>>(this.todos+'/assigned/'+id+'/status',{status});}
 moveToTrash(id:string):Observable<unknown>{return this.http.delete(this.todos+'/deleteTodo/'+id);}
 clearTodos():Observable<{message:string;deletedCount:number}>{return this.http.delete<{message:string;deletedCount:number}>(this.todos+'/clearTodo');}
 trash(query:ListQuery={}):Observable<ApiResponse<Todo[]>>{return this.http.get<ApiResponse<Todo[]>>(this.todos+'/trash',{params:this.params(query)});}
 restoreTodo(id:string):Observable<ApiResponse<Todo>>{return this.http.patch<ApiResponse<Todo>>(this.todos+'/restore/'+id,{});}
 permanentlyDeleteTodo(id:string):Observable<unknown>{return this.http.delete(this.todos+'/permanent/'+id);}
 comments(todoId:string,page=1):Observable<ApiResponse<TodoComment[]>>{return this.http.get<ApiResponse<TodoComment[]>>(this.todos+'/comments/'+todoId,{params:this.params({page,limit:50})});}
 addComment(todoId:string,text:string):Observable<ApiResponse<TodoComment>>{return this.http.post<ApiResponse<TodoComment>>(this.todos+'/comments/'+todoId,{text});}
 updateComment(todoId:string,commentId:string,text:string):Observable<ApiResponse<TodoComment>>{return this.http.patch<ApiResponse<TodoComment>>(this.todos+'/comments/'+todoId+'/'+commentId,{text});}
 deleteComment(todoId:string,commentId:string):Observable<unknown>{return this.http.delete(this.todos+'/comments/'+todoId+'/'+commentId);}
 activity(todoId:string,page=1):Observable<ApiResponse<TodoActivity[]>>{return this.http.get<ApiResponse<TodoActivity[]>>(this.todos+'/activity/'+todoId,{params:this.params({page,limit:50})});}
 uploadAttachments(todoId:string,files:File[]):Observable<ApiResponse<Attachment[]>>{const body=new FormData();files.forEach(file=>body.append('attachments',file));return this.http.post<ApiResponse<Attachment[]>>(this.todos+'/'+todoId+'/attachments',body);}
 deleteAttachment(todoId:string,attachmentId:string):Observable<unknown>{return this.http.delete(this.todos+'/'+todoId+'/attachments/'+attachmentId);}
 notifications(query:{page?:number;limit?:number;isRead?:boolean}={}):Observable<ApiResponse<NotificationItem[]>>{return this.http.get<ApiResponse<NotificationItem[]>>(this.notificationsUrl,{params:this.params(query)});}
 unreadCount():Observable<ApiResponse<{unreadCount:number}>>{return this.http.get<ApiResponse<{unreadCount:number}>>(this.notificationsUrl+'/unread-count');}
 markNotificationRead(id:string):Observable<unknown>{return this.http.patch(this.notificationsUrl+'/'+id+'/read',{});}
 markAllNotificationsRead():Observable<unknown>{return this.http.patch(this.notificationsUrl+'/read-all',{});}
 deleteNotification(id:string):Observable<unknown>{return this.http.delete(this.notificationsUrl+'/'+id);}
 clearNotifications():Observable<unknown>{return this.http.delete(this.notificationsUrl+'/clear');}
}
