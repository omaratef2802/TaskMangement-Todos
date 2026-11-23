import {Routes} from '@angular/router';
import {authGuard,adminGuard,guestGuard} from './core/auth.guard';
import {AuthComponent} from './auth.component';
import {WorkspaceComponent} from './workspace.component';
import {DashboardComponent,TaskListComponent} from './tasks.component';
import {TaskDetailComponent} from './task-detail.component';
import {CalendarComponent} from './calendar.component';
import {NotificationsComponent,TrashComponent} from './personal-pages.component';
import {ProfileComponent,AdminComponent} from './account-pages.component';
export const routes:Routes=[
 {path:'login',component:AuthComponent,canActivate:[guestGuard]},
 {path:'register',component:AuthComponent,canActivate:[guestGuard],data:{mode:'register'}},
 {path:'forgot-password',component:AuthComponent,canActivate:[guestGuard],data:{mode:'forgot'}},
 {path:'app',component:WorkspaceComponent,canActivate:[authGuard],children:[
  {path:'',component:DashboardComponent},
  {path:'tasks',component:TaskListComponent,data:{mode:'mine'}},
  {path:'assigned',component:TaskListComponent,data:{mode:'assigned'}},
  {path:'assigned-by',component:TaskListComponent,data:{mode:'assignedBy'}},
  {path:'tasks/:id',component:TaskDetailComponent},
  {path:'calendar',component:CalendarComponent},
  {path:'notifications',component:NotificationsComponent},
  {path:'trash',component:TrashComponent},
  {path:'profile',component:ProfileComponent},
  {path:'admin',component:AdminComponent,canActivate:[adminGuard]},
 ]},
 {path:'',pathMatch:'full',redirectTo:'app'},
 {path:'**',redirectTo:'app'}
];
